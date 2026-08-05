/**
 * Keyword → image URL lookup for EditableImg / storefront surfaces.
 *
 * Intentionally isolated from upload + compress so Turbopack HMR of those
 * modules cannot invalidate this factory while client EditableImg instances
 * still require it.
 */

/**
 * Resolve a keyword / remote asset id into an image URL.
 */
export async function get_image_url(
  keywords: string,
  orientation: string,
  propKey: string,
  project_id: string,
  description: string = '',
  need_large_image: boolean = false,
  signal?: AbortSignal,
): Promise<string> {
  let url = 'null'
  try {
    if (keywords.startsWith('data:') || keywords.startsWith('http')) {
      return keywords
    }
    const uniqueIndex = Array.from(propKey).reduce(
      (acc, char) => (acc + char.charCodeAt(0)) % 10,
      0,
    )
    const response = await fetch('https://project.autocoder.cc/api/project_pz/getimage', {
      method: 'POST',
      headers: {
        Authorization:
          (typeof localStorage !== 'undefined' && localStorage.getItem('full_token')) || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: keywords,
        orientation: orientation,
        index: uniqueIndex,
        project_id: project_id,
        description: description,
        need_large_image: need_large_image,
      }),
      signal,
    })
    if (response.ok) {
      const datas = await response.json()
      url = datas['url']
    } else {
      console.error('Failed to load config. Status:', response.status)
    }
  } catch (error) {
    console.error('An error occurred while loading config:', error)
  }
  return url
}

export default get_image_url
