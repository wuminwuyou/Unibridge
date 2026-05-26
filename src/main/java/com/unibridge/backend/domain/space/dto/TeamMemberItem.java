package com.unibridge.backend.domain.space.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "团队空间成员卡片项")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMemberItem {
    @Schema(description = "成员 user_uid")
    private String uid;
    @Schema(description = "展示名：团队成员查看时为 real_name（无则 nickname），否则为 nickname")
    private String nickname;
    @Schema(description = "身份枚举：LEADER | MENTOR | MEMBER", example = "MENTOR")
    private String role;
    @Schema(description = "团队内职位补充文案", example = "前端开发")
    private String career;
    @Schema(description = "是否团队管理员（含 owner 兜底）", example = "true")
    private Boolean isAdmin;
    @Schema(description = "是否为 team.owner_uid", example = "false")
    private Boolean isOwner;
    @Schema(description = "邀请/审批加入人 user_uid；owner 为 null", example = "US00000000002")
    private String invitedByUid;
    private String avatarUrl;
    @Schema(description = "能力等级 N/R/SR/SSR/UR，无效时 null")
    private String level;
}
