package com.unibridge.backend.infrastructure.entities.profile;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_organization_binding")
public class UserOrganizationBinding {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_uid")
    private String userUid;
    @TableField("entity_code")
    private String entityCode;
    @TableField("role")
    private String role;
    @TableField("auth_serial_no")
    private String authSerialNo;
    @TableField("proof_artifact_url")
    private String proofArtifactUrl;
    @TableField("audit_status")
    private String auditStatus;
    @TableField("audit_uid")
    private String auditUid;
    @TableField("audited_at")
    private LocalDateTime auditedAt;
    @TableField("is_active")
    private Integer isActive;
    private String remark;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
