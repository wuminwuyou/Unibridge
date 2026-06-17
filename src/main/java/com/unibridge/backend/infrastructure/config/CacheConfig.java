package com.unibridge.backend.infrastructure.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Cache 配置。
 * <p>
 * CacheManager Bean 已由 {@link RedisConfig} 提供（{@code RedisCacheManager}），
 * 所有 {@code @Cacheable} / {@code @CacheEvict} 注解自动通过 Redis 读写缓存。
 * </p>
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_HOME_FEED = "home_feed";
    public static final String CACHE_SIMILAR_NOTES = "similar_notes";
    public static final String CACHE_PROJECT_FEED = "project_feed";
    public static final String CACHE_NOTE_FEED = "note_feed";
}
