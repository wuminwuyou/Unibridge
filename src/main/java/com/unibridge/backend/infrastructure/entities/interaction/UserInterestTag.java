package com.unibridge.backend.infrastructure.entities.interaction;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("p_user_interest_tag")
public class UserInterestTag {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_uid")
    private String userUid;
    private String tag;
    private BigDecimal weight;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
