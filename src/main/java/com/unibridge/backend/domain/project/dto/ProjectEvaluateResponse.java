package com.unibridge.backend.domain.project.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectEvaluateResponse {
    /** S / A / B / C / D / E */
    private String level;
    /** 评估结果说明 */
    private String explanation;
    /** 修改建议，null 表示评估通过 */
    private String suggestions;
}
