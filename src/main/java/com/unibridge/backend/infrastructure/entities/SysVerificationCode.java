package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_verification_codes")
public class SysVerificationCode {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;

    @TableField("entity_code")
    private String entityCode;

    @TableField("is_master")
    private Integer isMaster;

    @TableField("parent_id")
    private Long parentId;

    @TableField("max_quota")
    private Integer maxQuota;

    @TableField("used_quota")
    private Integer usedQuota;

    private String description;

    @TableField("graduation_year")
    private Integer graduationYear;

    @TableField("created_by")
    private String createdBy;

    @TableField("expire_time")
    private LocalDateTime expireTime;

    @TableField("is_active")
    private Integer isActive;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
