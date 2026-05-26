package com.unibridge.backend.domain.space.dto;

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
}
