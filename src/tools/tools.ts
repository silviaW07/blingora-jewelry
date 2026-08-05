/**
 * Image helpers barrel (backward compatible).
 *
 * Prefer direct imports:
 * - get_image_url  → `@/tools/get-image-url`  (EditableImg / storefront — stable)
 * - upload_image_* → `@/tools/upload-image`   (admin / product / decorate)
 *
 * Do not add compress-image static imports here. Do not let EditableImg import
 * this barrel; HMR of upload/compress must not invalidate EditableImg's factory.
 */

export { get_image_url } from './get-image-url'
export { default } from './get-image-url'
export { upload_image_file, upload_project_file } from './upload-image'
