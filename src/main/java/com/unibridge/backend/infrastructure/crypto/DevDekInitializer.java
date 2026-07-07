package com.unibridge.backend.infrastructure.crypto;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.infrastructure.entities.infra.DataEncryptionKey;
import com.unibridge.backend.infrastructure.persistence.mapper.infra.DataEncryptionKeyMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Component
public class DevDekInitializer {

    private static final Logger log = LoggerFactory.getLogger(DevDekInitializer.class);
    private static final String PII_KEY_TYPE = "PII";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String DEFAULT_ALGORITHM = "AES-256-GCM";

    private final DataEncryptionKeyMapper dekMapper;
    private final MasterKeyProvider masterKeyProvider;

    public DevDekInitializer(DataEncryptionKeyMapper dekMapper,
                             MasterKeyProvider masterKeyProvider) {
        this.dekMapper = dekMapper;
        this.masterKeyProvider = masterKeyProvider;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ensurePiiDekExists() {
        LambdaQueryWrapper<DataEncryptionKey> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataEncryptionKey::getKeyType, PII_KEY_TYPE)
                .eq(DataEncryptionKey::getKeyStatus, STATUS_ACTIVE)
                .last("LIMIT 1");
        DataEncryptionKey existing = dekMapper.selectOne(wrapper);

        if (existing != null) {
            log.info("PII DEK already exists: keyId={}", existing.getKeyId());
            return;
        }

        try {
            byte[] keyBytes = new byte[32];
            new SecureRandom().nextBytes(keyBytes);
            SecretKey plainDek = new SecretKeySpec(keyBytes, "AES");

            byte[] wrappedDek = masterKeyProvider.wrapDek(plainDek, CryptoAlgorithm.AES_256_GCM);
            String encryptedKey = Base64.getEncoder().encodeToString(wrappedDek);

            DataEncryptionKey dek = new DataEncryptionKey();
            dek.setKeyId(java.util.UUID.randomUUID().toString());
            dek.setKeyVersion(1);
            dek.setKeyType(PII_KEY_TYPE);
            dek.setAlgorithm(DEFAULT_ALGORITHM);
            dek.setEncryptedKey(encryptedKey);
            dek.setMasterKeyId(masterKeyProvider.masterKeyId());
            dek.setWrappingAlgorithm("AES-256-GCM-WRAP");
            dek.setKeyStatus(STATUS_ACTIVE);
            dek.setActivatedAt(LocalDateTime.now());
            dek.setCreatedBy("DEV_INIT");
            dek.setCreatedAt(LocalDateTime.now());
            dek.setUpdatedAt(LocalDateTime.now());
            dekMapper.insert(dek);

            log.info("Created dev PII DEK: keyId={}", dek.getKeyId());
        } catch (Exception e) {
            log.error("Failed to create dev PII DEK", e);
            throw new CryptoException("Cannot initialize PII DEK for development", e);
        }
    }
}
