package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 团队/实验室成员实体，映射 `team_member` 表。 */
@Data
@TableName("team_member")
public class ClientTeamMember {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("team_id")
    private Long teamId;
    @TableField("user_id")
    private Long userId;
    private String role;
    @TableField("lab_user_id")
    private Long labUserId;
    @TableField("joined_at")
    private LocalDateTime joinedAt;
}
