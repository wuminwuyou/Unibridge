package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 团队空间成员卡片项（仅昵称，禁止实名）。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMemberItem {
    /** 成员 user_uid */
    private String uid;
    private String nickname;
    /** 团队内职位展示文案，如「队长」「导师」 */
    private String role;
    private String avatarUrl;
    /** N / R / SR / SSR / UR；无效或空时为 null */
    private String level;
}
