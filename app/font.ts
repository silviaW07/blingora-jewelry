import { Outfit } from 'next/font/google'

/**
 * 全站英文首选：Outfit（现代轻奢无衬线）。
 * Outfit 为可变字体，省略 weight 即加载单个可变字体文件（覆盖 100–900 全部字重），
 * 相比列举离散字重可减少字体请求数，移动端文字更快显示，且不丢任何字重。
 */
export const header = Outfit({
  subsets: ['latin'],
  variable: '--font-header',
  display: 'swap',
})

export const body = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const display = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})
