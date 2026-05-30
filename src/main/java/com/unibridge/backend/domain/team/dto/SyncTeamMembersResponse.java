package com.unibridge.backend.domain.team.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncTeamMembersResponse {
    private String teamUid;
    private List<TeamMemberItem> members;
    private Long total;
}
