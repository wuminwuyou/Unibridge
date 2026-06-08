package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_approval_flows")
public class SysApprovalFlow {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("approval_key")
    private String approvalKey;

    @TableField("business_type")
    private String businessType;

    @TableField("applicant_key")
    private String applicantKey;

    @TableField("target_key")
    private String targetKey;

    @TableField("audit_uid")
    private String auditUid;

    private Integer status;

    @TableField("payload")
    private String payload;

    private String remark;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
