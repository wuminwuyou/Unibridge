package com.example.demo.client.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Client 端个人账号实体，映射 `user` 表。
 */
@Data
@TableName("user")
public class ClientUser {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String phone;
    private String email;
    private String passwordHash;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
