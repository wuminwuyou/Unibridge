package com.unibridge.backend.domain.interaction.dto;

import lombok.Data;

/** PUT /interactions/like | /interactions/collect 请求。 */
@Data
public class ContentInteractionRequest {
    /** NOTE | PROJECT */
    private String targetType;
    /** 目标内容对外 UID */
    private String targetUid;
    /** true=点赞/收藏；false=取消 */
    private Boolean active;
}
