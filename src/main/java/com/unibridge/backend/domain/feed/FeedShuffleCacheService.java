package com.unibridge.backend.domain.feed;

import com.unibridge.backend.domain.feed.dto.ContentVO;
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

    @Cacheable(value = "home_feed", key = "#userUid + '_' + #page")
    public List<ContentVO> getHomeFeedCachedPage(String userUid, int page, int size) {
        return feedRecommendationService.buildHomeFeedCachedPage(userUid, page, size);
    }

    @Cacheable(value = "project_feed", key = "#userUid + '_' + #category + '_' + #page")
    public List<ContentVO> getProjectFeedCachedPage(String userUid, String category, int page, int size) {
        return feedRecommendationService.buildProjectFeedCachedPage(userUid, category, page, size);
    }

    @Cacheable(value = "note_feed", key = "#userUid + '_' + #noteType + '_' + #page")
    public List<ContentVO> getNoteFeedCachedPage(String userUid, String noteType, int page, int size) {
        return feedRecommendationService.buildNoteFeedCachedPage(userUid, noteType, page, size);
    }
}
