// 01）封面宽高比常量（NOTE_COVER_ASPECT）
/** 图文笔记封面比例 3:4 */
export const NOTE_ARTICLE_COVER_ASPECT = { width: 3, height: 4 } as const

/** 视频笔记封面比例 16:9 */
export const NOTE_VIDEO_COVER_ASPECT = { width: 16, height: 9 } as const

/** 图文封面上传输出宽度（像素） */
export const NOTE_ARTICLE_COVER_OUTPUT_WIDTH = 480

/** 视频封面上传输出宽度（像素） */
export const NOTE_VIDEO_COVER_OUTPUT_WIDTH = 1280

// 02）封面裁剪变换（CoverCropTransform）
export interface CoverCropTransform {
  /** 相对最小铺满缩放倍数，范围 [1, 3] */
  scale: number
  /** 水平偏移，归一化 [-1, 1]，0 为居中 */
  offsetX: number
  /** 垂直偏移，归一化 [-1, 1]，0 为居中 */
  offsetY: number
}

// 03）默认裁剪变换（getDefaultCoverCropTransform）
/**
 * 函数名：getDefaultCoverCropTransform
 * 功能：返回居中、最小缩放的默认封面裁剪参数。
 * 输出：
 * - 返回值：CoverCropTransform
 */
export function getDefaultCoverCropTransform(): CoverCropTransform {
  return { scale: 1, offsetX: 0, offsetY: 0 }
}

// 04）计算输出尺寸（resolveCoverOutputSize）
/**
 * 函数名：resolveCoverOutputSize
 * 功能：根据目标宽高比与输出宽度计算封面像素尺寸。
 * 输入：
 * - aspect：宽高比（如 3:4）
 * - outputWidth：输出宽度，默认按图文/视频常量
 * 输出：
 * - 返回值：{ width, height }
 */
export function resolveCoverOutputSize(
  aspect: { width: number; height: number },
  outputWidth: number,
): { width: number; height: number } {
  const height = Math.round((outputWidth * aspect.height) / aspect.width)
  return { width: outputWidth, height }
}

// 05）加载图片元素（loadImageFromSource）
/**
 * 函数名：loadImageFromSource
 * 功能：从 blob/data/http URL 加载 HTMLImageElement。
 * 输入：
 * - source：图片地址
 * 输出：
 * - 返回值：Promise<HTMLImageElement>
 */
export function loadImageFromSource(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    if (source.startsWith('http://') || source.startsWith('https://')) {
      image.crossOrigin = 'anonymous'
    }
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('无法加载图片'))
    image.src = source
  })
}

// 06）计算裁剪绘制参数（computeCoverDrawParams）
/**
 * 函数名：computeCoverDrawParams
 * 功能：根据 cover 缩放与偏移计算 canvas drawImage 参数。
 * 输入：
 * - imageWidth / imageHeight：原图尺寸
 * - outputWidth / outputHeight：输出画布尺寸
 * - transform：用户裁剪变换
 * 输出：
 * - 返回值：drawImage 用的 sx,sy,sWidth,sHeight 与 dx,dy,dWidth,dHeight
 */
export function computeCoverDrawParams(
  imageWidth: number,
  imageHeight: number,
  outputWidth: number,
  outputHeight: number,
  transform: CoverCropTransform,
): {
  sx: number
  sy: number
  sWidth: number
  sHeight: number
} {
  const clampedScale = Math.min(3, Math.max(1, transform.scale))
  const baseScale = Math.max(outputWidth / imageWidth, outputHeight / imageHeight)
  const drawScale = baseScale * clampedScale

  const drawnWidth = imageWidth * drawScale
  const drawnHeight = imageHeight * drawScale

  const maxPanX = Math.max(0, (drawnWidth - outputWidth) / 2)
  const maxPanY = Math.max(0, (drawnHeight - outputHeight) / 2)
  const panX = transform.offsetX * maxPanX
  const panY = transform.offsetY * maxPanY

  const left = outputWidth / 2 - drawnWidth / 2 + panX
  const top = outputHeight / 2 - drawnHeight / 2 + panY

  const sx = Math.max(0, -left / drawScale)
  const sy = Math.max(0, -top / drawScale)
  const sWidth = Math.min(imageWidth - sx, outputWidth / drawScale)
  const sHeight = Math.min(imageHeight - sy, outputHeight / drawScale)

  return { sx, sy, sWidth, sHeight }
}

// 07）渲染封面到 Canvas（renderCoverCropToCanvas）
/**
 * 函数名：renderCoverCropToCanvas
 * 功能：按目标宽高比与变换参数将图片绘制到 canvas。
 * 输入：
 * - image：已加载图片
 * - aspect：目标宽高比
 * - transform：裁剪变换
 * - outputWidth：输出宽度
 * 输出：
 * - 返回值：HTMLCanvasElement
 */
export function renderCoverCropToCanvas(
  image: HTMLImageElement,
  aspect: { width: number; height: number },
  transform: CoverCropTransform,
  outputWidth: number,
): HTMLCanvasElement {
  const { width, height } = resolveCoverOutputSize(aspect, outputWidth)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('无法创建画布')
  }

  const { sx, sy, sWidth, sHeight } = computeCoverDrawParams(
    image.naturalWidth,
    image.naturalHeight,
    width,
    height,
    transform,
  )

  context.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, width, height)
  return canvas
}

// 08）Canvas 转 JPEG File（canvasToCoverJpegFile）
function canvasToCoverJpegFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('无法生成封面图片'))
          return
        }
        resolve(new File([blob], fileName, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.92,
    )
  })
}

// 09）裁剪图片为封面 File（cropImageToCoverFile）
/**
 * 函数名：cropImageToCoverFile
 * 功能：将图片按目标宽高比与变换参数导出为 JPEG File。
 * 输入：
 * - source：图片 blob/data/http URL
 * - aspect：目标宽高比
 * - transform：裁剪变换，默认居中
 * - outputWidth：输出宽度
 * - fileName：输出文件名
 * 输出：
 * - 返回值：Promise<File>
 */
export async function cropImageToCoverFile(
  source: string,
  aspect: { width: number; height: number },
  transform: CoverCropTransform = getDefaultCoverCropTransform(),
  outputWidth: number = NOTE_ARTICLE_COVER_OUTPUT_WIDTH,
  fileName = `note-cover-${Date.now()}.jpg`,
): Promise<File> {
  const image = await loadImageFromSource(source)
  const canvas = renderCoverCropToCanvas(image, aspect, transform, outputWidth)
  return canvasToCoverJpegFile(canvas, fileName)
}

// 10）解析封面输出宽度（resolveCoverOutputWidthByAspect）
/**
 * 函数名：resolveCoverOutputWidthByAspect
 * 功能：根据宽高比选择图文/视频默认输出宽度。
 * 输入：
 * - aspect：目标宽高比
 * 输出：
 * - 返回值：输出宽度像素值
 */
export function resolveCoverOutputWidthByAspect(aspect: { width: number; height: number }): number {
  if (aspect.width === NOTE_VIDEO_COVER_ASPECT.width && aspect.height === NOTE_VIDEO_COVER_ASPECT.height) {
    return NOTE_VIDEO_COVER_OUTPUT_WIDTH
  }
  return NOTE_ARTICLE_COVER_OUTPUT_WIDTH
}
