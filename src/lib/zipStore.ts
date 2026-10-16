/** Uncompressed ZIP (STORE). JPEGs do not benefit from extra deflate. */

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function u16(value: number) {
  const buf = Buffer.alloc(2)
  buf.writeUInt16LE(value >>> 0, 0)
  return buf
}

function u32(value: number) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32LE(value >>> 0, 0)
  return buf
}

export function buildZipStore(files: Array<{ name: string; data: Buffer }>): Buffer {
  const chunks: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const name = Buffer.from(file.name.replace(/\\/g, '/'), 'utf8')
    const data = file.data
    const checksum = crc32(data)
    const local = Buffer.concat([
      Buffer.from('PK\u0003\u0004', 'binary'),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ])
    chunks.push(local)
    centrals.push(
      Buffer.concat([
        Buffer.from('PK\u0001\u0002', 'binary'),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(checksum),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]),
    )
    offset += local.length
  }

  const central = Buffer.concat(centrals)
  const end = Buffer.concat([
    Buffer.from('PK\u0005\u0006', 'binary'),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ])
  return Buffer.concat([...chunks, central, end])
}
