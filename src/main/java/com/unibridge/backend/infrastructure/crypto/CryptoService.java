package com.unibridge.backend.infrastructure.crypto;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.entities.infra.AsymmetricKey;
import com.unibridge.backend.infrastructure.entities.infra.DataEncryptionKey;
import com.unibridge.backend.infrastructure.persistence.mapper.infra.AsymmetricKeyMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.infra.DataEncryptionKeyMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import java.security.spec.MGF1ParameterSpec;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import javax.crypto.spec.SecretKeySpec;
import java.security.*;
import java.security.interfaces.ECPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Decoupled cryptographic service — the single entry point for all
 * encryption, decryption, and key-generation operations.
 *
 * <h3>Architecture</h3>
 * <pre>
 *                    ┌─────────────────────┐
 *                    │     CryptoService   │
 *                    └──────────┬──────────┘
 *                               │
 *          ┌────────────────────┼────────────────────┐
 *          │                    │                    │
 *   ┌──────▼──────┐   ┌────────▼────────┐   ┌───────▼───────┐
 *   │  Symmetric  │   │   Asymmetric    │   │  Key Gen      │
 *   │  (DEK +     │   │   (RSA/EC/SM2)  │   │  (generate    │
 *   │   encrypt)  │   │   hybrid enc)   │   │   key pairs)  │
 *   └──────┬──────┘   └────────┬────────┘   └───────┬───────┘
 *          │                    │                    │
 *   ┌──────▼──────┐   ┌────────▼────────┐           │
 *   │ MasterKey   │   │ AsymmetricKey   │◄──────────┘
 *   │ Provider    │   │ Mapper          │
 *   │ (KMS/HSM)   │   │ (DB lookup)     │
 *   └─────────────┘   └─────────────────┘
 * </pre>
 *
 * <h3>Usage patterns</h3>
 *
 * <b>A. Symmetric (DEK-based) — e.g. PII fields like real_name:</b>
 * <pre>{@code
 * String ciphertext = cryptoService.encryptWithDek("张三", "018f3a7e-...");
 * String plaintext  = cryptoService.decryptWithDek(ciphertext, "018f3a7e-...");
 * }</pre>
 *
 * <b>B. Asymmetric (public-key hybrid) — e.g. project description:</b>
 * <pre>{@code
 * String ciphertext = cryptoService.encryptAsymmetric(description, keyId);
 * String plaintext  = cryptoService.decryptAsymmetric(ciphertext, keyId);
 * }</pre>
 *
 * <b>C. Raw key operations (no DB involved):</b>
 * <pre>{@code
 * String ct = cryptoService.encryptSymmetric("hello", secretKey, AES_256_GCM);
 * String pt = cryptoService.decryptSymmetric(ct, secretKey, AES_256_GCM);
 * }</pre>
 *
 * <h3>Output format</h3>
 * All methods return Base64-encoded output. Symmetric output is
 * {@code Base64(iv || ciphertext || auth_tag)}. Asymmetric hybrid
 * output is {@code Base64(encrypted_session_key || iv || ciphertext || auth_tag)}.
 */
@Service
public class CryptoService {

    private static final Logger log = LoggerFactory.getLogger(CryptoService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int AES_GCM_IV_BYTES = 12;
    private static final int AES_GCM_TAG_BITS = 128;
    private static final int AES_GCM_TAG_BYTES = AES_GCM_TAG_BITS / 8;
    private static final String STATUS_ACTIVE = "ACTIVE";

    private final MasterKeyProvider masterKeyProvider;
    private final DataEncryptionKeyMapper dekMapper;
    private final AsymmetricKeyMapper asymmetricKeyMapper;

    public CryptoService(MasterKeyProvider masterKeyProvider,
                         DataEncryptionKeyMapper dekMapper,
                         AsymmetricKeyMapper asymmetricKeyMapper) {
        this.masterKeyProvider = masterKeyProvider;
        this.dekMapper = dekMapper;
        this.asymmetricKeyMapper = asymmetricKeyMapper;
    }

    // ═══════════════════════════════════════════════════════════════
    // Public API — Symmetric (DEK-based)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Encrypt plaintext using the ACTIVE DEK identified by {@code dekKeyId}.
     * <p>The DEK is fetched from {@code sys_data_encryption_keys}, unwrapped
     * via the master key, used for encryption, then discarded from memory.
     *
     * @return Base64-encoded ciphertext ({@code iv || ciphertext || auth_tag})
     */
    public String encryptWithDek(String plaintext, String dekKeyId) {
        requireText(plaintext, "plaintext");
        SecretKey dek = loadActiveDek(dekKeyId);
        return encryptSymmetric(plaintext, dek, aesGcmAlgorithm());
    }

    /**
     * Decrypt ciphertext using the DEK identified by {@code dekKeyId}.
     *
     * @param base64Ciphertext Base64-encoded ciphertext produced by {@link #encryptWithDek}
     */
    public String decryptWithDek(String base64Ciphertext, String dekKeyId) {
        requireText(base64Ciphertext, "ciphertext");
        SecretKey dek = loadActiveDek(dekKeyId);
        return decryptSymmetric(base64Ciphertext, dek, aesGcmAlgorithm());
    }

    // ═══════════════════════════════════════════════════════════════
    // Public API — Symmetric (raw key, no DB)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Encrypt plaintext with an explicit {@link SecretKey}.
     *
     * @param algorithm the crypto algorithm (e.g. {@link CryptoAlgorithm#AES_256_GCM})
     * @return Base64-encoded ciphertext
     */
    public String encryptSymmetric(String plaintext, SecretKey key, CryptoAlgorithm algorithm) {
        requireText(plaintext, "plaintext");
        requireSymmetric(algorithm);

        try {
            byte[] iv = generateIv(algorithm);
            Cipher cipher = Cipher.getInstance(algorithm.transformation());
            if (algorithm == CryptoAlgorithm.AES_256_GCM || algorithm == CryptoAlgorithm.SM4_GCM) {
                cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(AES_GCM_TAG_BITS, iv));
            } else {
                cipher.init(Cipher.ENCRYPT_MODE, key, new IvParameterSpec(iv));
            }
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(concat(iv, encrypted));
        } catch (Exception e) {
            throw new CryptoException("Symmetric encryption failed", e);
        }
    }

    /**
     * Decrypt ciphertext with an explicit {@link SecretKey}.
     *
     * @param base64Ciphertext Base64-encoded ciphertext produced by {@link #encryptSymmetric}
     */
    public String decryptSymmetric(String base64Ciphertext, SecretKey key, CryptoAlgorithm algorithm) {
        requireText(base64Ciphertext, "ciphertext");
        requireSymmetric(algorithm);

        try {
            byte[] raw = Base64.getDecoder().decode(base64Ciphertext);
            int ivLen = algorithm.ivLengthBytes();
            if (raw.length < ivLen) {
                throw new CryptoException("Ciphertext too short for IV extraction");
            }
            byte[] iv = new byte[ivLen];
            System.arraycopy(raw, 0, iv, 0, ivLen);
            byte[] ciphertext = new byte[raw.length - ivLen];
            System.arraycopy(raw, ivLen, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(algorithm.transformation());
            if (algorithm == CryptoAlgorithm.AES_256_GCM || algorithm == CryptoAlgorithm.SM4_GCM) {
                cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(AES_GCM_TAG_BITS, iv));
            } else {
                cipher.init(Cipher.DECRYPT_MODE, key, new IvParameterSpec(iv));
            }
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, java.nio.charset.StandardCharsets.UTF_8);
        } catch (CryptoException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoException("Symmetric decryption failed", e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Public API — Asymmetric (DB-backed)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Encrypt plaintext using the public key from the ACTIVE asymmetric
     * key identified by {@code keyId} in {@code sys_asymmetric_keys}.
     *
     * <p>Uses hybrid encryption: a random AES-256-GCM session key encrypts
     * the plaintext; the session key is then encrypted with the asymmetric
     * public key. Output format:
     * {@code Base64(encrypted_session_key || iv || ciphertext || auth_tag)}.
     *
     * @param keyId UUID v7 from {@code sys_asymmetric_keys.key_id}
     * @return Base64-encoded hybrid ciphertext
     */
    public String encryptAsymmetric(String plaintext, String keyId) {
        requireText(plaintext, "plaintext");
        AsymmetricKey ak = loadActiveAsymmetricKey(keyId);
        PublicKey publicKey = parsePublicKey(ak);
        CryptoAlgorithm algo = CryptoAlgorithm.fromDbName(ak.getAlgorithm());
        return encryptWithPublicKey(plaintext, publicKey, algo);
    }

    /**
     * Decrypt hybrid ciphertext using the private key from the ACTIVE
     * asymmetric key identified by {@code keyId}.
     *
     * <p>The private key is DEK-encrypted at rest. This method:
     * <ol>
     *   <li>Loads the asymmetric key record</li>
     *   <li>Unwraps the DEK that protects the private key</li>
     *   <li>Decrypts the private key with the DEK</li>
     *   <li>Decrypts the session key with the private key</li>
     *   <li>Decrypts the ciphertext with the session key</li>
     * </ol>
     *
     * @param keyId UUID v7 from {@code sys_asymmetric_keys.key_id}
     */
    public String decryptAsymmetric(String base64Ciphertext, String keyId) {
        requireText(base64Ciphertext, "ciphertext");
        AsymmetricKey ak = loadActiveAsymmetricKey(keyId);
        PrivateKey privateKey = parseAndDecryptPrivateKey(ak);
        return decryptWithPrivateKey(base64Ciphertext, privateKey);
    }

    // ═══════════════════════════════════════════════════════════════
    // Public API — Direct RSA-OAEP (frontend-compatible, no hybrid layer)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Direct RSA-OAEP decryption using the OAEP hash derived from the DB
     * {@code algorithm} field (e.g. {@code "RSA-2048-OAEP"} → SHA-256).
     */
    public String decryptRsaOaep(String base64Ciphertext, String keyId) {
        requireText(base64Ciphertext, "ciphertext");
        AsymmetricKey ak = loadActiveAsymmetricKey(keyId);
        PrivateKey privateKey = parseAndDecryptPrivateKey(ak);

        CryptoAlgorithm algo = CryptoAlgorithm.fromDbName(ak.getAlgorithm());
        String transformation = algo.transformation();

        try {
            byte[] encrypted = Base64.getDecoder().decode(base64Ciphertext);
            byte[] plaintext = rsaDecrypt(encrypted, privateKey, transformation);
            return new String(plaintext, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("RSA-OAEP decryption failed for keyId={} algorithm={}: {}",
                    keyId, ak.getAlgorithm(), e.getMessage());
            throw new CryptoException("RSA-OAEP decryption failed", e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Public API — Asymmetric (raw keys, no DB)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Hybrid encrypt plaintext with an explicit {@link PublicKey}.
     *
     * @return Base64-encoded ciphertext ({@code enc_session_key || iv || ct || tag})
     */
    public String encryptWithPublicKey(String plaintext, PublicKey publicKey, CryptoAlgorithm algorithm) {
        requireText(plaintext, "plaintext");
        requireAsymmetric(algorithm);

        try {
            // Step 1: Generate random AES-256 session key
            SecretKey sessionKey = generateAes256Key();

            // Step 2: Encrypt plaintext with session key
            byte[] iv = new byte[AES_GCM_IV_BYTES];
            SECURE_RANDOM.nextBytes(iv);
            Cipher aesCipher = Cipher.getInstance("AES/GCM/NoPadding");
            aesCipher.init(Cipher.ENCRYPT_MODE, sessionKey, new GCMParameterSpec(AES_GCM_TAG_BITS, iv));
            byte[] encryptedPayload = aesCipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            // Step 3: Encrypt session key with asymmetric public key
            byte[] encryptedSessionKey = asymmetricEncrypt(sessionKey.getEncoded(), publicKey, algorithm);

            // Step 4: Assemble output: len4(len) || encrypted_session_key || iv || ciphertext
            byte[] result = concatWithLengthPrefix(encryptedSessionKey, iv, encryptedPayload);
            return Base64.getEncoder().encodeToString(result);
        } catch (CryptoException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoException("Asymmetric encryption failed", e);
        }
    }

    /**
     * Hybrid decrypt ciphertext with an explicit {@link PrivateKey}.
     *
     * @param base64Ciphertext Base64 output from {@link #encryptWithPublicKey}
     */
    public String decryptWithPrivateKey(String base64Ciphertext, PrivateKey privateKey) {
        requireText(base64Ciphertext, "ciphertext");

        try {
            byte[] raw = Base64.getDecoder().decode(base64Ciphertext);

            // Step 1: Extract length-prefixed components
            int pos = 0;
            int sessionKeyLen = readIntBigEndian(raw, pos); pos += 4;
            byte[] encryptedSessionKey = new byte[sessionKeyLen];
            System.arraycopy(raw, pos, encryptedSessionKey, 0, sessionKeyLen); pos += sessionKeyLen;

            int ivLen = AES_GCM_IV_BYTES;
            byte[] iv = new byte[ivLen];
            System.arraycopy(raw, pos, iv, 0, ivLen); pos += ivLen;

            byte[] ciphertext = new byte[raw.length - pos];
            System.arraycopy(raw, pos, ciphertext, 0, ciphertext.length);

            byte[] sessionKeyBytes;
            if ("RSA".equals(privateKey.getAlgorithm())) {
                sessionKeyBytes = rsaDecrypt(encryptedSessionKey, privateKey);
            } else {
                sessionKeyBytes = ecDecrypt(encryptedSessionKey, privateKey);
            }

            // Step 3: Decrypt payload with session key
            SecretKey sessionKey = new SecretKeySpec(sessionKeyBytes, "AES");
            Cipher aesCipher = Cipher.getInstance("AES/GCM/NoPadding");
            aesCipher.init(Cipher.DECRYPT_MODE, sessionKey, new GCMParameterSpec(AES_GCM_TAG_BITS, iv));
            byte[] plaintext = aesCipher.doFinal(ciphertext);

            return new String(plaintext, java.nio.charset.StandardCharsets.UTF_8);
        } catch (CryptoException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoException("Asymmetric decryption failed", e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Public API — Key generation
    // ═══════════════════════════════════════════════════════════════

    /**
     * Generate a new asymmetric key pair and persist it to {@code sys_asymmetric_keys}.
     */
    public AsymmetricKey generateAndPersistKeyPair(CryptoAlgorithm algorithm, String keyType, String createdBy) {
        requireAsymmetric(algorithm);

        try {
            KeyPairGenerator gen = KeyPairGenerator.getInstance(keyGenAlgorithm(algorithm));
            gen.initialize(algorithm.keySizeBits(), SECURE_RANDOM);
            KeyPair keyPair = gen.generateKeyPair();

            String publicKeyPem = publicKeyToPem(keyPair.getPublic());
            String fingerprint = sha256Hex(publicKeyPem);

            DataEncryptionKey activeDek = loadActiveDek();
            SecretKey dek = unwrapDek(activeDek);
            String privateKeyPkcs8 = privateKeyToPkcs8Base64(keyPair.getPrivate());

            String encryptedPrivateKey = encryptSymmetric(
                    privateKeyPkcs8, dek, CryptoAlgorithm.AES_256_GCM);

            AsymmetricKey ak = new AsymmetricKey();
            ak.setKeyId(java.util.UUID.randomUUID().toString());
            ak.setKeyVersion(1);
            ak.setKeyType(keyType);
            ak.setAlgorithm(dbName(algorithm));
            ak.setPublicKey(publicKeyPem);
            ak.setPublicKeyFingerprint(fingerprint);
            ak.setEncryptedPrivateKey(encryptedPrivateKey);
            ak.setPrivateKeyDekId(activeDek.getKeyId());
            ak.setKeyStatus("INITIALIZED");
            ak.setCreatedBy(createdBy);
            ak.setCreatedAt(java.time.LocalDateTime.now());
            ak.setUpdatedAt(java.time.LocalDateTime.now());
            asymmetricKeyMapper.insert(ak);

            return ak;
        } catch (CryptoException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoException("Key pair generation failed", e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Internal — DEK management
    // ═══════════════════════════════════════════════════════════════

    private SecretKey loadActiveDek(String dekKeyId) {
        LambdaQueryWrapper<DataEncryptionKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataEncryptionKey::getKeyId, dekKeyId)
                .eq(DataEncryptionKey::getKeyStatus, STATUS_ACTIVE)
                .last("LIMIT 1");
        DataEncryptionKey dek = dekMapper.selectOne(wrapper);
        if (dek == null) {
            throw new CryptoException("ACTIVE DEK not found: " + dekKeyId);
        }
        return unwrapDek(dek);
    }

    private DataEncryptionKey loadActiveDek() {
        LambdaQueryWrapper<DataEncryptionKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataEncryptionKey::getKeyStatus, STATUS_ACTIVE)
                .eq(DataEncryptionKey::getKeyType, "PII")
                .last("LIMIT 1");
        DataEncryptionKey dek = dekMapper.selectOne(wrapper);
        if (dek == null) {
            throw new CryptoException("No ACTIVE PII DEK found in sys_data_encryption_keys");
        }
        return dek;
    }

    private SecretKey unwrapDek(DataEncryptionKey dek) {
        byte[] wrappedBytes = Base64.getDecoder().decode(dek.getEncryptedKey());
        return masterKeyProvider.unwrapDek(wrappedBytes, CryptoAlgorithm.fromDbName(dek.getAlgorithm()));
    }

    // ═══════════════════════════════════════════════════════════════
    // Internal — Asymmetric key operations
    // ═══════════════════════════════════════════════════════════════

    private AsymmetricKey loadActiveAsymmetricKey(String keyId) {
        LambdaQueryWrapper<AsymmetricKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AsymmetricKey::getKeyId, keyId)
                .eq(AsymmetricKey::getKeyStatus, STATUS_ACTIVE)
                .last("LIMIT 1");
        AsymmetricKey ak = asymmetricKeyMapper.selectOne(wrapper);
        if (ak == null) {
            throw new CryptoException("ACTIVE asymmetric key not found: " + keyId);
        }
        return ak;
    }

    private PublicKey parsePublicKey(AsymmetricKey ak) {
        try {
            String pem = ak.getPublicKey();
            byte[] der = pemToDer(pem);
            return KeyFactory.getInstance(keyFactoryAlgorithm(ak.getAlgorithm()))
                    .generatePublic(new X509EncodedKeySpec(der));
        } catch (Exception e) {
            throw new CryptoException("Failed to parse public key", e);
        }
    }

    private PrivateKey parseAndDecryptPrivateKey(AsymmetricKey ak) {
        try {
            SecretKey dek = loadActiveDek(ak.getPrivateKeyDekId());
            String pkcs8Base64 = decryptSymmetric(ak.getEncryptedPrivateKey(), dek, CryptoAlgorithm.AES_256_GCM);
            byte[] pkcs8Der = Base64.getDecoder().decode(pkcs8Base64);
            return KeyFactory.getInstance(keyFactoryAlgorithm(ak.getAlgorithm()))
                    .generatePrivate(new PKCS8EncodedKeySpec(pkcs8Der));
        } catch (CryptoException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoException("Failed to decrypt/parse private key", e);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Internal — Low-level asymmetric primitives
    // ═══════════════════════════════════════════════════════════════

    private byte[] asymmetricEncrypt(byte[] data, PublicKey publicKey, CryptoAlgorithm algorithm) {
        try {
            return switch (algorithm) {
                case RSA_2048_OAEP, RSA_4096_OAEP -> rsaEncrypt(data, publicKey);
                case EC_P256_ECDH -> ecEncrypt(data, publicKey);
                case SM2_ECIES -> throw new CryptoException(
                        "SM2-ECIES requires BouncyCastle; add bcprov dependency first");
                default -> throw new CryptoException(
                        "Unsupported asymmetric algorithm: " + algorithm);
            };
        } catch (CryptoException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoException("Asymmetric encrypt failed: " + algorithm, e);
        }
    }

    private byte[] rsaEncrypt(byte[] data, PublicKey publicKey) throws Exception {
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        OAEPParameterSpec oaepParams = new OAEPParameterSpec(
                "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
        cipher.init(Cipher.ENCRYPT_MODE, publicKey, oaepParams);
        return cipher.doFinal(data);
    }

    private byte[] rsaDecrypt(byte[] data, PrivateKey privateKey) throws Exception {
        return rsaDecrypt(data, privateKey, "RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    }

    private byte[] rsaDecrypt(byte[] data, PrivateKey privateKey, String transformation) throws Exception {
        Cipher cipher = Cipher.getInstance(transformation);
        OAEPParameterSpec oaepParams = new OAEPParameterSpec(
                "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
        cipher.init(Cipher.DECRYPT_MODE, privateKey, oaepParams);
        return cipher.doFinal(data);
    }

    private byte[] ecEncrypt(byte[] data, PublicKey publicKey) throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("EC");
        gen.initialize(256, SECURE_RANDOM);
        KeyPair ephemeral = gen.generateKeyPair();

        KeyAgreement ka = KeyAgreement.getInstance("ECDH");
        ka.init(ephemeral.getPrivate());
        ka.doPhase(publicKey, true);
        byte[] sharedSecret = ka.generateSecret();

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] aesKey = digest.digest(sharedSecret);

        SecretKey sessionKey = new SecretKeySpec(aesKey, "AES");
        Cipher aesCipher = Cipher.getInstance("AES/GCM/NoPadding");
        byte[] iv = new byte[12];
        SECURE_RANDOM.nextBytes(iv);
        aesCipher.init(Cipher.ENCRYPT_MODE, sessionKey, new GCMParameterSpec(128, iv));
        byte[] encryptedData = aesCipher.doFinal(data);

        byte[] ephemeralPub = ephemeral.getPublic().getEncoded();
        return concatWithLengthPrefix(ephemeralPub, iv, encryptedData);
    }

    private byte[] ecDecrypt(byte[] data, PrivateKey privateKey) throws Exception {
        int pos = 0;
        int pubKeyLen = readIntBigEndian(data, pos); pos += 4;
        byte[] ephemeralPubBytes = new byte[pubKeyLen];
        System.arraycopy(data, pos, ephemeralPubBytes, 0, pubKeyLen); pos += pubKeyLen;

        PublicKey ephemeralPub = KeyFactory.getInstance("EC")
                .generatePublic(new X509EncodedKeySpec(ephemeralPubBytes));

        byte[] iv = new byte[12];
        System.arraycopy(data, pos, iv, 0, 12); pos += 12;

        byte[] encryptedData = new byte[data.length - pos];
        System.arraycopy(data, pos, encryptedData, 0, encryptedData.length);

        KeyAgreement ka = KeyAgreement.getInstance("ECDH");
        ka.init(privateKey);
        ka.doPhase(ephemeralPub, true);
        byte[] sharedSecret = ka.generateSecret();

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] aesKey = digest.digest(sharedSecret);

        SecretKey sessionKey = new SecretKeySpec(aesKey, "AES");
        Cipher aesCipher = Cipher.getInstance("AES/GCM/NoPadding");
        aesCipher.init(Cipher.DECRYPT_MODE, sessionKey, new GCMParameterSpec(128, iv));
        return aesCipher.doFinal(encryptedData);
    }

    // ═══════════════════════════════════════════════════════════════
    // Internal — Helpers
    // ═══════════════════════════════════════════════════════════════

    private SecretKey generateAes256Key() {
        byte[] key = new byte[32];
        SECURE_RANDOM.nextBytes(key);
        return new SecretKeySpec(key, "AES");
    }

    private byte[] generateIv(CryptoAlgorithm algorithm) {
        byte[] iv = new byte[algorithm.ivLengthBytes()];
        SECURE_RANDOM.nextBytes(iv);
        return iv;
    }

    private CryptoAlgorithm aesGcmAlgorithm() {
        return CryptoAlgorithm.AES_256_GCM;
    }

    private void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new CryptoException(field + " must not be blank");
        }
    }

    private void requireSymmetric(CryptoAlgorithm algorithm) {
        if (!algorithm.isSymmetric()) {
            throw new CryptoException("Expected symmetric algorithm, got: " + algorithm);
        }
    }

    private void requireAsymmetric(CryptoAlgorithm algorithm) {
        if (!algorithm.isAsymmetric()) {
            throw new CryptoException("Expected asymmetric algorithm, got: " + algorithm);
        }
    }

    private byte[] concat(byte[] a, byte[] b) {
        byte[] result = new byte[a.length + b.length];
        System.arraycopy(a, 0, result, 0, a.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }

    private byte[] concatWithLengthPrefix(byte[] first, byte[]... rest) {
        int totalLen = 4 + first.length;
        for (byte[] b : rest) totalLen += b.length;
        byte[] result = new byte[totalLen];
        int pos = writeIntBigEndian(result, 0, first.length);
        System.arraycopy(first, 0, result, pos, first.length); pos += first.length;
        for (byte[] b : rest) {
            System.arraycopy(b, 0, result, pos, b.length);
            pos += b.length;
        }
        return result;
    }

    private int readIntBigEndian(byte[] data, int offset) {
        return ((data[offset] & 0xFF) << 24)
                | ((data[offset + 1] & 0xFF) << 16)
                | ((data[offset + 2] & 0xFF) << 8)
                | (data[offset + 3] & 0xFF);
    }

    private int writeIntBigEndian(byte[] data, int offset, int value) {
        data[offset]     = (byte) (value >>> 24);
        data[offset + 1] = (byte) (value >>> 16);
        data[offset + 2] = (byte) (value >>> 8);
        data[offset + 3] = (byte) value;
        return 4;
    }

    private String keyGenAlgorithm(CryptoAlgorithm algorithm) {
        return switch (algorithm) {
            case RSA_2048_OAEP, RSA_4096_OAEP -> "RSA";
            case EC_P256_ECDH -> "EC";
            case SM2_ECIES -> "EC";
            default -> throw new CryptoException("Not an asymmetric key algorithm: " + algorithm);
        };
    }

    private String keyFactoryAlgorithm(String dbAlgoName) {
        return switch (dbAlgoName) {
            case "RSA-2048-OAEP", "RSA-4096-OAEP" -> "RSA";
            case "EC-P256-ECDH", "SM2-ECIES" -> "EC";
            default -> throw new CryptoException("Unknown algorithm: " + dbAlgoName);
        };
    }

    private String dbName(CryptoAlgorithm algorithm) {
        return switch (algorithm) {
            case RSA_2048_OAEP -> "RSA-2048-OAEP";
            case RSA_4096_OAEP -> "RSA-4096-OAEP";
            case EC_P256_ECDH  -> "EC-P256-ECDH";
            default -> throw new CryptoException("Unknown algorithm: " + algorithm);
        };
    }

    private String publicKeyToPem(PublicKey key) {
        String base64 = Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(key.getEncoded());
        return "-----BEGIN PUBLIC KEY-----\n" + base64 + "\n-----END PUBLIC KEY-----";
    }

    private String privateKeyToPkcs8Base64(PrivateKey key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    private byte[] pemToDer(String pem) {
        String base64 = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");
        return Base64.getMimeDecoder().decode(base64);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new CryptoException("SHA-256 failed", e);
        }
    }
}
