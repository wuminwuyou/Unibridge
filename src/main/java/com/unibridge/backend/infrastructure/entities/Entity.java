package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("tenant_organization")
public class Entity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String type;
    private BigDecimal balance;
    private String intro;
    private LocalDateTime lastLoginAt;
    private String auditStatus;
    private String auditAdminId;
    private LocalDateTime auditedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
