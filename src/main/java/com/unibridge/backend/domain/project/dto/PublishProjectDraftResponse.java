package com.unibridge.backend.domain.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** GET /projects/{uid}/draft 响应体。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishProjectDraftResponse {
    private String uid;
    private String publishAction;
    private String title;
    private String summary;
    private String channel;
    private String campusRecruitType;
    private String description;
    /** 商业项目加密描述密文（仅 category=COMMERCIAL） */
    private String contentDetail;
    private String amountMin;
    private String amountMax;
    private String level;
    private String duration;
    private List<String> skillTags;
    private String deadline;
}
