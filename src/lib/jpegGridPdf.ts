/** Minimal PDF that embeds JPEG pages. No extra npm package. */

function jpegDimensions(buf: Buffer): { width: number; height: number } {
  let offset = 2
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) break
    const marker = buf[offset + 1]
    const size = buf.readUInt16BE(offset + 2)
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      }
    }
    offset += 2 + size
  }
  return { width: 800, height: 800 }
}

function pdfEscape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export function buildJpegGridPdf(
  cells: Array<{ jpeg: Buffer; caption?: string }>,
  columns = 4,
): Buffer {
  const pageW = 842
  const pageH = 595
  const margin = 28
  const gap = 10
  const captionH = 16
  const cols = Math.max(1, columns)
  const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols
  const cellH = cellW
  const rowsPerPage = Math.max(1, Math.floor((pageH - margin * 2 + gap) / (cellH + captionH + gap)))
  const perPage = cols * rowsPerPage
  const pages = Math.max(1, Math.ceil(cells.length / perPage))

  const objects: Buffer[] = []
  const offsets: number[] = [0]
  const addObj = (body: Buffer | string) => {
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'latin1')
    objects.push(buf)
    return objects.length
  }

  const imageIds: number[] = []
  for (const cell of cells) {
    const { width, height } = jpegDimensions(cell.jpeg)
    const dict = Buffer.from(
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${cell.jpeg.length} >>\nstream\n`,
      'latin1',
    )
    const end = Buffer.from('\nendstream', 'latin1')
    imageIds.push(addObj(Buffer.concat([dict, cell.jpeg, end])))
  }

  const pageIds: number[] = []
  const contentIds: number[] = []

  for (let pageIndex = 0; pageIndex < pages; pageIndex += 1) {
    const slice = cells.slice(pageIndex * perPage, (pageIndex + 1) * perPage)
    const ops: string[] = []
    slice.forEach((cell, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = margin + col * (cellW + gap)
      const yTop = pageH - margin - row * (cellH + captionH + gap)
      const y = yTop - cellH
      const imgIndex = pageIndex * perPage + index
      const { width, height } = jpegDimensions(cell.jpeg)
      const scale = Math.min(cellW / width, cellH / height)
      const drawW = width * scale
      const drawH = height * scale
      const dx = x + (cellW - drawW) / 2
      const dy = y + (cellH - drawH) / 2
      ops.push('q', `${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${dx.toFixed(2)} ${dy.toFixed(2)} cm`, `/Im${imgIndex} Do`, 'Q')
      const caption = pdfEscape(String(cell.caption || '').slice(0, 48))
      if (caption) {
        ops.push(
          'BT',
          '/F1 8 Tf',
          `0.2 0.16 0.14 rg`,
          `${x.toFixed(2)} ${(y - 12).toFixed(2)} Td`,
          `(${caption}) Tj`,
          'ET',
        )
      }
    })
    const stream = Buffer.from(ops.join('\n'), 'latin1')
    contentIds.push(
      addObj(`<< /Length ${stream.length} >>\nstream\n${stream.toString('latin1')}\nendstream`),
    )
  }

  const fontId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  for (let pageIndex = 0; pageIndex < pages; pageIndex += 1) {
    const xobjects = cells
      .slice(pageIndex * perPage, (pageIndex + 1) * perPage)
      .map((_, index) => {
        const imgIndex = pageIndex * perPage + index
        return `/Im${imgIndex} ${imageIds[imgIndex]} 0 R`
      })
      .join(' ')
    pageIds.push(
      addObj(
        `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${fontId} 0 R >> /XObject << ${xobjects} >> >> /Contents ${contentIds[pageIndex]} 0 R >>`,
      ),
    )
  }

  const pagesId = addObj(
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`,
  )
  const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

  const patched = objects.map((body, index) => {
    const id = index + 1
    let text = body.toString('latin1')
    if (id === pagesId) {
      // already final
    }
    if (pageIds.includes(id)) {
      text = text.replace('/Parent 0 0 R', `/Parent ${pagesId} 0 R`)
    }
    return Buffer.from(`${id} 0 obj\n${text}\nendobj\n`, 'latin1')
  })

  const header = Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')
  const parts = [header]
  let pos = header.length
  const xrefPos: number[] = [0]
  for (const obj of patched) {
    xrefPos.push(pos)
    parts.push(obj)
    pos += obj.length
  }
  const xrefStart = pos
  const xrefLines = ['xref', `0 ${patched.length + 1}`, '0000000000 65535 f ']
  for (let i = 1; i <= patched.length; i += 1) {
    xrefLines.push(`${String(xrefPos[i]).padStart(10, '0')} 00000 n `)
  }
  const xref = Buffer.from(`${xrefLines.join('\n')}\n`, 'latin1')
  const trailer = Buffer.from(
    `trailer\n<< /Size ${patched.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
    'latin1',
  )
  return Buffer.concat([...parts, xref, trailer])
}
