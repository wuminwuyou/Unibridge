package com.unibridge.backend.infrastructure.util;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;

import java.util.Base64;

/** TOTP 密钥生成、QR 与验证码校验。 */
public final class TotpUtils {

    private static final SecretGenerator SECRET_GENERATOR = new DefaultSecretGenerator();
    private static final QrGenerator QR_GENERATOR = new ZxingPngQrGenerator();
    private static final TimeProvider TIME_PROVIDER = new SystemTimeProvider();
    private static final CodeVerifier CODE_VERIFIER =
            new DefaultCodeVerifier(new DefaultCodeGenerator(HashingAlgorithm.SHA1), TIME_PROVIDER);

    private TotpUtils() {
    }

    public static String generateSecret() {
        return SECRET_GENERATOR.generate();
    }

    public static String buildOtpAuthUrl(String issuer, String accountName, String secret) {
        QrData data = new QrData.Builder()
                .label(accountName)
                .secret(secret)
                .issuer(issuer)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        return data.getUri();
    }

    public static String generateQrCodeDataUrl(String issuer, String accountName, String secret) {
        QrData data = new QrData.Builder()
                .label(accountName)
                .secret(secret)
                .issuer(issuer)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        try {
            byte[] image = QR_GENERATOR.generate(data);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(image);
        } catch (QrGenerationException ex) {
            throw new IllegalStateException("TOTP_QR_GENERATION_FAILED", ex);
        }
    }

    public static boolean verifyCode(String secret, String code) {
        if (secret == null || secret.isBlank() || code == null || code.isBlank()) {
            return false;
        }
        return CODE_VERIFIER.isValidCode(secret.trim(), code.trim());
    }
}
