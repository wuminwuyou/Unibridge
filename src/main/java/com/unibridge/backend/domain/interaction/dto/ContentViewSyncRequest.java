package com.unibridge.backend.domain.interaction.dto;

import lombok.Data;

/** POST /interactions/view 播放量/浏览量同步（视频播放等场景）。 */
@Data
public class ContentViewSyncRequest {
    /** NOTE | PROJECT（当前仅 NOTE 计数器生效） */
    private String targetType;
    /** 目标内容对外 UID */
    private String targetUid;
}
