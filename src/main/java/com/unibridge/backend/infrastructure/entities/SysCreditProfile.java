package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 用户信用档案主表，映射 {@code sys_credit_profiles}。 */
@Data
@TableName("sys_credit_profiles")
public class SysCreditProfile {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_uid")
    private String userUid;
    @TableField("credit_score")
    private Integer creditScore;
    @TableField("account_status")
    private String accountStatus;
    @TableField("last_changed_at")
    private LocalDateTime lastChangedAt;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
