package com.unibridge.backend.infrastructure.entities.auth;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_uid")
    private String userUid;
    private String phone;
    private String email;
    private String passwordHash;
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
