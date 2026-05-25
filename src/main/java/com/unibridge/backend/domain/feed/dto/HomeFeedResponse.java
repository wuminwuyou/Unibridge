package com.unibridge.backend.domain.feed.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** GET /feed/home 响应：笔记 5 条 + 项目 10 条。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeFeedResponse {
    /** 推荐笔记，固定最多 5 条 */
    private List<ContentVO> notes;
    /** 推荐项目，固定最多 10 条 */
    private List<ContentVO> projects;
}
