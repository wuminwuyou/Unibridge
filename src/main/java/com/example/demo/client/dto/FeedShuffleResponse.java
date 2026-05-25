package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 「换一换」Feed 响应：混排内容 + 分页元数据，供前端切歌式交互。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedShuffleResponse {

    /** 当前页内容（笔记与项目混排，或专区单一类型） */
    private List<ContentVO> items;

    /** 实际生效页码（可能发生循环重置） */
    private int page;

    /** 本页请求条数 */
    private int size;

    /** 可见内容总数（用于前端展示进度 / 判断是否可继续换） */
    private long total;

    /**
     * 是否触发「大风车循环」：{@code page * size > total} 时服务端自动重置为第 1 页。
     */
    private boolean pageWrapped;

    /**
     * 打散机制：{@code CACHE_PAGE}（机制 A，走 Spring Cache）|
     * {@code RANDOM_SEED}（机制 B，Java {@code Collections.shuffle} + {@code Random(seed)}，不缓存）。
     */
    private String shuffleMode;

    /** 机制 B 实际生效的随机种子（便于前端调试；机制 A 为 {@code null}） */
    private Long seed;
}
