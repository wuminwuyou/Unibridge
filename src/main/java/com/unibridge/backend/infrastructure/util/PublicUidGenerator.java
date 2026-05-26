package com.unibridge.backend.infrastructure.util;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;

import java.security.SecureRandom;
import java.util.function.Predicate;

/**
 * 对外公开 UID 通用生成器：{@code prefix} + 11 位 {@code [A-Za-z0-9]}。
 */
public final class PublicUidGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] ALPHABET =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();
    private static final int SUFFIX_LENGTH = 11;
    private static final int MAX_COLLISION_RETRIES = 10;

    private PublicUidGenerator() {
    }

    public static String generate(String prefix, Predicate<String> uniquenessChecker) {
        for (int attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
            String suffix = NanoIdUtils.randomNanoId(RANDOM, ALPHABET, SUFFIX_LENGTH);
            String uid = prefix + suffix;
            if (uniquenessChecker == null || uniquenessChecker.test(uid)) {
                return uid;
            }
        }
        throw new IllegalStateException("Failed to generate unique uid with prefix " + prefix
                + " after " + MAX_COLLISION_RETRIES + " attempts");
    }
}
