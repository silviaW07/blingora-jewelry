//import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nextCoreWebVitals = nextPlugin.configs['core-web-vitals'] ?? { rules: {} };

export default [
  {
    ignores: [
      'src/assets/**',
      'src/utils/**',
      'src/font/**',
      'src/ui/**',
      'src/default/**',
      'src/@base/**',
      'src/main.tsx',
      'src/index.css',
      '.eslintrc.js',
      '**/.eslintrc.js',
      '.history/**',
      '.eslintcache',
      'eslint.config.mjs',
      '.next/**'
    ]
  },

  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser, ...globals.node, NodeJS: "readonly", React: "readonly", JSX: "readonly",
        API_URL: "readonly", 
        ENV: "readonly",

      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // 不启用类型感知：不提供 project，避免与 tsc 交叉
        tsconfigRootDir: __dirname,
        warnOnUnsupportedTypeScriptVersion: false
      }
    },
    plugins: {
      '@typescript-eslint': ts,
      react: reactPlugin,
      'react-hooks': reactHooks,
      import: importPlugin,
      '@next/next': nextPlugin
    },
    settings: {
      react: { version: 'detect' },
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import/resolver': {
        // typescript: { project: ['./tsconfig.app.json'] },
        // typescript: { project: [path.resolve(__dirname, './tsconfig.app.json')] },
        alias: {
          map: [
            ['@ui', path.resolve(__dirname, 'src/ui')],
            ['@utils', path.resolve(__dirname, 'src/utils')],
            ['@repo/shadcn-ui/components/ui', path.resolve(__dirname, 'src/components/ui')],
            ['@repo/shadcn-ui/lib', path.resolve(__dirname, 'src/lib')],
            ['@/lib', path.resolve(__dirname, 'src/lib')],
            ['@/server', path.resolve(__dirname, 'server')],
            ['@', path.resolve(__dirname, 'src')],
          ],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] }
      }
    },
    rules: {
      ...nextCoreWebVitals.rules,
      'import/no-unresolved': 'error',
      'no-undef': 'error',
      'react/jsx-no-undef': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react/no-unknown-property': ['error', { ignore: ['css'] }],

      // 导入类红线也升为错误，避免构建/运行期隐患
      'import/no-self-import': 'error',
      'import/no-cycle': ['error', { maxDepth: 10 }],
      'no-unreachable': 'off',
      'no-constant-condition': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/ban-ts-ignore': 'off',
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-type-assertion': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/prefer-enum-initializers': 'off',
      '@typescript-eslint/prefer-includes': 'off',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',
      '@typescript-eslint/require-array-sort-compare': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-string-expressions': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      'no-empty': 'off',
      'eslint-comments/no-unused-disable': 'off',
      'eslint-comments/disable-enable-pair': 'off',
      'eslint-comments/no-restricted-disable': 'off',
      'eslint-comments/no-use': 'off'
    }
  },

  // 后端：server 目录（Node/Prisma 等）
  {
    files: ['server/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: false },
        // 不启用类型感知
        tsconfigRootDir: __dirname,
        warnOnUnsupportedTypeScriptVersion: false,
        noWarnOnMultipleProjects: true
      }
    },
    plugins: {
      '@typescript-eslint': ts,
      import: importPlugin
    },
    settings: {
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import/resolver': {
        // typescript: { project: [path.resolve(__dirname, './tsconfig.app.json'), path.resolve(__dirname, './tsconfig.server.json')], alwaysTryTypes: true },
        alias: {
          map: [
            ['@ui', path.resolve(__dirname, 'src/ui')],
            ['@utils', path.resolve(__dirname, 'src/utils')],
          ],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] }
      }
    },
    rules: {
      // 仅保留关键红线
      'import/no-unresolved': 'error',
      'no-undef': 'error',
      // 其余全部关闭
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },

  {
    files: ['src/**/*.tsx', 'app/**/*.tsx'],
    rules: {
      // 确实可能导致渲染失败/行为异常：作为 error
      'react/no-typos': 'error',
      // 纯规范类：不作为红线
      'react/self-closing-comp': 'off',
      // 避免与 react/jsx-no-undef 就同一 JSX 标识符重复报错
     
    }
  },

  // 仅对 TS/TSX 文件关闭核心 no-undef，避免将类型名误报为未定义
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off'
    }
  }
];