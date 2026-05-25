package com.unibridge.backend.domain.feed.dto;

import lombok.Data;

import java.util.List;

/** POST /feed/events 用户行为埋点请求。 */
@Data
public class FeedBehaviorEventRequest {
    /** VIEW_DETAIL | LIKE | COLLECT */
    private String eventType;
    /** NOTE | PROJECT */
    private String targetType;
    /** 目标内容对外 UID */
    private String targetUid;
    /** 目标内容标签快照，用于累加 user_tag_interests 权重 */
    private List<String> tags;
}
