package com.unibridge.backend.infrastructure.util;

import java.util.function.Predicate;

/** 成就归档对外 UID：{@code AC} + 11 位 NanoID。 */
public final class AchievementUidGenerator {

    private AchievementUidGenerator() {
    }

    public static String generate(Predicate<String> uniquenessChecker) {
        return PublicUidGenerator.generate("AC", uniquenessChecker);
    }
}
