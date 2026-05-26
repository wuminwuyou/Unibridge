package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 团队空间页壳（Hero + 侧栏 + 成员预览）响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamProfileSpaceResponse {

    private String teamUid;
    private TeamCoreProfile coreProfile;
    private TeamExtendedProfile extendedProfile;
    private List<TeamMemberItem> members;
    private List<TeamInfoRow> infoRows;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamCoreProfile {
        private String teamUid;
        private String name;
        private String description;
        /** LAB 取自 entity_profile；学生团队可为 null */
        private String organizationName;
        private String logoUrl;
        private Integer memberCount;
        /** 成立/创建时间，格式 yyyy.MM.dd */
        private String foundedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamExtendedProfile {
        private String notice;
        private String researchDirection;
        private String contactEmail;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamInfoRow {
        private String label;
        private String value;
    }
}
