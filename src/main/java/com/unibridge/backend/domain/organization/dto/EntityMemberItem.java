package com.unibridge.backend.domain.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 机构空间人员项。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityMemberItem {
    private String uid;
    private String nickname;
    /** 脱敏展示名（来自 t_user_identity.real_name_mask，如 *同学、*经理） */
    private String displayName;
    private String role;
    private String avatarUrl;
    private String level;
}

