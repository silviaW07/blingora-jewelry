#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createInterface } from "readline";
import { execSync } from "child_process";
import { pathToFileURL } from "url";

const PROJECT_ID = "PROJ_fcb9e6ee_snap_20260726_092922_893";
const PROJECT_ROOT = ".";

function ask(question, { hidden = false, defaultValue = "" } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      rl._writeToOutput = (str) => {
        if (str.includes(question)) {
          rl.output.write(question);
        } else {
          rl.output.write("*");
        }
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer || defaultValue);
    });
  });
}

function run(cmd) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: PROJECT_ROOT });
}

// 解析 SQL 文件内容为可执行的语句列表
function parseSqlStatements(sql) {
  return sql
    .split(/;\s*\n/)
    .map((s) =>
      s
        .split("\n")
        .filter((line) => {
          const t = line.trim();
          return t.length > 0 && !t.startsWith("--");
        })
        .join("\n")
        .trim()
    )
    .filter((s) => s.length > 0);
}

// 通过 PrismaClient 逐条执行 SQL 语句
async function executeSqlStatements(statements, databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
  const clientPath = pathToFileURL(resolve(process.cwd(), PROJECT_ROOT, "prisma-generated/client/index.js")).href;
  const { PrismaClient } = await import(clientPath);
  const prisma = new PrismaClient();
  for (const st of statements) {
    await prisma.$executeRawUnsafe(st + (st.endsWith(";") ? "" : ";"));
  }
  await prisma.$disconnect();
}

async function seedDatabase(databaseUrl) {
  const sqlPath = resolve(PROJECT_ROOT, "prisma/database.sql");
  const pwdSqlPath = resolve(PROJECT_ROOT, "prisma/seed_pwd.sql");

  if (existsSync(sqlPath)) {
    // 存在 database.sql，直接执行全量 SQL
    const sql = readFileSync(sqlPath, "utf-8");
    console.log("Running: prisma execute prisma/database.sql");
    const statements = parseSqlStatements(sql);
    await executeSqlStatements(statements, databaseUrl);
  } else if (existsSync(pwdSqlPath)) {
    // 存在 seed_pwd.sql，先执行 seed.ts 生成基础数据，再执行密码 DML
    console.log("Running: npx prisma db seed (seed.ts)");
    run("npx prisma db seed");
    const pwdSql = readFileSync(pwdSqlPath, "utf-8");
    console.log("Running: prisma execute prisma/seed_pwd.sql");
    const statements = parseSqlStatements(pwdSql);
    await executeSqlStatements(statements, databaseUrl);
  } else {
    // 都不存在，直接执行 seed.ts
    run("npx prisma db seed");
  }
}


async function main() {
  const pkgPath = resolve(PROJECT_ROOT, "package.json");
  if (!existsSync(pkgPath)) {
    console.error(`Error: package.json not found: ${pkgPath}`);
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const version = pkg.version;
  if (!version) {
    console.error("Error: missing version field in package.json");
    process.exit(1);
  }

  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Project Dir: ${PROJECT_ROOT}`);
  console.log(`Version: ${version}`);

  if (version === "1.0.0" || version === "3.0.0") {
    const dbHost = await ask("Database host [default: localhost]: ", { defaultValue: "localhost" });
    const dbPort = await ask("Database port [default: 3306]: ", { defaultValue: "3306" });
    const dbUser = await ask("Database user [default: root]: ", { defaultValue: "root" });
    const dbPass = await ask("Database password: ", { hidden: true });

    if (!dbPass) {
      console.error("Error: database password cannot be empty");
      process.exit(1);
    }

    const databaseUrl = `mysql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${PROJECT_ID}`;
    console.log(`Database URL: mysql://${dbUser}:****@${dbHost}:${dbPort}/${PROJECT_ID}`);

    const schemaPath = resolve(PROJECT_ROOT, "prisma/schema.prisma");
    if (!existsSync(schemaPath)) {
      console.error(`Error: schema.prisma not found: ${schemaPath}`);
      process.exit(1);
    }

    let schema = readFileSync(schemaPath, "utf-8");
    schema = schema.replace(
      /url\s*=\s*"mysql:\/\/[^"]*"/,
      `url      = "${databaseUrl}"`
    );
    writeFileSync(schemaPath, schema, "utf-8");
    console.log("Updated database URL in schema.prisma");

    run("npx prisma db push --force-reset --accept-data-loss");
    run("npx prisma generate");
    // run("npx prisma db seed");
    await seedDatabase(databaseUrl);

  } else {
    console.error(`Error: unknown version: ${version}, only 1.0.0(v1) is supported`);
    process.exit(1);
  }

  console.log("Done");
}

main();
