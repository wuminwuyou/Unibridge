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
    /** 页壳预览专用；成员 Tab 可不填 */
    private String realName;
    private String role;
    private String avatarUrl;
    private String level;
}
