package com.unibridge.backend.domain.feed.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "Feed 用户行为埋点请求")
@Data
public class FeedBehaviorEventRequest {
    @Schema(description = "VIEW_DETAIL | LIKE | COLLECT")
    private String eventType;
    @Schema(description = "NOTE | PROJECT")
    private String targetType;
    @Schema(description = "目标内容对外 UID")
    private String targetUid;
    @Schema(description = "目标内容标签快照，用于累加 user_tag_interests 权重")
    private List<String> tags;
}
