package com.example.demo.client.service;

import com.example.demo.client.dto.ContentVO;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Feed「换一换」机制 A 的缓存代理层。
 * <p>
 * 独立 Bean 保证 {@code @Cacheable} 经 Spring AOP 生效（避免同类自调用导致缓存失效）。
 * 机制 B（{@code seed} 模式）不经过本类，防止海量垃圾缓存。
 * </p>
 */
@Service
public class FeedShuffleCacheService {

    private final FeedRecommendationService feedRecommendationService;

    public FeedShuffleCacheService(FeedRecommendationService feedRecommendationService) {
        this.feedRecommendationService = feedRecommendationService;
    }

    /**
     * 机制 A：首页混排分页缓存。
     * <p>缓存键 {@code userId_page}，前端递增 {@code page} 即可滚动换量。</p>
     */
    @Cacheable(value = "home_feed", key = "#userId + '_' + #page")
    public List<ContentVO> getHomeFeedCachedPage(long userId, int page, int size) {
        return feedRecommendationService.buildHomeFeedCachedPage(userId, page, size);
    }

    /**
     * 机制 A：项目专区分页缓存。
     */
    @Cacheable(value = "project_feed", key = "#userId + '_' + #category + '_' + #page")
    public List<ContentVO> getProjectFeedCachedPage(long userId, String category, int page, int size) {
        return feedRecommendationService.buildProjectFeedCachedPage(userId, category, page, size);
    }

    /**
     * 机制 A：笔记专区分页缓存。
     */
    @Cacheable(value = "note_feed", key = "#userId + '_' + #noteType + '_' + #page")
    public List<ContentVO> getNoteFeedCachedPage(long userId, String noteType, int page, int size) {
        return feedRecommendationService.buildNoteFeedCachedPage(userId, noteType, page, size);
    }
}
