#!/usr/bin/env node
/**
 * 快速后端构建脚本 - 使用 swc-loader 替代 ts-loader
 * 
 * 性能对比：
 * - webpack + ts-loader: ~2-3s
 * - webpack + swc-loader: ~500ms
 * 
 * 依赖：@swc/core, swc-loader（需要安装 swc-loader）
 * 安装：pnpm add swc-loader -D
 * 
 * 用法: node build-server-fast.mjs [PROJECT_ID]
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = process.cwd();
const OUT_DIR = path.resolve(ROOT_DIR, 'server-action-generated');

// 自动检测 PROJECT_ID
function detectProjectId() {
  if (process.argv[2]) return process.argv[2];
  if (process.env.PROJECT_ID) return process.env.PROJECT_ID;
  
  const folderName = path.basename(ROOT_DIR);
  if (folderName.startsWith('PROJ_')) return folderName;
  
  const parentName = path.basename(path.dirname(ROOT_DIR));
  if (parentName.startsWith('PROJ_')) return parentName;
  
  return 'server-bundle';
}

const PROJECT_ID = detectProjectId();

async function main() {
  const startTime = performance.now();
  
  // 确保输出目录存在
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  
  // 检查 swc-loader 是否安装
  let useSwcLoader = true;
  try {
    require.resolve('swc-loader');
  } catch {
    useSwcLoader = false;
    console.log('⚠️  swc-loader 未安装，回退到 ts-loader（较慢）');
    console.log('   安装命令: pnpm add swc-loader -D');
  }
  
  const webpack = require('webpack');
  
  const config = {
    mode: 'production',
    entry: path.join(ROOT_DIR, 'server/bundled-entry.ts'),
    target: 'node',
    output: {
      path: OUT_DIR,
      filename: `${PROJECT_ID}.js`,
      library: { type: 'commonjs' },
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@/tools/prisma$': path.join(ROOT_DIR, 'src/tools/prisma.ts'),
        '@/tools/prisma-proxy$': path.join(ROOT_DIR, 'src/tools/prisma.ts'),
        '@/thirdparty': path.join(ROOT_DIR, 'server/thirdparty'),
        '@': path.join(ROOT_DIR, 'src'),
        '../prisma-generated/client': path.join(ROOT_DIR, 'prisma-generated/client'),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: useSwcLoader ? {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'typescript', decorators: true },
                target: 'es2019',
              },
              module: { type: 'commonjs' },
            },
          } : {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: 'tsconfig.server.json',
            },
          },
        },
      ],
    },
    externals: { express: 'commonjs express' },
    plugins: [
      new webpack.IgnorePlugin({ resourceRegExp: /^pg-native$/ }),
    ],
    optimization: { minimize: false },
    stats: 'errors-only',
  };
  
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(0);
      
      if (err || stats?.hasErrors()) {
        console.error('❌ Server build failed');
        if (stats) console.error(stats.toString({ colors: true }));
        reject(err || new Error('Build failed'));
        return;
      }
      
      console.log(`✅ Server (${duration}ms) → ${PROJECT_ID}.js`);
      resolve();
    });
  });
}

main().catch(() => process.exit(1));
