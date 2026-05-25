package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户与主体认证关系实体，映射 `user_auth_link` 表。
 */
@Data
@TableName("user_auth_link")
public class UserAuthLink {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_id")
    private Long userId;
    @TableField("entity_id")
    private Long entityId;
    @TableField("role")
    private String role;
    @TableField("auth_serial_no")
    private String authSerialNo;
    @TableField("proof_artifact_url")
    private String proofArtifactUrl;
    @TableField("audit_status")
    private String auditStatus;
    @TableField("is_active")
    private Integer isActive;
    private String remark;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
