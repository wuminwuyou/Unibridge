package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 团队空间「主页」Tab 响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamProfileHomeResponse {
    private String teamUid;
    private List<ProfileProjectItem> projects;
    private List<ProfileNoteItem> notes;
    private List<TeamAchievementItem> achievements;
    private Long projectTotal;
    private Long noteTotal;
    private Long achievementTotal;
}
