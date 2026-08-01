const path = require('path');
const webpack = require('webpack');

const OUT_DIR = path.resolve(__dirname, 'server-action-generated');

// 自动从项目文件夹名读取 PROJECT_ID（格式：PROJ_xxxxxxxx）
const folderName = path.basename(__dirname);
const PROJECT_ID = process.env.PROJECT_ID || (folderName.startsWith('PROJ_') ? folderName : null) || (() => {
  // 尝试从父目录名读取
  const parentName = path.basename(path.dirname(__dirname));
  return parentName.startsWith('PROJ_') ? parentName : 'server-bundle';
})();

module.exports = {
  mode: 'production',
  entry: './server/bundled-entry.ts',
  target: 'node',
  output: {
    path: OUT_DIR,
    filename: `${PROJECT_ID}.js`,
    library: {
      type: 'commonjs',
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@/tools/prisma$': path.resolve(__dirname, 'src/tools/prisma.ts'),
      '@/tools/prisma-proxy$': path.resolve(__dirname, 'src/tools/prisma.ts'),
      '@/thirdparty': path.resolve(__dirname, 'server/thirdparty'),
      '@': path.resolve(__dirname, 'src'),
      // prisma-generated 在项目根目录
      '../prisma-generated/client': path.resolve(__dirname, 'prisma-generated/client'),
      'next/headers': path.resolve(__dirname, 'lib/next-cookies-shim.ts'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: 'tsconfig.server.json'
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    express: 'commonjs express',
  },
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /^pg-native$/ }),
  ],
  optimization: {
    minimize: false,
  },
  stats: {
    preset: 'errors-only',    // 只输出错误
    errorDetails: true,       // 保留错误详情
    moduleTrace: true,        // 保留模块追踪（@ 引用链）
    colors: false,            // 禁用颜色方便解析
  },
};
