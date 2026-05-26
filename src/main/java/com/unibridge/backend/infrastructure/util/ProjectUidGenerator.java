package com.unibridge.backend.infrastructure.util;

import java.util.function.Predicate;

/**
 * 项目对外公开 UID 生成器。
 * <p>
 * 规则（与 db.sql CHECK 一致）：{@code PR} + 11 位 {@code [A-Za-z0-9]}。
 * </p>
 */
public final class ProjectUidGenerator {

    private ProjectUidGenerator() {
    }

    public static String generate(Predicate<String> uniquenessChecker) {
        return PublicUidGenerator.generate("PR", uniquenessChecker);
    }
}
