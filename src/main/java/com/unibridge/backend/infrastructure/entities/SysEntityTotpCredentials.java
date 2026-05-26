package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 主体管理员 TOTP 凭证，映射 `sys_entity_totp_credentials` 表。 */
@Data
@TableName("sys_entity_totp_credentials")
public class SysEntityTotpCredentials {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("admin_uid")
    private String adminUid;
    @TableField("entity_code")
    private String entityCode;
    @TableField("password_hash")
    private String passwordHash;
    @TableField("totp_secret")
    private String totpSecret;
    @TableField("display_name")
    private String displayName;
    @TableField("is_primary")
    private Integer isPrimary;
    @TableField("account_status")
    private String accountStatus;
    @TableField("account_status_changed_at")
    private LocalDateTime accountStatusChangedAt;
    @TableField("last_login_at")
    private LocalDateTime lastLoginAt;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
