export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp'

export const MAX_IMAGE_BYTES = 1048576 // 1 MB

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG = [0xff, 0xd8, 0xff]

function startsWith(buf: Uint8Array, bytes: number[], offset = 0) {
  return buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b)
}

/** Detecta o tipo pelos primeiros bytes do arquivo, ignorando o Content-Type enviado. */
export function detectImageType(buf: Uint8Array): ImageMime | null {
  if (startsWith(buf, JPEG)) return 'image/jpeg'
  if (startsWith(buf, PNG)) return 'image/png'
  // WebP: "RIFF" nos bytes 0-3 e "WEBP" nos bytes 8-11
  if (
    startsWith(buf, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp'
  }
  return null
}
