package com.example.demo.client.dto;

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
    private String descriptionEditorType;
    private String amount;
    private String level;
    private String duration;
    private String teamSize;
    private List<String> skillTags;
    private String deadline;
    private String status;
    private String publishedAt;
    private String updatedAt;
}
