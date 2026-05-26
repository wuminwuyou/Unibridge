package com.unibridge.backend.domain.interaction.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "点赞/收藏同步请求")
@Data
public class ContentInteractionRequest {
    @Schema(description = "NOTE | PROJECT")
    private String targetType;
    @Schema(description = "目标内容对外 UID")
    private String targetUid;
    @Schema(description = "true=点赞/收藏；false=取消")
    private Boolean active;
}
