package com.unibridge.backend.infrastructure.util;

import java.util.function.Predicate;

/** 用户对外 UID：{@code US} + 11 位 NanoID。 */
public final class UserUidGenerator {

    private UserUidGenerator() {
    }

    public static String generate(Predicate<String> uniquenessChecker) {
        return PublicUidGenerator.generate("US", uniquenessChecker);
    }
}
