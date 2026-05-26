package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 团队空间「成员」Tab 分页响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamProfileMembersResponse {
    private String teamUid;
    private List<TeamMemberItem> members;
    private Long total;
    private Integer page;
    private Integer pageSize;
}
