// 01）混合加密工具（encryptContentDetail）
// RSA-2048-OAEP 单次加密上限约 190B，无法处理长文本 → 采用 RSA 包裹 AES 密钥 + AES-GCM 加密内容的混合方案

// 02）超时 Promise 工具（withTimeout）
/**
 * 函数名：withTimeout
 * 功能：为异步操作添加超时保护，防止加密步骤静默挂起。
 * 输入：
 * - operation：要执行的异步函数
 * - ms：超时毫秒数
 * - label：超时提示标签
 * 输出：
 * - 返回值：operation 的返回值
 * - 副作用：超时时 throw Error
 */
async function withTimeout<T>(operation: () => Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`操作超时：${label}（${ms}ms）`)), ms)
    operation()
      .then((result) => { clearTimeout(timer); resolve(result) })
      .catch((err) => { clearTimeout(timer); reject(err) })
  })
}

// 03）算法头 → hash 映射（resolveHashFromAlgorithm）
function resolveHashFromAlgorithm(algorithm: string): 'SHA-256' | 'SHA-384' | 'SHA-512' {
  if (algorithm.startsWith('RSA-4096')) return 'SHA-384'
  return 'SHA-256'
}

// 04）从原始公钥字符串中剥离算法头（parseAlgorithmHeader）
function parseAlgorithmHeader(rawKey: string): [string | null, string] {
  const headerMatch = rawKey.match(/^(RSA-\d{4}-OAEP|EC-P\d{3}-ECDH|SM2-ECIES)\n/)
  if (!headerMatch) return [null, rawKey]
  return [headerMatch[1], rawKey.slice(headerMatch[0].length)]
}

// 05）将 PEM 格式公钥导入为 CryptoKey（importPublicKey）
async function importPublicKey(rawKey: string): Promise<{
  key: CryptoKey
  hash: 'SHA-256' | 'SHA-384' | 'SHA-512'
}> {
  const [algorithmHeader, pemKey] = parseAlgorithmHeader(rawKey)
  const hash = algorithmHeader ? resolveHashFromAlgorithm(algorithmHeader) : 'SHA-256'

  const pemHeader = '-----BEGIN PUBLIC KEY-----'
  const pemFooter = '-----END PUBLIC KEY-----'
  const pemContents = pemKey
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))

  const key = await withTimeout(
    () => crypto.subtle.importKey('spki', binaryDer, { name: 'RSA-OAEP', hash }, false, ['encrypt']),
    5000,
    'importPublicKey',
  )
  return { key, hash }
}

// 06）生成随机 AES-256 密钥（generateAesKey）
/**
 * 函数名：generateAesKey
 * 功能：生成 256 位 AES-GCM 会话密钥，用于加密大批量明文。
 * 输入：无
 * 输出：
 * - 返回值：CryptoKey（AES-GCM, 256bit）
 * - 副作用：使用系统随机数发生器
 */
async function generateAesKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable，以便导出原始 key 并用 RSA 加密
    ['encrypt'],
  )
}

// 07）导出 AES 密钥为原始 bytes（exportAesKey）
async function exportAesKey(aesKey: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', aesKey)
}

// 08）用 RSA 公钥加密 AES 密钥（wrapAesKey）
async function wrapAesKey(rsaPublicKey: CryptoKey, aesRawKey: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaPublicKey,
    aesRawKey,
  )
}

// 09）用 AES-GCM 加密明文（encryptWithAesGcm）
/**
 * 函数名：encryptWithAesGcm
 * 功能：使用 AES-256-GCM 加密明文，返回 IV + 密文（含 auth tag）。
 * 实现方法：
 * - 生成 12 字节随机 IV
 * - 调用 crypto.subtle.encrypt 执行 AES-GCM 加密
 * - 返回值：{ iv: ArrayBuffer, ciphertext: ArrayBuffer }
 * 输入：
 * - aesKey：AES-256-GCM CryptoKey
 * - plaintext：明文字符串
 * 输出：
 * - 返回值：{ iv, ciphertext }——IV 与密文（密文末尾 16B 为 auth tag）
 * - 副作用：无
 */
async function encryptWithAesGcm(aesKey: CryptoKey, plaintext: string): Promise<{
  iv: ArrayBuffer
  ciphertext: ArrayBuffer
}> {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(plaintext)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded,
  )
  return { iv: iv.buffer, ciphertext }
}

// 10）ArrayBuffer → base64（bufferToBase64）
function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

// 11）加密项目内容详情（encryptContentDetail）
/**
 * 函数名：encryptContentDetail
 * 功能：使用混合加密将任意长度明文安全加密。
 * 实现方法：
 * - 解析公钥算法头确定 RSA-OAEP hash 参数
 * - 导入 RSA 公钥（SPKI）
 * - 生成一次性 AES-256-GCM 会话密钥
 * - 用 AES-GCM 加密明文内容（12B IV + 密文 + 16B auth tag）
 * - 用 RSA-OAEP 加密 AES 原始密钥（32B → 256B 密文）
 * - 返回拼接格式的最终密文：<rsa_wrapped_key>.<iv>.<aes_ciphertext>
 * 输入：
 * - rawKey：后端返回的 RSA 公钥（算法头 + PEM）
 * - plaintext：待加密的明文字符串（任意长度）
 * 输出：
 * - 返回值：{ ciphertext, algorithm, hash, publicKeySummary }
 *   - ciphertext 格式：base64(rsaEncryptedAesKey) + "." + base64(iv) + "." + base64(aesGcmCiphertext)
 * - 副作用：使用系统随机数发生器生成 AES 密钥与 IV
 */
export async function encryptContentDetail(rawKey: string, plaintext: string): Promise<{
  ciphertext: string
  algorithm: string
  hash: 'SHA-256' | 'SHA-384' | 'SHA-512'
  publicKeySummary: string
}> {
  try {
    const { key: rsaPublicKey, hash } = await importPublicKey(rawKey)

    // 生成 AES-256-GCM 会话密钥
    const aesKey = await generateAesKey()

    // 用 AES-GCM 加密明文
    const { iv, ciphertext: aesCiphertext } = await encryptWithAesGcm(aesKey, plaintext)

    // 导出 AES 原始密钥并用 RSA 包裹
    const aesRawKey = await exportAesKey(aesKey)
    const wrappedKey = await wrapAesKey(rsaPublicKey, aesRawKey)

    // 拼接最终密文
    const ciphertext = [
      bufferToBase64(wrappedKey),
      bufferToBase64(iv),
      bufferToBase64(aesCiphertext),
    ].join('.')

    return {
      ciphertext,
      algorithm: 'RSA-OAEP+AES-256-GCM',
      hash,
      publicKeySummary:
        rawKey.length <= 100 ? rawKey
          : rawKey.slice(0, 50) + '...' + rawKey.slice(-30),
    }
  } catch (err) {
    throw err
  }
}
