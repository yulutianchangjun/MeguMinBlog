export interface ImageResult {
  dataUrl: string
  width: number
  height: number
  bytes: number
}

export interface CoverBlobResult {
  blob: Blob
  ext: string
  width: number
  height: number
  bytes: number
}

const MAX_SOURCE_BYTES = 12 * 1024 * 1024

function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.round((base64.length * 3) / 4)
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      /* 回退到 Image */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('图片解析失败'))
      img.src = url
    })
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * 把本地图片压缩成可直接存入 localStorage 的 data URL。
 * 默认长边 1280、WebP 0.82，一般落在 120~350KB。
 */
export async function fileToCover(
  file: File,
  options: { maxSize?: number; quality?: number } = {},
): Promise<ImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件（JPG / PNG / WebP）')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('图片超过 12MB，请先压缩后再上传')
  }

  const maxSize = options.maxSize ?? 1280
  const quality = options.quality ?? 0.82
  const bitmap = await loadBitmap(file)
  const sourceWidth = 'width' in bitmap ? bitmap.width : 0
  const sourceHeight = 'height' in bitmap ? bitmap.height : 0
  if (!sourceWidth || !sourceHeight) throw new Error('无法读取图片尺寸')

  const ratio = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * ratio))
  const height = Math.max(1, Math.round(sourceHeight * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('浏览器不支持 Canvas 压缩')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)

  let dataUrl = canvas.toDataURL('image/webp', quality)
  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close()

  return { dataUrl, width, height, bytes: dataUrlBytes(dataUrl) }
}

/**
 * 压缩并产出 Blob（供上传到后端 /api/admin/upload）。
 * 默认长边 1280、WebP 0.82，不支持 WebP 编码时回退 JPEG。
 */
export async function fileToCoverBlob(
  file: File,
  options: { maxSize?: number; quality?: number } = {},
): Promise<CoverBlobResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件（JPG / PNG / WebP）')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('图片超过 12MB，请先压缩后再上传')
  }

  const maxSize = options.maxSize ?? 1280
  const quality = options.quality ?? 0.82
  const bitmap = await loadBitmap(file)
  const sourceWidth = 'width' in bitmap ? bitmap.width : 0
  const sourceHeight = 'height' in bitmap ? bitmap.height : 0
  if (!sourceWidth || !sourceHeight) throw new Error('无法读取图片尺寸')

  const ratio = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * ratio))
  const height = Math.max(1, Math.round(sourceHeight * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('浏览器不支持 Canvas 压缩')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)

  let ext = 'webp'
  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  )
  if (!blob || blob.type !== 'image/webp') {
    ext = 'jpeg'
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
  }
  if (!blob) throw new Error('图片编码失败，请换一张试试')

  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close()

  return { blob, ext, width, height, bytes: blob.size }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
