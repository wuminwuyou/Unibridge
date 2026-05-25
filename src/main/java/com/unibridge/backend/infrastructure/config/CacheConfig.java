package com.unibridge.backend.infrastructure.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Cache 配置（渐进式架构）。
 * <p>
 * 当前阶段：{@link ConcurrentMapCacheManager} 本地内存缓存，零 Redis 依赖。<br>
 * 未来升级：引入 {@code spring-boot-starter-data-redis} + {@code RedisCacheManager} 后，
 * {@code @Cacheable} / {@code @CacheEvict} 业务代码无需改动，缓存自动迁移至 Redis。
 * </p>
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_HOME_FEED = "home_feed";
    public static final String CACHE_SIMILAR_NOTES = "similar_notes";
    public static final String CACHE_PROJECT_FEED = "project_feed";
    public static final String CACHE_NOTE_FEED = "note_feed";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                CACHE_HOME_FEED,
                CACHE_SIMILAR_NOTES,
                CACHE_PROJECT_FEED,
                CACHE_NOTE_FEED
        );
    }
}
