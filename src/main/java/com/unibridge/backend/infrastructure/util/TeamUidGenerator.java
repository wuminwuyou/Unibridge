package com.unibridge.backend.infrastructure.util;

import java.util.Locale;
import java.util.function.Predicate;

/** 团队对外 UID：实验室 {@code LB}、学生团队 {@code ST} + 11 位 NanoID。 */
public final class TeamUidGenerator {

    private TeamUidGenerator() {
    }

    public static String generateLab(Predicate<String> uniquenessChecker) {
        return PublicUidGenerator.generate("LB", uniquenessChecker);
    }

    public static String generateStudentTeam(Predicate<String> uniquenessChecker) {
        return PublicUidGenerator.generate("ST", uniquenessChecker);
    }

    public static String generateForType(String teamType, Predicate<String> uniquenessChecker) {
        if (teamType == null) {
            throw new IllegalArgumentException("teamType is required");
        }
        return switch (teamType.toUpperCase(Locale.ROOT)) {
            case "LAB" -> generateLab(uniquenessChecker);
            case "STUDENT_TEAM" -> generateStudentTeam(uniquenessChecker);
            default -> throw new IllegalArgumentException("Unsupported team type: " + teamType);
        };
    }
}
