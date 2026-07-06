// 01）本地 Blob URL 保留注册表（retainedBlobRegistry）

const retainedBlobUrls = new Set<string>()

// 02）判断是否为 blob URL（isLocalBlobUrl）
/**
 * 函数名：isLocalBlobUrl
 * 功能：判断字符串是否为 blob: 本地预览地址。
 * 输入：
 * - url：待判断 URL
 * 输出：
 * - 返回值：是否为 blob URL
 */
export function isLocalBlobUrl(url: string | null | undefined): url is string {
  return Boolean(url?.startsWith('blob:'))
}

// 03）登记保留 Blob URL（retainBlobUrl）
/**
 * 函数名：retainBlobUrl
 * 功能：登记 blob URL，在组件卸载或路由切换期间禁止自动 revoke。
 * 输入：
 * - url：blob URL，可选
 * 输出：
 * - 副作用：写入注册表
 */
export function retainBlobUrl(url: string | null | undefined): void {
  if (!isLocalBlobUrl(url)) {
    return
  }
  retainedBlobUrls.add(url)
}

// 04）批量登记 Blob URL（retainBlobUrls）
/**
 * 函数名：retainBlobUrls
 * 功能：批量登记 blob URL（预览跳转前保留视频/封面等资源）。
 * 输入：
 * - urls：待保留的 blob URL 列表
 * 输出：
 * - 副作用：写入注册表
 */
export function retainBlobUrls(urls: Array<string | null | undefined>): void {
  for (const url of urls) {
    retainBlobUrl(url)
  }
}

// 05）判断 Blob 是否被保留（isBlobUrlRetained）
/**
 * 函数名：isBlobUrlRetained
 * 功能：判断 blob URL 是否在注册表中。
 * 输入：
 * - url：blob URL，可选
 * 输出：
 * - 返回值：是否已登记保留
 */
export function isBlobUrlRetained(url: string | null | undefined): boolean {
  return isLocalBlobUrl(url) && retainedBlobUrls.has(url)
}

// 06）释放单个 Blob URL（releaseBlobUrl）
/**
 * 函数名：releaseBlobUrl
 * 功能：从注册表移除并 revoke 指定 blob URL。
 * 输入：
 * - url：blob URL，可选
 * 输出：
 * - 副作用：revokeObjectURL；从注册表删除
 */
export function releaseBlobUrl(url: string | null | undefined): void {
  if (!isLocalBlobUrl(url)) {
    return
  }
  if (!retainedBlobUrls.delete(url)) {
    return
  }
  try {
    URL.revokeObjectURL(url)
  } catch {
    // 已失效时静默忽略
  }
}

// 07）非保留 Blob 时 revoke（revokeBlobUrlIfNotRetained）
/**
 * 函数名：revokeBlobUrlIfNotRetained
 * 功能：若 blob 未登记保留则 revoke，用于组件卸载兜底。
 * 输入：
 * - url：blob URL，可选
 * 输出：
 * - 副作用：可能 revokeObjectURL
 */
export function revokeBlobUrlIfNotRetained(url: string | null | undefined): void {
  if (!isLocalBlobUrl(url) || isBlobUrlRetained(url)) {
    return
  }
  try {
    URL.revokeObjectURL(url)
  } catch {
    // 已失效时静默忽略
  }
}

// 08）释放全部 Blob URL（releaseAllRetainedBlobUrls）
/**
 * 函数名：releaseAllRetainedBlobUrls
 * 功能：清空注册表并 revoke 所有已登记的 blob URL。
 * 输出：
 * - 副作用：revokeObjectURL；清空注册表
 */
export function releaseAllRetainedBlobUrls(): void {
  for (const url of retainedBlobUrls) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // 已失效时静默忽略
    }
  }
  retainedBlobUrls.clear()
}
