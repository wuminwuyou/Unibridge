package com.unibridge.backend.infrastructure.entities.team;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("team_member")
public class TeamMember {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("team_uid")
    private String teamUid;
    @TableField("user_uid")
    private String userUid;
    private String role;
    @TableField("lab_user_uid")
    private String labUserUid;
    private String career;
    @TableField("is_admin")
    private Integer isAdmin;
    @TableField("invited_by_uid")
    private String invitedByUid;
    @TableField("joined_at")
    private LocalDateTime joinedAt;
}
