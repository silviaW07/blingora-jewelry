
import { Playfair_Display, Jost, JetBrains_Mono } from 'next/font/google';


// 标题字体 
export const header = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-header',
  display: 'swap'
});

// 正文字体 - 映射到 Tailwind 的 font-sans 和 font-serif
export const body = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap'
});

// 代码字体 - 映射到 Tailwind 的 font-mono
export const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap'
});
