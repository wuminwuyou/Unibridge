package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 团队空间成果卡片项（脱敏字段）。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamAchievementItem {
    private String achievementUid;
    private String maskedProjectName;
    private String taskDescription;
    private List<String> technicalTags;
    private String completedAt;
}
