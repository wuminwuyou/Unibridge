package com.unibridge.backend.infrastructure.entities;

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
    @TableField("user_uid")
    private String userUid;
    @TableField("nick_name")
    private String nickName;
    @TableField("avatar_url")
    private String avatarUrl;
    @TableField("level")
    private String level;
    @TableField("bio_data")
    private String bioData;
    @TableField("career_data")
    private String careerData;
    @TableField("graduation_year")
    private Integer graduationYear;
    @TableField("intro")
    private String intro;
    @TableField("announcement")
    private String announcement;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
