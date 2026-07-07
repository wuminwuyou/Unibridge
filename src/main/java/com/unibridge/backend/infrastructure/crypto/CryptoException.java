package com.unibridge.backend.infrastructure.crypto;

import com.unibridge.backend.infrastructure.common.BusinessException;

/**
 * Cryptographic operation failure.
 * <p>
 * Wraps low-level {@link java.security.GeneralSecurityException} and
 * other crypto-related failures while preserving the original exception
 * as the cause for forensic analysis.
 * </p>
 * <p>
 * All public methods on {@link CryptoService} throw this exception
 * (never a raw {@code GeneralSecurityException}), so callers only need
 * to handle a single well-known type.
 * </p>
 */
public class CryptoException extends BusinessException {

    private static final int CRYPTO_ERROR_STATUS = 500;

    public CryptoException(String message) {
        super(CRYPTO_ERROR_STATUS, message);
    }

    public CryptoException(String message, Throwable cause) {
        super(CRYPTO_ERROR_STATUS, message);
        initCause(cause);
    }
}
