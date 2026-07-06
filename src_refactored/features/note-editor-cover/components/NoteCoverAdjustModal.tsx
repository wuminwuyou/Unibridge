// 01）封面调整弹窗（NoteCoverAdjustModal）
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import CloseIconButton from '@shared/ui/CloseIconButton'
import {
  computeCoverDrawParams,
  cropImageToCoverFile,
  getDefaultCoverCropTransform,
  loadImageFromSource,
  resolveCoverOutputWidthByAspect,
  type CoverCropTransform,
} from '@shared/lib/cropCoverImage'
import styles from './NoteCoverAdjustModal.module.css'

// 02）弹窗 Props（NoteCoverAdjustModalProps）
export interface NoteCoverAdjustModalProps {
  open: boolean
  imageUrl: string | null
  aspect: { width: number; height: number }
  initialTransform?: CoverCropTransform
  onClose: () => void
  onConfirm: (file: File, transform: CoverCropTransform) => void
}

const MIN_SCALE = 1
const MAX_SCALE = 3

// 03）限制偏移范围（clampOffset）
function clampOffset(value: number): number {
  return Math.min(1, Math.max(-1, value))
}

/**
 * 函数名：NoteCoverAdjustModal
 * 功能：让用户拖拽与缩放封面源图，按目标宽高比裁剪后确认导出。
 * 实现方法：
 * - 视口固定宽高比，图片以 cover 方式铺满并可拖拽平移
 * - 滑块控制缩放倍数，确认时 canvas 导出 JPEG File
 * 输入：
 * - props：见 NoteCoverAdjustModalProps
 * 输出：
 * - 返回值：React Portal 节点
 * - 副作用：锁定 body 滚动；确认时生成 File
 */
export function NoteCoverAdjustModal({
  open,
  imageUrl,
  aspect,
  initialTransform,
  onClose,
  onConfirm,
}: NoteCoverAdjustModalProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [transform, setTransform] = useState<CoverCropTransform>(
    initialTransform ?? getDefaultCoverCropTransform(),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    setTransform(initialTransform ?? getDefaultCoverCropTransform())
  }, [initialTransform, open, imageUrl])

  useEffect(() => {
    if (!open || !imageUrl) {
      setImageLoaded(false)
      return
    }

    let cancelled = false
    void loadImageFromSource(imageUrl)
      .then((image) => {
        if (cancelled) {
          return
        }
        setImageSize({ width: image.naturalWidth, height: image.naturalHeight })
        setImageLoaded(true)
      })
      .catch(() => {
        if (!cancelled) {
          setImageLoaded(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [imageUrl, open])

  useEffect(() => {
    if (!open || !viewportRef.current) {
      return undefined
    }

    const element = viewportRef.current
    const updateSize = (): void => {
      setViewportSize({ width: element.clientWidth, height: element.clientHeight })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [open, aspect.width, aspect.height])

  const previewStyle = useMemo(() => {
    if (!imageLoaded || !imageSize.width || !imageSize.height || !viewportSize.width || !viewportSize.height) {
      return undefined
    }

    const outputWidth = resolveCoverOutputWidthByAspect(aspect)
    const outputHeight = Math.round((outputWidth * aspect.height) / aspect.width)
    const { sx, sy, sWidth, sHeight } = computeCoverDrawParams(
      imageSize.width,
      imageSize.height,
      outputWidth,
      outputHeight,
      transform,
    )

    const scaleX = viewportSize.width / sWidth
    const scaleY = viewportSize.height / sHeight
    const displayScale = Math.min(scaleX, scaleY)
    const displayWidth = imageSize.width * displayScale
    const displayHeight = imageSize.height * displayScale

    const offsetX = -(sx * displayScale) + (viewportSize.width - sWidth * displayScale) / 2
    const offsetY = -(sy * displayScale) + (viewportSize.height - sHeight * displayScale) / 2

    return {
      width: `${displayWidth}px`,
      height: `${displayHeight}px`,
      transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
    }
  }, [aspect, imageLoaded, imageSize.height, imageSize.width, transform, viewportSize.height, viewportSize.width])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!imageLoaded) {
      return
    }
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: transform.offsetX,
      startOffsetY: transform.offsetY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [imageLoaded, transform.offsetX, transform.offsetY])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId || !viewportSize.width) {
      return
    }

    const outputWidth = resolveCoverOutputWidthByAspect(aspect)
    const outputHeight = Math.round((outputWidth * aspect.height) / aspect.width)
    const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, transform.scale))
    const baseScale = Math.max(outputWidth / imageSize.width, outputHeight / imageSize.height)
    const drawScale = baseScale * clampedScale
    const drawnWidth = imageSize.width * drawScale
    const drawnHeight = imageSize.height * drawScale
    const maxPanX = Math.max(0, (drawnWidth - outputWidth) / 2)
    const maxPanY = Math.max(0, (drawnHeight - outputHeight) / 2)

    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY
    const viewportScale = viewportSize.width / outputWidth
    const normalizedDeltaX = maxPanX > 0 ? (deltaX / viewportScale) / maxPanX : 0
    const normalizedDeltaY = maxPanY > 0 ? (deltaY / viewportScale) / maxPanY : 0

    setTransform((previous) => ({
      ...previous,
      offsetX: clampOffset(dragState.startOffsetX + normalizedDeltaX),
      offsetY: clampOffset(dragState.startOffsetY + normalizedDeltaY),
    }))
  }, [aspect, imageSize.height, imageSize.width, transform.scale, viewportSize.width])

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!imageUrl) {
      return
    }
    setIsSubmitting(true)
    try {
      const file = await cropImageToCoverFile(
        imageUrl,
        aspect,
        transform,
        resolveCoverOutputWidthByAspect(aspect),
      )
      onConfirm(file, transform)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }, [aspect, imageUrl, onClose, onConfirm, transform])

  if (!open) {
    return null
  }

  const isPortraitAspect = aspect.height > aspect.width
  const aspectRatioValue = `${aspect.width} / ${aspect.height}`
  const viewportClassName = [
    styles.noteCoverAdjustModalViewport,
    isPortraitAspect
      ? styles.noteCoverAdjustModalViewportPortrait
      : styles.noteCoverAdjustModalViewportLandscape,
  ].join(' ')
  const viewportStyle = { aspectRatio: aspectRatioValue } as const

  return createPortal(
    <div className={styles.noteCoverAdjustModalMask} role="presentation" onClick={onClose}>
      <section
        className={styles.noteCoverAdjustModal}
        role="dialog"
        aria-modal="true"
        aria-label="调整封面"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.noteCoverAdjustModalHeader}>
          <h3 className={styles.noteCoverAdjustModalTitle}>调整封面</h3>
          <CloseIconButton onClick={onClose} ariaLabel="关闭封面调整" />
        </header>

        <p className={styles.noteCoverAdjustModalHint}>
          拖动图片选择展示区域，可缩放以避免主体被裁切或居中留白。
        </p>

        <div className={styles.noteCoverAdjustModalViewportShell}>
          <div
            ref={viewportRef}
            className={viewportClassName}
            style={viewportStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {!imageLoaded ? (
              <div className={styles.noteCoverAdjustModalLoading}>加载中…</div>
            ) : (
              <>
                <img
                  src={imageUrl ?? undefined}
                  alt=""
                  className={styles.noteCoverAdjustModalImage}
                  style={previewStyle}
                  draggable={false}
                />
                <div className={styles.noteCoverAdjustModalFrame} aria-hidden="true" />
              </>
            )}
          </div>
        </div>

        <div className={styles.noteCoverAdjustModalControls}>
          <label className={styles.noteCoverAdjustModalScaleLabel} htmlFor="note-cover-adjust-scale">
            <span>缩放</span>
            <span className={styles.noteCoverAdjustModalScaleValue}>{transform.scale.toFixed(1)}×</span>
          </label>
          <input
            id="note-cover-adjust-scale"
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.05}
            value={transform.scale}
            disabled={!imageLoaded || isSubmitting}
            className={styles.noteCoverAdjustModalScaleInput}
            onChange={(event) => {
              const nextScale = Number(event.target.value)
              setTransform((previous) => ({ ...previous, scale: nextScale }))
            }}
          />
        </div>

        <footer className={styles.noteCoverAdjustModalFooter}>
          <button
            type="button"
            className={styles.noteCoverAdjustModalCancel}
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.noteCoverAdjustModalConfirm}
            onClick={() => { void handleConfirm() }}
            disabled={!imageLoaded || isSubmitting}
          >
            {isSubmitting ? '处理中…' : '确认'}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}
