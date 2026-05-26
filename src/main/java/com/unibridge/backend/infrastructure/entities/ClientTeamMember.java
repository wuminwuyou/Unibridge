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
    @TableField("team_uid")
    private String teamUid;
    @TableField("user_uid")
    private String userUid;
    private String role;
    @TableField("lab_user_uid")
    private String labUserUid;
    /** 团队中职位补充，如「前端开发」「NLP 方向」 */
    private String career;
    @TableField("is_admin")
    private Integer isAdmin;
    @TableField("invited_by_uid")
    private String invitedByUid;
    @TableField("joined_at")
    private LocalDateTime joinedAt;
}
