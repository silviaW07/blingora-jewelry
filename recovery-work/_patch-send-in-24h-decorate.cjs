const path = require('path')
const { PrismaClient } = require(path.join(process.cwd(), 'prisma-generated/client'))
const p = new PrismaClient()
;(async () => {
  const setting = await p.sitesetting.findFirst({
    where: { title: 'PAGE_VISUAL_DECORATE' },
    select: { id: true, contentJson: true },
  })
  if (!setting?.id) throw new Error('PAGE_VISUAL_DECORATE missing')
  const json =
    setting.contentJson && typeof setting.contentJson === 'object' && !Array.isArray(setting.contentJson)
      ? { ...setting.contentJson }
      : {}
  json.home_service_3_title = {
    ...(json.home_service_3_title && typeof json.home_service_3_title === 'object'
      ? json.home_service_3_title
      : {}),
    text: 'Send in 24H',
  }
  await p.sitesetting.update({
    where: { id: setting.id },
    data: { contentJson: json },
  })
  console.log('updated', json.home_service_3_title)
  await p.$disconnect()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
