package com.unibridge.backend.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 模型评估结果 DTO，与 AI 模型 JSON 输出格式一一对应。
 * 用于 Jackson 反序列化模型返回的 JSON。
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LevelEvalResult {

    private Precheck precheck;
    private Features features;

    @JsonProperty("engineering_level")
    private SummaryLevel engineeringLevel;

    @JsonProperty("innovation_level")
    private SummaryLevel innovationLevel;

    @JsonProperty("overall_level")
    private OverallLevel overallLevel;

    // ─── 内嵌类 ───

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Precheck {
        private String status;
        @JsonProperty("insufficient_dimensions")
        private List<String> insufficientDimensions;
        private List<String> notes;
        @JsonProperty("logic_check")
        private LogicCheck logicCheck;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LogicCheck {
        private boolean failed;
        private List<LogicIssue> issues;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LogicIssue {
        private String quote;
        private String reason;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Features {
        @JsonProperty("scale_and_size")
        private FeatureItem scaleAndSize;

        @JsonProperty("integration_and_depth")
        private FeatureItem integrationAndDepth;

        @JsonProperty("standards_and_constraints")
        private FeatureItem standardsAndConstraints;

        @JsonProperty("solution_availability")
        private FeatureItem solutionAvailability;

        @JsonProperty("theoretical_threshold")
        private FeatureItem theoreticalThreshold;

        @JsonProperty("domain_span")
        private FeatureItem domainSpan;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FeatureItem {
        private String level;
        private String reason;
        private String evidence;
        private String guidance;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SummaryLevel {
        private String level;
        @JsonProperty("based_on")
        private String basedOn;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OverallLevel {
        private String level;
        private String reason;
        @JsonProperty("guidance_summary")
        private String guidanceSummary;
    }
}
