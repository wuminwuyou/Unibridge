package com.unibridge.backend.infrastructure.util;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;

import java.security.SecureRandom;
import java.util.function.Predicate;

/**
 * 项目对外公开 UID 生成器。
 * <p>
 * 规则（与 db.sql CHECK 一致）：{@code PR} + 11 位 {@code [A-Za-z0-9]}。
 * 与自增 {@code project.id} 组成双 ID：内部关联 / 外网 API 仅暴露 {@code project_uid}。
 * </p>
 */
public final class ProjectUidGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] ALPHABET =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();
    private static final int SUFFIX_LENGTH = 11;
    private static final int MAX_COLLISION_RETRIES = 10;

    private ProjectUidGenerator() {
    }

    public static String generate(Predicate<String> uniquenessChecker) {
        for (int attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
            String suffix = NanoIdUtils.randomNanoId(RANDOM, ALPHABET, SUFFIX_LENGTH);
            String uid = "PR" + suffix;
            if (uniquenessChecker == null || uniquenessChecker.test(uid)) {
                return uid;
            }
        }
        throw new IllegalStateException("Failed to generate unique project_uid after "
                + MAX_COLLISION_RETRIES + " attempts");
    }
}
