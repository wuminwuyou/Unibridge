package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 机构空间实验室 Tab 分页响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityProfileTeamsResponse {
    private String entityCode;
    private List<EntityTeamPreviewItem> teams;
    private Long total;
    private Integer page;
    private Integer pageSize;
}
