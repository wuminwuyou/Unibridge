import CryptoJS from 'crypto-js'

// 01）分块读取大小（FILE_MD5_CHUNK_SIZE）
const FILE_MD5_CHUNK_SIZE = 2 * 1024 * 1024

// 02）计算 Blob 的 MD5（computeBlobMd5）
/**
 * 函数名：computeBlobMd5
 * 功能：分块读取 Blob 并计算 32 位小写十六进制 MD5，供秒传预检使用。
 * 实现方法：
 * - 按 FILE_MD5_CHUNK_SIZE 切片读取，增量更新 MD5
 * - 输出符合 /uploads/check-md5 要求的格式
 * 输入：
 * - blob：封面图或视频文件
 * 输出：
 * - 返回值：小写 hex MD5 字符串
 * - 副作用：读取 Blob 内容（内存分块）
 */
export async function computeBlobMd5(blob: Blob): Promise<string> {
  const hasher = CryptoJS.algo.MD5.create()
  let offset = 0

  while (offset < blob.size) {
    const chunk = blob.slice(offset, offset + FILE_MD5_CHUNK_SIZE)
    const buffer = await chunk.arrayBuffer()
    const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(buffer))
    hasher.update(wordArray)
    offset += FILE_MD5_CHUNK_SIZE
  }

  return hasher.finalize().toString(CryptoJS.enc.Hex).toLowerCase()
}
