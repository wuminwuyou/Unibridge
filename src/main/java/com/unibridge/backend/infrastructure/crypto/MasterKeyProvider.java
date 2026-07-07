package com.unibridge.backend.infrastructure.crypto;

import javax.crypto.SecretKey;

/**
 * Abstraction for obtaining the Master Key (KEK — Key Encryption Key)
 * used in envelope encryption.
 *
 * <h3>Purpose</h3>
 * <p>
 * The master key wraps/unwraps DEKs (Data Encryption Keys). DEKs are
 * stored in {@code sys_data_encryption_keys.encrypted_key}, and the
 * master key never leaves the KMS/HSM boundary in production.
 * </p>
 *
 * <h3>Implementations</h3>
 * <ul>
 *   <li>{@code DevFixedMasterKeyProvider} — hard-coded key for local dev</li>
 *   <li>{@code AwsKmsMasterKeyProvider} — AWS KMS via SDK</li>
 *   <li>{@code AliCloudKmsMasterKeyProvider} — Alibaba Cloud KMS</li>
 *   <li>{@code HashiCorpVaultMasterKeyProvider} — HashiCorp Vault Transit</li>
 *   <li>{@code HsmMasterKeyProvider} — on-prem HSM (PKCS#11)</li>
 * </ul>
 *
 * <h3>Usage</h3>
 * <p>
 * {@link CryptoService} calls {@link #unwrapDek(byte[], CryptoAlgorithm)}
 * every time it needs to decrypt a DEK. Implementations should cache the
 * derived {@code SecretKey} where appropriate (the master key itself is
 * typically stable for weeks/months).
 * </p>
 */
public interface MasterKeyProvider {

    /**
     * Unwrap (decrypt) an encrypted DEK using the master key.
     *
     * @param wrappedDekBytes raw bytes of the wrapped DEK (typically
     *                        32 bytes of AES key material wrapped by
     *                        AES-256-GCM-WRAP or AES-256-KWP)
     * @param dekAlgorithm   algorithm of the DEK being unwrapped
     * @return the plaintext DEK as a {@link SecretKey}
     * @throws CryptoException if unwrapping fails (bad key, corrupted data, KMS unavailable)
     */
    SecretKey unwrapDek(byte[] wrappedDekBytes, CryptoAlgorithm dekAlgorithm);

    /**
     * Wrap (encrypt) a plaintext DEK using the master key.
     *
     * @param plainDek     the DEK to protect
     * @param dekAlgorithm algorithm of the DEK being wrapped
     * @return the wrapped DEK bytes (stored in {@code sys_data_encryption_keys.encrypted_key})
     * @throws CryptoException if wrapping fails
     */
    byte[] wrapDek(SecretKey plainDek, CryptoAlgorithm dekAlgorithm);

    /**
     * Human-readable identifier for this master key instance.
     * Stored in {@code sys_data_encryption_keys.master_key_id}
     * to allow selecting the correct provider when multiple masters
     * coexist (e.g. during rotation).
     */
    String masterKeyId();
}
