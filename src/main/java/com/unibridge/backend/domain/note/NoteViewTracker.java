package com.unibridge.backend.domain.note;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 笔记浏览量短时去重：同一访问者对同一笔记在窗口期内只计一次有效浏览。
 * <p>
 * 访问者标识：登录用户 {@code u:{userId}}；未登录 {@code ip:{clientIp}}。
 * 使用 Redis 存储，支持多实例部署。
 * </p>
 */
@Component
public class NoteViewTracker {

    private static final String REDIS_PREFIX = "note:view:";

    /** 同一访问者对同一笔记的浏览计次冷却窗口 */
    private static final Duration THROTTLE_WINDOW = Duration.ofMinutes(30);

    /** 最大容量，用于触发过期清理 */
    private static final long MAX_SIZE = 10_000;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

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
        String cacheKey = REDIS_PREFIX + viewerKey + ":note:" + noteId;
        // SET NX 保证原子性：key 不存在才 SET，否则返回 false
        Boolean success = stringRedisTemplate.opsForValue()
                .setIfAbsent(cacheKey, String.valueOf(System.currentTimeMillis()), THROTTLE_WINDOW);
        return Boolean.TRUE.equals(success);
    }
}
