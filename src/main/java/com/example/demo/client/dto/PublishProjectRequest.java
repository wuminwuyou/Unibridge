package com.example.demo.client.dto;

import com.example.demo.security.xss.XssClean;
import lombok.Data;

import java.util.List;

/** 创建/更新项目请求体（POST /projects、PUT /projects/{id}）。 */
@Data
public class PublishProjectRequest {
    private String publishAction;
    @XssClean
    private String title;
    @XssClean
    private String summary;
    private String channel;
    private String campusRecruitType;
    /** Markdown/HTML 详情；反序列化时自动 XSS 清洗 */
    @XssClean
    private String description;
    private String amount;
    private String level;
    private String duration;
    private String teamSize;
    private List<String> skillTags;
    private String deadline;
}
