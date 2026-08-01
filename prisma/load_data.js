const fs = require('fs');
// 注意：请确保这里的路径指向你项目中实际生成的 prisma client 位置
const { PrismaClient, Prisma } = require('../prisma-generated/client');

const prisma = new PrismaClient();

/**
 * 解决 JSON.stringify 无法序列化 BigInt 和 Decimal 的问题
 * (保留这个函数是为了防止价格或ID字段报错)
 */
function jsonReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value && typeof value === 'object' && value.constructor.name === 'Decimal') {
    return value.toString();
  }
  return value;
}

async function fetchAllDataFlat() {
  console.log('🧠 正在读取 Prisma DMMF 元数据...');

  // 1. 获取所有模型定义
  const models = Prisma.dmmf.datamodel.models;

  if (!models || models.length === 0) {
    console.error('❌ 未检测到模型，请运行 npx prisma generate');
    return;
  }

  const exportData = {};

  // 2. 遍历所有模型
  for (const model of models) {
    const modelName = model.name;
    // 将 PascalCase (如 User) 转换为 camelCase (如 user) 以匹配 prisma 实例方法
    const clientKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);

    // 检查 Prisma Client 上是否有该模型的方法
    if (!prisma[clientKey]) continue;

    console.log(`\n🔍 正在获取模型数据: [${modelName}]`);

    try {
      // --- 核心修改：直接查询，不带任何 include ---
      const data = await prisma[clientKey].findMany();

      exportData[modelName] = data;
      console.log(`   ✅ 成功抓取 ${data.length} 条记录`);

    } catch (err) {
      console.error(`   ❌ 获取 ${modelName} 失败: ${err.message}`);
    }
  }

  return exportData;
}

async function main() {
  const allData = await fetchAllDataFlat();

  // 3. 写入文件
  const fileName = 'flat_db_dump.json';
  fs.writeFileSync(fileName, JSON.stringify(allData, jsonReplacer, 2));

  console.log('-------------------------------------------');
  console.log(`🎉 纯净数据导出完成！文件已保存为: ${fileName}`);
  console.log('-------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });