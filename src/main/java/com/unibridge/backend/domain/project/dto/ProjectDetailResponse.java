package com.unibridge.backend.domain.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** GET /projects/{uid} 响应体。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDetailResponse {
    /** 对外公开 UID（= project_uid） */
    private String uid;
    private String title;
    private String summary;
    private String channel;
    private String campusRecruitType;
    private String description;
    private String amountMin;
    private String amountMax;
    private String level;
    private String duration;
    private List<String> skillTags;
    private String deadline;
    private String status;
    private String publishedAt;
    private String updatedAt;
    /** 项目发布者身份信息 */
    private Owner owner;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Owner {
        private String uid;
        private String name;
        private String avatarUrl;
        private List<String> careerData;
        private String organization;
        private String location;
    }
}
