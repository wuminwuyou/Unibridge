package com.example.demo.client.service;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * 笔记浏览量短时去重：同一访问者对同一笔记在窗口期内只计一次有效浏览。
 * <p>
 * 访问者标识：登录用户 {@code u:{userId}}；未登录 {@code ip:{clientIp}}。
 * 单节点内存实现，适用于联调与小规模部署；集群环境可替换为 Redis。
 * </p>
 */
@Component
public class NoteViewTracker {

    /** 同一访问者对同一笔记的浏览计次冷却窗口（毫秒） */
    private static final long THROTTLE_WINDOW_MS = 30L * 60 * 1000;

    private final ConcurrentHashMap<String, Long> lastViewAtMs = new ConcurrentHashMap<>();

    /**
     * 判断是否应计入一次有效浏览，并在首次/冷却结束后记录本次访问时间。
     *
     * @param viewerKey 访问者键，如 {@code u:1001} 或 {@code ip:203.0.113.1}
     * @param noteId    笔记 ID
     * @return {@code true} 表示应 +1；窗口内重复访问返回 {@code false}
     */
    public boolean shouldCountView(String viewerKey, Long noteId) {
        if (viewerKey == null || viewerKey.isBlank() || noteId == null) {
            return false;
        }
        String cacheKey = viewerKey + ":note:" + noteId;
        long now = System.currentTimeMillis();
        Long last = lastViewAtMs.get(cacheKey);
        if (last != null && now - last < THROTTLE_WINDOW_MS) {
            return false;
        }
        lastViewAtMs.put(cacheKey, now);
        if (lastViewAtMs.size() > 10_000) {
            purgeExpired(now);
        }
        return true;
    }

    private void purgeExpired(long now) {
        lastViewAtMs.entrySet().removeIf(entry -> now - entry.getValue() >= THROTTLE_WINDOW_MS);
    }
}
