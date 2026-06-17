package com.unibridge.backend.infrastructure.entities.im;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("project_milestone")
public class ProjectMilestone {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("project_uid")
    private String projectUid;
    private String title;
    @TableField("payment_pct")
    private BigDecimal paymentPct;
    private String status;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
