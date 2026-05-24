package com.example.demo.client.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 用户内容互动状态，映射 {@code user_content_interaction}。 */
@Data
@TableName("user_content_interaction")
public class UserContentInteraction {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_id")
    private Long userId;
    @TableField("target_type")
    private String targetType;
    @TableField("target_id")
    private Long targetId;
    private Integer liked;
    private Integer collected;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
