export type DecorateKind = 'text' | 'image' | 'button' | 'block'



export type DecoratePatch = {

  text?: string

  fontSize?: number

  color?: string

  /** 区块/元素背景色，应用于外层容器 */

  backgroundColor?: string

  padding?: number

  marginTop?: number

  marginBottom?: number

  marginLeft?: number

  marginRight?: number

  imageUrl?: string

  /** 超链接：文字、按钮、邮箱等可跳转地址 */

  href?: string

  /** 加粗：400 / 700 */
  fontWeight?: number

  /** 边框宽度 px，0 为无边框 */
  borderWidth?: number

  borderColor?: string

  borderRadius?: number

  /** 删除后不渲染该装修区块；发布后永久不再加载 */

  hidden?: boolean

}



export type DecorateStore = Record<string, DecoratePatch>



export const DECORATE_STORAGE_KEY = 'autocoder:page-decorate:v1'

export const DECORATE_QUERY = 'decorate'


