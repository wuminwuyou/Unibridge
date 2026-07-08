package com.unibridge.backend.infrastructure.entities.project;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 项目难度评估明细与审计日志实体（对应 t_project_level_audit 表）。
 */
@Data
@TableName("t_project_level_audit")
public class ProjectLevelAudit {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String evaluationUid;
    private String projectUid;
    private String userUid;
    private String keyId;
    private String evaluatorType;

    // ── 输入快照 ──
    private String descriptionPlaintext;
    private String contentDetailCiphertext;

    // ── 预检 ──
    private String precheckStatus;
    private Boolean logicCheckFailed;

    // ── 六维特征 ──
    private String featScale;
    private String featScaleReason;
    private String featScaleEvidence;
    private String featIntegration;
    private String featIntegrationReason;
    private String featIntegrationEvidence;
    private String featConstraints;
    private String featConstraintsReason;
    private String featConstraintsEvidence;
    private String featAvailability;
    private String featAvailabilityReason;
    private String featAvailabilityEvidence;
    private String featThreshold;
    private String featThresholdReason;
    private String featThresholdEvidence;
    private String featDomainSpan;
    private String featDomainSpanReason;
    private String featDomainSpanEvidence;

    // ── 汇总 ──
    private String engineeringLevel;
    private String engineeringBasedOn;
    private String innovationLevel;
    private String innovationBasedOn;

    // ── 最终 ──
    private String finalLevel;
    private String finalReason;

    // ── 快照 ──
    private String rawModelOutput;

    // ── 审计 ──
    private String evaluationRequest;
    private String modelName;
    private Integer promptTokens;
    private Integer completionTokens;
    private Integer tokenUsage;
    private Integer thinkingTokens;
    private String operatorUid;

    private LocalDateTime createdAt;
}
