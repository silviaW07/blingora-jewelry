import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// Resolve the plugin from THIS package so Windows paths with spaces
// (e.g. D:\clash Ver\...) do not break PostCSS module lookup.
const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let tailwindPostcss
try {
  tailwindPostcss = require.resolve('@tailwindcss/postcss', { paths: [__dirname] })
} catch {
  tailwindPostcss = '@tailwindcss/postcss'
}

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [tailwindPostcss],
}

export default config
