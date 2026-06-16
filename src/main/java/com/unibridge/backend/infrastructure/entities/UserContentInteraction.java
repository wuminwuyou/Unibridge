package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 用户内容互动状态，映射 {@code user_content_interaction}。 */
@Data
@TableName("user_interaction")
public class UserContentInteraction {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_uid")
    private String userUid;
    @TableField("target_type")
    private String targetType;
    @TableField("target_uid")
    private String targetUid;
    private Integer liked;
    private Integer collected;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
