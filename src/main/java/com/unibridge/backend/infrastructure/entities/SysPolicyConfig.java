package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_policy_config")
public class SysPolicyConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("policy_type")
    private String policyType;

    @TableField("version_code")
    private String versionCode;

    @TableField("content_hash")
    private String contentHash;

    @TableField("policy_content")
    private String policyContent;

    @TableField("is_active")
    private Integer isActive;

    @TableField("created_at")
    private LocalDateTime createdAt;
}

