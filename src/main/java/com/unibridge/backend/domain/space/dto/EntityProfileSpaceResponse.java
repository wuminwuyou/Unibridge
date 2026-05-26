package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 机构空间页壳响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityProfileSpaceResponse {

    private String entityCode;
    private EntityCoreProfile coreProfile;
    private EntityExtendedProfile extendedProfile;
    private List<EntityTeamPreviewItem> teamsPreview;
    private List<EntityMemberItem> membersPreview;
    private List<EntityInfoRow> infoRows;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EntityCoreProfile {
        private String entityCode;
        private String name;
        private String intro;
        private String location;
        private String type;
        private String logoUrl;
        private String bannerUrl;
        private Integer teamCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EntityExtendedProfile {
        private String announcement;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EntityInfoRow {
        private String label;
        private String value;
    }
}
