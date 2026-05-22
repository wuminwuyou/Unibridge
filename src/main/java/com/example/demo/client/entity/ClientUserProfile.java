package com.example.demo.client.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Client 端个人资料实体，映射 `user_profile` 表。
 */
@Data
@TableName("user_profile")
public class ClientUserProfile {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_id")
    private Long userId;
    @TableField("nick_name")
    private String nickName;
    @TableField("real_name")
    private String realName;
    @TableField("avatar_url")
    private String avatarUrl;
    @TableField("current_entity_name")
    private String currentEntityName;
    @TableField("level")
    private String level;
    @TableField("bio_data")
    private String bioData;
    @TableField("career_data")
    private String careerData;
    @TableField("intro")
    private String intro;
    @TableField("announcement")
    private String announcement;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
