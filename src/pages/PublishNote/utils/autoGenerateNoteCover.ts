// 01）冷色系浅色调色板（COOL_PALETTES）
/** 每次随机选取一组渐变色 */
import { uploadNoteCover } from '../../../api/notes'

const COOL_PALETTES: ReadonlyArray<[string, string]> = [
  ['#d4e6f1', '#a9cce3'],
  ['#d5f5e3', '#a3e4d7'],
  ['#dbeafe', '#93c5fd'],
  ['#e0e7ff', '#a5b4fc'],
  ['#cce5ff', '#9ec5fe'],
  ['#d1ecf1', '#a2d4df'],
  ['#e8daef', '#c39bd3'],
  ['#d6eaf8', '#aed6f1'],
  ['#d5f5e3', '#abebc6'],
  ['#e8f8f5', '#a2d9ce'],
]

// 02）任意范围随机整数（randomInt）
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 03）自动生成笔记封面 Data URL（autoGenerateNoteCoverDataUrl）
/**
 * 函数名：autoGenerateNoteCoverDataUrl
 * 功能：基于笔记标题自动生成冷色系浅色调毛玻璃风格封面图（Canvas 原型）。
 * 实现方法：
 * - 从冷色系色板中随机选取一组渐变色
 * - 全画布绘制渐变背景，再叠加满幅半透明白色毛玻璃层保持整体颜色一致
 * - 标题大字居中显示
 * 输入：
 * - title：笔记标题
 * 输出：
 * - 返回值：base64 图片 Data URL（image/jpeg, 0.88 质量）
 * - 副作用：无
 */
export function autoGenerateNoteCoverDataUrl(title: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const context = canvas.getContext('2d')

  if (!context) {
    return ''
  }

  // 背景渐变（满画布）
  const paletteIndex = randomInt(0, COOL_PALETTES.length - 1)
  const [colorStart, colorEnd] = COOL_PALETTES[paletteIndex] ?? ['#dbeafe', '#93c5fd']
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, colorStart)
  gradient.addColorStop(1, colorEnd)
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  // 毛玻璃层（满画布，保持整体颜色一致）
  context.fillStyle = 'rgba(255, 255, 255, 0.45)'
  drawRoundedRect(context, 0, 0, canvas.width, canvas.height, 0)
  context.fill()

  // 标题文字（大字居中）
  const displayTitle = title.trim() || '未命名笔记'
  const maxWidth = canvas.width - 80
  const fontSize = measureBestFontSize(context, displayTitle, 38, 22, maxWidth)
  context.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`
  context.fillStyle = '#1e293b'
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  wrapCenteredText(context, displayTitle, canvas.width / 2, canvas.height / 2, maxWidth, fontSize * 1.5)

  return canvas.toDataURL('image/jpeg', 0.88)
}

// 04）绘制圆角矩形（drawRoundedRect）
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (r <= 0) {
    ctx.rect(x, y, w, h)
    return
  }
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// 05）自适应最佳字号（measureBestFontSize）
function measureBestFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxFontSize: number,
  minFontSize: number,
  maxWidth: number,
): number {
  let fontSize = maxFontSize
  while (fontSize > minFontSize) {
    ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`
    if (ctx.measureText(text).width <= maxWidth) {
      return fontSize
    }
    fontSize -= 2
  }
  return minFontSize
}

// 06）居中多行文本（wrapCenteredText）
function wrapCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const chars = Array.from(text)

  const lines: string[] = []
  let currentLine = ''
  for (const char of chars) {
    const testLine = currentLine + char
    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = char
      continue
    }
    currentLine = testLine
  }
  if (currentLine) {
    lines.push(currentLine)
  }

  const visibleLines = lines.slice(0, 3)
  const totalHeight = visibleLines.length * lineHeight
  const startY = centerY - totalHeight / 2 + lineHeight / 2

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < visibleLines.length; i += 1) {
    ctx.fillText(visibleLines[i] ?? '', centerX, startY + i * lineHeight)
  }
}

// 07）将 Data URL 转为 Blob（dataUrlToBlob）
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  if (!header || !base64) {
    throw new Error('无效的 Data URL')
  }
  const mimeMatch = header.match(/data:(.+);base64/)
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

// 08）从 Data URL 创建 File 对象（dataUrlToFile）
function dataUrlToFile(dataUrl: string, fileName: string): File {
  const blob = dataUrlToBlob(dataUrl)
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' })
}

// 09）生成封面并上传（generateAndUploadNoteCover）
/**
 * 函数名：generateAndUploadNoteCover
 * 功能：根据标题自动生成封面 Data URL → 转为 File → 调用 uploadNoteCover API → 返回服务端封面 URL。
 * 实现方法：
 * - autoGenerateNoteCoverDataUrl 生成 Canvas 封面
 * - dataUrlToFile 转为 File 对象
 * - uploadNoteCover 上传至服务端
 * 输入：
 * - title：笔记标题
 * 输出：
 * - 返回值：Promise<string> 服务端封面 URL
 * - 副作用：发起 POST /uploads/note-cover
 */
export async function generateAndUploadNoteCover(title: string): Promise<string> {
  const dataUrl = autoGenerateNoteCoverDataUrl(title)
  const file = dataUrlToFile(dataUrl, `quick-note-cover-${Date.now()}.jpg`)
  const uploaded = await uploadNoteCover(file, 'auto', file.name)
  const coverUrl = uploaded.coverUrl?.trim()
  if (!coverUrl) {
    throw new Error('封面生成后上传未返回封面地址')
  }
  return coverUrl
}
