package com.unibridge.backend.domain.team.dto;

import com.unibridge.backend.application.shared.dto.ProfileProjectItem;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 团队空间「项目」Tab 分页响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamProfileProjectsResponse {
    private String teamUid;
    private List<ProfileProjectItem> projects;
    private Long total;
    private Integer page;
    private Integer pageSize;
}
