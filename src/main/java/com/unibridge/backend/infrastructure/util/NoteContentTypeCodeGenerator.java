package com.unibridge.backend.infrastructure.util;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;

import java.security.SecureRandom;
import java.util.function.Predicate;

/**
 * 笔记 content_type_code 生成器。
 * <p>
 * 规则（与 db.sql CHECK 一致）：{@code TX} 或 {@code VD} + 11 位 {@code [A-Za-z0-9]}，由 NanoID 随机生成。
 * </p>
 */
public final class NoteContentTypeCodeGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] ALPHABET =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();
    private static final int SUFFIX_LENGTH = 11;
    private static final int MAX_COLLISION_RETRIES = 10;

    private NoteContentTypeCodeGenerator() {
    }

    /** 图文笔记编码前缀 TX。 */
    public static String generateImageTextCode(Predicate<String> uniquenessChecker) {
        return generateWithPrefix("TX", uniquenessChecker);
    }

    /** 视频笔记编码前缀 VD。 */
    public static String generateVideoCode(Predicate<String> uniquenessChecker) {
        return generateWithPrefix("VD", uniquenessChecker);
    }

    private static String generateWithPrefix(String prefix, Predicate<String> uniquenessChecker) {
        for (int attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
            String suffix = NanoIdUtils.randomNanoId(RANDOM, ALPHABET, SUFFIX_LENGTH);
            String code = prefix + suffix;
            if (uniquenessChecker == null || uniquenessChecker.test(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate unique note content_type_code after "
                + MAX_COLLISION_RETRIES + " attempts");
    }
}
