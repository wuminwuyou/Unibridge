package com.unibridge.backend.infrastructure.config;

import com.unibridge.backend.infrastructure.crypto.DevFixedMasterKeyProvider;
import com.unibridge.backend.infrastructure.crypto.MasterKeyProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires the {@link MasterKeyProvider} implementation.
 * <p>
 * Production must override this bean with a real KMS/HSM-backed provider
 * (e.g. via Spring profile {@code prod} or a separate config class annotated
 * with {@code @Profile("prod")}). The dev implementation uses a hard-coded
 * AES-256 key and MUST NOT be active in staging/production.
 * </p>
 */
@Configuration
public class CryptoConfig {

    @Value("${app.crypto.master-key:0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20}")
    private String devMasterKeyHex;

    @Bean
    public MasterKeyProvider masterKeyProvider() {
        return new DevFixedMasterKeyProvider(devMasterKeyHex);
    }
}
