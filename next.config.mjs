import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** 这里是 ESM 环境，自己算 __dirname */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// monorepo 根：对齐 pnpm-lock.yaml 所在层级
const monoRoot = path.resolve(__dirname, '../../../../')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. 静态导出
  output: 'standalone',

  // 2. 文件追踪相关
  outputFileTracingRoot: monoRoot,
  outputFileTracingExcludes: {
    '*': [
      '**/.next/**',
      '**/node_modules/**',
      '**/generated/**',
      './code/generated/**'
    ]
  },

  // 经 ngrok / cloudflare tunnel 访问时放行跨域 dev origin 检查
  allowedDevOrigins: [
    '*.trycloudflare.com',
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
  ],

  // 3. 开发环境代理
  // 注意：rewrites 在静态导出模式下不工作，只在开发环境使用
  ...(process.env.NODE_ENV !== 'production' && {
    async rewrites() {
      return [
        {
          // 隧道访问时浏览器同源调用 /rpc，转发到本地 RPC 后端
          source: '/rpc/:path*',
          destination: 'http://localhost:3100/rpc/:path*',
        },
        {
          source: "/flow-engine/clash Ver/v2/run_flow",
          destination: "https://pztest.koudingvip.com/flow-engine/clash Ver/v2/run_flow",
        },
        {
          source: '/api/project_pz/getimage',
          destination: 'https://project.autocoder.cc/api/project_pz/getimage'
        },
        // Local dev has no nginx img-proxy — mirror prod proxy so alicdn images render
        {
          source: '/img-proxy/cbu01/:path*',
          destination: 'https://cbu01.alicdn.com/:path*',
        },
        {
          source: '/img-proxy/cbu02/:path*',
          destination: 'https://cbu02.alicdn.com/:path*',
        },
        {
          source: '/img-proxy/gw/:path*',
          destination: 'https://gw.alicdn.com/:path*',
        },
      ]
    }
  }),

  experimental: {
    externalDir: true,
    cpus: 4
  },

  transpilePackages: ['components'],

  // turbopack 与 webpack.resolve.alias 对齐：客户端必须走 RPC stub，不能打到真实 'use server' actions
  turbopack: {
    root: monoRoot,
    resolveAlias: {
      '@/frontend/actions': path.resolve(__dirname, './lib/rpc-generated/src/frontend/actions'),
      '@/backend/actions': path.resolve(__dirname, './lib/rpc-generated/src/backend/actions'),
      '@/app/actions': path.resolve(__dirname, './lib/rpc-generated/src/app/actions'),
      '@': path.resolve(__dirname, './src'),
      '@/server': path.resolve(__dirname, './server'),
    },
  },

  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  images: {
    // Enable Next.js optimizer → WebP/AVIF for remote product images
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
    // Optimized images cached 7 days (return visitors hit browser/CDN cache)
    minimumCacheTTL: 604800,
    remotePatterns: [
      { protocol: 'https', hostname: 'cbu01.alicdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cbu02.alicdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'gw.alicdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'img.alicdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'sc01.alicdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'sc02.alicdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'sc04.alicdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'productp.s3.us-west-2.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'sourcingjewelry.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.sourcingjewelry.com', pathname: '/**' },
      { protocol: 'https', hostname: 'img.sourcingjewelry.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.autocoder.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'autocoder.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'project.autocoder.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'pztest.koudingvip.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.koudingvip.com', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    ],
  },

  /**
   * Browser cache for hashed build assets — big win for return visitors.
   * Nginx should also set these (see deploy/nginx); Next headers cover direct :3000 / future CDN.
   */
  async headers() {
    const immutable = 'public, max-age=31536000, immutable'
    const oneDay = 'public, max-age=86400'
    const week = 'public, max-age=604800'
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: immutable }],
      },
      {
        source: '/_next/image',
        headers: [{ key: 'Cache-Control', value: week }],
      },
      {
        source: '/favicon.ico',
        headers: [{ key: 'Cache-Control', value: oneDay }],
      },
      {
        source: '/favicon.svg',
        headers: [{ key: 'Cache-Control', value: oneDay }],
      },
      {
        source: '/category-covers/:path*',
        headers: [{ key: 'Cache-Control', value: week }],
      },
      {
        source: '/:path*.(js|css|woff2|woff|ttf|otf|png|jpg|jpeg|gif|webp|avif|svg|ico)',
        headers: [{ key: 'Cache-Control', value: week }],
      },
    ]
  },

  productionBrowserSourceMaps: false,
  compress: true,

  env: {
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID || 'PROJ_fcb9e6ee_snap_20260726_092922_893',
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    NEXT_PUBLIC_RUNTIME_API: 'https://www.autocoder.cc/rpc',
    NEXT_PUBLIC_SITE_TITLE:
      process.env.NEXT_PUBLIC_SITE_TITLE || "外贸跨境电商独立站"
  },

  typescript: {
    ignoreBuildErrors: true
  },

  webpack: (config) => {
    // resolve aliases（与 turbopack.resolveAlias 对齐）
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@/frontend/actions': path.resolve(__dirname, './lib/rpc-generated/src/frontend/actions'),
      '@/backend/actions': path.resolve(__dirname, './lib/rpc-generated/src/backend/actions'),
      '@/app/actions': path.resolve(__dirname, './lib/rpc-generated/src/app/actions'),
    }

    config.module.rules.push(
      // declare-function-rewrite: types 中的 declare function → actions re-export
      {
        test: /\/src\/(frontend|backend|app)\/types\/\w+\.ts$/,
        exclude: /node_modules/,
        enforce: 'pre',
        use: [{
          loader: path.resolve(__dirname, './src/default/declare-function-rewrite-loader.cjs'),
          options: { projectRoot: __dirname }
        }]
      },
      // source-attributes-loader
      {
        test: /\.(tsx|jsx)$/,
        exclude: /node_modules/,
        enforce: 'pre',
        use: [{ loader: path.resolve(__dirname, './src/default/source-attributes-loader.js') }]
      },
      // rpc-loader for actions
      {
        test: /[\\/]actions[\\/].+\.ts$|[\\/]app[\\/].+[\\/]actions\.ts$/,
        exclude: /node_modules/,
        use: [{ loader: path.resolve(__dirname, 'scripts/rpc-loader.js') }]
      }
    )
    return config
  },
}

export default nextConfig
