package com.unibridge.backend.infrastructure.crypto;

/**
 * All supported cryptographic algorithms across symmetric and asymmetric domains.
 * <p>
 * Each constant carries its canonical algorithm name in the format
 * understood by {@link javax.crypto.Cipher#getInstance(String)} and
 * {@link java.security.KeyPairGenerator#getInstance(String)},
 * along with declaring its category (symmetric vs asymmetric).
 * </p>
 *
 * <h3>Symmetric (DEK level)</h3>
 * Used with {@code javax.crypto.Cipher} for AEAD encryption.
 * All symmetric algorithms include an auto-derived IV and produce
 * output in the format {@code iv:ciphertext:auth_tag}.
 *
 * <h3>Asymmetric (public/private key level)</h3>
 * Used for hybrid encryption: a random AES symmetric key is generated,
 * the plaintext is encrypted with AES-256-GCM, then the symmetric key
 * is encrypted with the asymmetric public key.
 * Output format: {@code encrypted_symmetric_key:iv:ciphertext:auth_tag}.
 */
public enum CryptoAlgorithm {

    // ── Symmetric ────────────────────────────────────────────────
    /** AES-256 in Galois/Counter Mode (recommended default for DEK encryption). */
    AES_256_GCM("AES/GCM/NoPadding", Category.SYMMETRIC, 256, 12, 16),

    /** AES-256 in CBC mode with PKCS#5 padding (legacy compatibility). */
    AES_256_CBC("AES/CBC/PKCS5Padding", Category.SYMMETRIC, 256, 16, 0),

    /** SM4 in GCM mode (Chinese national standard, GM/T 0002-2012). */
    SM4_GCM("SM4/GCM/NoPadding", Category.SYMMETRIC, 128, 12, 16),

    /** SM4 in CBC mode (Chinese national standard). */
    SM4_CBC("SM4/CBC/PKCS5Padding", Category.SYMMETRIC, 128, 16, 0),

    // ── Asymmetric ───────────────────────────────────────────────
    /** RSA 2048-bit with OAEP padding and SHA-256 (recommended). */
    RSA_2048_OAEP("RSA/ECB/OAEPWithSHA-256AndMGF1Padding", Category.ASYMMETRIC, 2048, 0, 0),

    /** RSA 4096-bit with OAEP padding and SHA-256 (high-security scenarios). */
    RSA_4096_OAEP("RSA/ECB/OAEPWithSHA-256AndMGF1Padding", Category.ASYMMETRIC, 4096, 0, 0),

    /** EC P-256 with ECDH key agreement (mobile-friendly). */
    EC_P256_ECDH("EC", Category.ASYMMETRIC, 256, 0, 0),

    /** SM2 with ECIES (Chinese national standard, GM/T 0003-2012). */
    SM2_ECIES("SM2", Category.ASYMMETRIC, 256, 0, 0);

    // ── Fields ───────────────────────────────────────────────────

    private final String transformation;
    private final Category category;
    private final int keySizeBits;
    private final int ivLengthBytes;
    private final int tagLengthBytes;

    CryptoAlgorithm(String transformation, Category category,
                    int keySizeBits, int ivLengthBytes, int tagLengthBytes) {
        this.transformation = transformation;
        this.category = category;
        this.keySizeBits = keySizeBits;
        this.ivLengthBytes = ivLengthBytes;
        this.tagLengthBytes = tagLengthBytes;
    }

    public String transformation() { return transformation; }
    public Category category() { return category; }
    public int keySizeBits() { return keySizeBits; }
    public int ivLengthBytes() { return ivLengthBytes; }
    public int tagLengthBytes() { return tagLengthBytes; }

    public boolean isSymmetric() { return category == Category.SYMMETRIC; }
    public boolean isAsymmetric() { return category == Category.ASYMMETRIC; }

    /**
     * Resolve an algorithm enum from its DB-level name.
     */
    public static CryptoAlgorithm fromDbName(String dbName) {
        if (dbName == null || dbName.isBlank()) {
            throw new IllegalArgumentException("Unknown crypto algorithm: " + dbName);
        }
        return switch (dbName) {
            case "AES-256-GCM"   -> AES_256_GCM;
            case "AES-256-CBC"   -> AES_256_CBC;
            case "SM4-GCM"       -> SM4_GCM;
            case "SM4-CBC"       -> SM4_CBC;
            case "RSA-2048-OAEP" -> RSA_2048_OAEP;
            case "RSA-4096-OAEP" -> RSA_4096_OAEP;
            case "EC-P256-ECDH"  -> EC_P256_ECDH;
            case "SM2-ECIES"     -> SM2_ECIES;
            default -> throw new IllegalArgumentException("Unknown crypto algorithm: " + dbName);
        };
    }

    public enum Category { SYMMETRIC, ASYMMETRIC }
}
