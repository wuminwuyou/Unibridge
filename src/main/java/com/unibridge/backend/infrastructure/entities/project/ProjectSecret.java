package com.unibridge.backend.infrastructure.entities.project;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("project_secret")
public class ProjectSecret {
    @TableId("project_uid")
    private String projectUid;
    @TableField("total_budget")
    private BigDecimal totalBudget;
    @TableField("encrypted_description")
    private String encryptedDescription;
    @TableField("description_key_id")
    private String descriptionKeyId;
    @TableField("commercial_status")
    private String commercialStatus;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
