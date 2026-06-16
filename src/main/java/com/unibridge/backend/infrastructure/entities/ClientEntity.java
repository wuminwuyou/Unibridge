package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Client 端主体账号实体，映射 `entity` 表。
 */
@Data
@TableName("tenant_organization")
public class ClientEntity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String entityCode;
    private String passwordHash;
    private String totpSecret;
    private BigDecimal balance;
    private String auditStatus;
    private String auditAdminId;
    private LocalDateTime auditedAt;
    @TableField("account_status")
    private String accountStatus;
    @TableField("account_status_changed_at")
    private LocalDateTime accountStatusChangedAt;
    @TableField("account_status_remark")
    private String accountStatusRemark;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
