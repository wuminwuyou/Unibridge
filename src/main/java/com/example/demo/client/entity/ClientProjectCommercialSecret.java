package com.example.demo.client.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 商业项目敏感扩展，映射 `project_commercial_secret` 表。 */
@Data
@TableName("project_secret")
public class ClientProjectCommercialSecret {
    @TableId("project_id")
    private Long projectId;
    @TableField("total_budget")
    private BigDecimal totalBudget;
    @TableField("commercial_status")
    private String commercialStatus;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
