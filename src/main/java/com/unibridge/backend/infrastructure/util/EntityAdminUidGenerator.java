package com.unibridge.backend.infrastructure.util;

import java.util.function.Predicate;

/** 主体管理员对外 UID：{@code EA} + 11 位 NanoID。 */
public final class EntityAdminUidGenerator {

    private EntityAdminUidGenerator() {
    }

    public static String generate(Predicate<String> uniquenessChecker) {
        return PublicUidGenerator.generate("EA", uniquenessChecker);
    }
}
