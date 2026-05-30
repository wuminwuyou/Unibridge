package com.unibridge.backend.domain.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 机构空间实验室预览卡片。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityTeamPreviewItem {
    private String teamUid;
    private String name;
    private String description;
    private String logoUrl;
    private Integer memberCount;
    /** 实验室负责人对外 uid（= team.owner_uid），无负责人时为 null */
    private String leaderUid;
    /** 负责人展示名称（realName || nickname），无负责人时为 null */
    private String leaderDisplayName;
}
