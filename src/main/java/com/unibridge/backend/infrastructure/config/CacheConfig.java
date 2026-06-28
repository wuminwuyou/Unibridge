package com.unibridge.backend.infrastructure.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * Spring Cache 配置。
 * <p>
 * CacheManager Bean 已由 {@link RedisConfig} 提供（{@code RedissonSpringCacheManager}），
 * 所有 {@code @Cacheable} / {@code @CacheEvict} 注解自动通过 Redisson 原生客户端直连 Redis 读写缓存，
 * 不再经过 {@code DefaultedRedisConnection} 代理桥接，彻底避免 Redisson 版本兼容导致的 {@link StackOverflowError}。
 * </p>
 * <p>
 * 启动时自动清理 Feed 缓存池，避免上一版本序列化数据与新代码不兼容。
 * </p>
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_HOME_FEED = FeedCacheConfig.CACHE_HOME_FEED;
    public static final String CACHE_SIMILAR_NOTES = FeedCacheConfig.CACHE_SIMILAR_NOTES;
    public static final String CACHE_PROJECT_FEED = FeedCacheConfig.CACHE_PROJECT_FEED;
    public static final String CACHE_NOTE_FEED = FeedCacheConfig.CACHE_NOTE_FEED;

    private final CacheManager cacheManager;

    public CacheConfig(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @PostConstruct
    void clearFeedCachesOnStartup() {
        for (String name : java.util.List.of(CACHE_HOME_FEED, CACHE_SIMILAR_NOTES, CACHE_PROJECT_FEED, CACHE_NOTE_FEED)) {
            org.springframework.cache.Cache cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
            }
        }
    }
}
