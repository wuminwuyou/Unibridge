package com.unibridge.backend.domain.project;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 解析项目预算区间字符串，提取最小值和最大值。
 *
 * <h3>支持的格式</h3>
 * <table>
 *   <tr><td>{@code "10000 - 20000"}</td><td>→ {@code ["10000", "20000"]}</td></tr>
 *   <tr><td>{@code "10000-20000"}</td><td>→ {@code ["10000", "20000"]}</td></tr>
 *   <tr><td>{@code "5k - 20k"}</td><td>→ {@code ["5000", "20000"]}</td></tr>
 *   <tr><td>{@code "5000"}</td><td>→ {@code ["5000", null]}</td></tr>
 *   <tr><td>{@code "面议"}</td><td>→ {@code [null, null]}</td></tr>
 *   <tr><td>{@code "30万以上"}</td><td>→ {@code ["300000", null]}</td></tr>
 *   <tr><td>{@code null / ""}</td><td>→ {@code [null, null]}</td></tr>
 * </table>
 *
 * <p>返回的 {@link BudgetRange} 中 {@code min} / {@code max} 均为纯数字字符串
 * （不含千分位逗号），供前端 {@code formatBudgetRange()} 渲染使用。</p>
 *
 * @see <a href="API-1.md">API-1.md §4 项目卡片数据模型</a>
 */
@Component
public class BudgetRangeParser {

    /** 预算区间分隔符 */
    private static final String RANGE_SEPARATOR = "-";

    /**
     * 解析预算区间字符串。
     *
     * @param raw 原始预算区间字符串（来自 t_project.budget）
     * @return 解析后的区间，两端均可为 null
     */
    public BudgetRange parse(String raw) {
        if (!StringUtils.hasText(raw)) {
            return BudgetRange.empty();
        }

        String trimmed = raw.trim();

        // 纯数字："5000"
        if (trimmed.matches("^\\d+$")) {
            return new BudgetRange(trimmed, null);
        }

        // 含分隔符："10000 - 20000" / "10000-20000" / "5k - 20k"
        String[] parts = splitBySeparator(trimmed);
        if (parts.length >= 2) {
            String min = parsePart(parts[0]);
            String max = parsePart(parts[1]);
            if (min != null || max != null) {
                return new BudgetRange(min, max);
            }
        }

        // 含单位的单值："30万以上" / "5k"
        String single = parsePart(trimmed);
        if (single != null) {
            return new BudgetRange(single, null);
        }

        // 无法解析："面议"
        return BudgetRange.empty();
    }

    /**
     * 在第一个 {@code -} 处分割，保留左右两侧原始文本。
     */
    private String[] splitBySeparator(String text) {
        int idx = text.indexOf(RANGE_SEPARATOR);
        if (idx < 0) {
            return new String[]{text};
        }
        String left = text.substring(0, idx).trim();
        String right = text.substring(idx + 1).trim();
        return new String[]{left, right};
    }

    /**
     * 解析单个数值部分，支持 {@code k} / {@code w} / {@code 万} / {@code M} 后缀。
     *
     * @return 纯数字字符串，或 null 表示无法解析
     */
    private String parsePart(String part) {
        if (!StringUtils.hasText(part)) {
            return null;
        }
        String s = part.trim();

        // 纯数字
        if (s.matches("^\\d+$")) {
            return s;
        }

        // 带小数点的数字："1.5k" / "0.8M"
        try {
            if (s.endsWith("k") || s.endsWith("K")) {
                double val = Double.parseDouble(s.substring(0, s.length() - 1));
                return String.valueOf((long) (val * 1_000));
            }
            if (s.endsWith("w") || s.endsWith("W")) {
                double val = Double.parseDouble(s.substring(0, s.length() - 1));
                return String.valueOf((long) (val * 10_000));
            }
            if (s.endsWith("万")) {
                double val = Double.parseDouble(s.substring(0, s.length() - 1));
                return String.valueOf((long) (val * 10_000));
            }
            if (s.endsWith("M") || s.endsWith("m")) {
                double val = Double.parseDouble(s.substring(0, s.length() - 1));
                return String.valueOf((long) (val * 1_000_000));
            }
        } catch (NumberFormatException ignored) {
            // fall through
        }

        // 纯中文数值："三十" → 无法解析，返回 null
        return null;
    }

    /**
     * 解析结果，两端均为纯数字字符串或 null。
     */
    public record BudgetRange(String min, String max) {
        static BudgetRange empty() {
            return new BudgetRange(null, null);
        }
    }
}
