package com.unibridge.backend.infrastructure.entities.infra;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_credit_logs")
public class CreditLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_uid")
    private String userUid;
    @TableField("change_amount")
    private Integer changeAmount;
    @TableField("score_before")
    private Integer scoreBefore;
    @TableField("score_after")
    private Integer scoreAfter;
    @TableField("biz_type")
    private String bizType;
    @TableField("biz_ref_key")
    private String bizRefKey;
    @TableField("operator_key")
    private String operatorKey;
    private String remark;
    @TableField("created_at")
    private LocalDateTime createdAt;
}
