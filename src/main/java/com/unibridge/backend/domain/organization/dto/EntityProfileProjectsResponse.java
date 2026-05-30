package com.unibridge.backend.domain.organization.dto;

import com.unibridge.backend.application.shared.dto.ProfileProjectItem;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 机构空间项目 Tab 分页响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityProfileProjectsResponse {
    private String entityCode;
    private List<ProfileProjectItem> projects;
    private Long total;
    private Integer page;
    private Integer pageSize;
}
