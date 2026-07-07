package com.unibridge.backend.infrastructure.crypto;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Development-only Master Key Provider backed by a hard-coded key.
 * <p>
 * DO NOT USE IN PRODUCTION. This implementation exists solely for
 * local development and integration testing. Production must use
 * a real KMS/HSM-backed {@link MasterKeyProvider}.
 * </p>
 * <p>
 * The fixed key is derived from the application secret configured
 * via the {@code app.master-key} property (defaults to a well-known
 * 32-byte hex string). The wrapping algorithm is AES-256-GCM-WRAP.
 * </p>
 */
public class DevFixedMasterKeyProvider implements MasterKeyProvider {

    private static final String MASTER_KEY_ID = "DEV::fixed-key-001";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final SecretKey masterKey;

    public DevFixedMasterKeyProvider(String hexEncodedKey) {
        byte[] raw = HexFormat.of().parseHex(hexEncodedKey);
        if (raw.length != 32) {
            throw new CryptoException("Master key must be 32 bytes (64 hex chars), got " + (raw.length * 2));
        }
        this.masterKey = new SecretKeySpec(raw, "AES");
    }

    @Override
    public SecretKey unwrapDek(byte[] wrappedDekBytes, CryptoAlgorithm dekAlgorithm) {
        try {
            // Format: iv (12 bytes) + ciphertext + tag (16 bytes)
            byte[] iv = new byte[12];
            System.arraycopy(wrappedDekBytes, 0, iv, 0, 12);
            byte[] ciphertext = new byte[wrappedDekBytes.length - 12];
            System.arraycopy(wrappedDekBytes, 12, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, masterKey, new GCMParameterSpec(128, iv));
            byte[] plainDek = cipher.doFinal(ciphertext);
            return new SecretKeySpec(plainDek, "AES");
        } catch (Exception e) {
            throw new CryptoException("Failed to unwrap DEK", e);
        }
    }

    @Override
    public byte[] wrapDek(SecretKey plainDek, CryptoAlgorithm dekAlgorithm) {
        try {
            byte[] iv = new byte[12];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, masterKey, new GCMParameterSpec(128, iv));
            byte[] ciphertext = cipher.doFinal(plainDek.getEncoded());

            // Prepend IV to ciphertext
            byte[] result = new byte[12 + ciphertext.length];
            System.arraycopy(iv, 0, result, 0, 12);
            System.arraycopy(ciphertext, 0, result, 12, ciphertext.length);
            return result;
        } catch (Exception e) {
            throw new CryptoException("Failed to wrap DEK", e);
        }
    }

    @Override
    public String masterKeyId() {
        return MASTER_KEY_ID;
    }
}
