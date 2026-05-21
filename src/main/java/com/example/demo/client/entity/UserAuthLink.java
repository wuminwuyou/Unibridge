package com.example.demo.client.entity;

import com.baomidou.mybatisplus.annotation.IdType;
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
    private Long userId;
    private Long entityId;
    private Long labId;
    private String businessRole;
    private String auditStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
