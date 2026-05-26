package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 统一团队/实验室实体，映射 `team` 表。 */
@Data
@TableName("team")
public class ClientTeam {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("team_uid")
    private String teamUid;
    private String type;
    @TableField("team_logo")
    private String teamLogo;
    @TableField("owner_uid")
    private String ownerUid;
    @TableField("owner_name")
    private String ownerName;
    @TableField("entity_code")
    private String entityCode;
    @TableField("team_name")
    private String teamName;
    private String tag;
    private String intro;
    private String announcement;
    @TableField("contact_email")
    private String contactEmail;
    @TableField("audit_status")
    private String auditStatus;
    @TableField("audited_at")
    private LocalDateTime auditedAt;
    @TableField("audit_remark")
    private String auditRemark;
    @TableField("account_status")
    private String accountStatus;
    @TableField("account_status_changed_at")
    private LocalDateTime accountStatusChangedAt;
    @TableField("account_status_remark")
    private String accountStatusRemark;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
