package com.example.demo.client.controller;

import com.example.demo.client.dto.FeedBehaviorEventRequest;
import com.example.demo.client.dto.FeedShuffleResponse;
import com.example.demo.client.service.ClientAccessService;
import com.example.demo.client.service.FeedBehaviorService;
import com.example.demo.client.service.FeedRecommendationService;
import com.example.demo.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/client/feed")
public class FeedRecommendationController {

    private final FeedRecommendationService feedRecommendationService;
    private final FeedBehaviorService feedBehaviorService;
    private final ClientAccessService clientAccessService;

    public FeedRecommendationController(FeedRecommendationService feedRecommendationService,
                                        FeedBehaviorService feedBehaviorService,
                                        ClientAccessService clientAccessService) {
        this.feedRecommendationService = feedRecommendationService;
        this.feedBehaviorService = feedBehaviorService;
        this.clientAccessService = clientAccessService;
    }

    /**
     * 首页个性化推送（Spring Cache：home_feed）。
     * 未登录时走冷启动；登录后按 user_tag_interests 加权。
     */
    @GetMapping("/home")
    public Result getHomeFeed(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Long userId = clientAccessService.resolveOptionalCurrentUserId(authorization);
        return Result.success(feedRecommendationService.getHomeFeed(userId));
    }

    /**
     * 首页「换一换」混排推送。
     * <ul>
     *   <li>机制 A：不传 {@code seed}，递增 {@code page}（默认 1）</li>
     *   <li>机制 B：传 {@code seed}（每次换一换生成新随机数），{@code page} 通常固定为 1</li>
     * </ul>
     */
    @GetMapping("/home/shuffle")
    public Result getHomeFeedShuffle(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @RequestParam(value = "page", defaultValue = "1") int page,
                                     @RequestParam(value = "size", defaultValue = "15") int size,
                                     @RequestParam(value = "seed", required = false) Integer seed) {
        Long userId = clientAccessService.resolveOptionalCurrentUserId(authorization);
        FeedShuffleResponse response = feedRecommendationService.getHomeFeedShuffleResponse(
                userId, seed, page, size);
        return Result.success(response);
    }

    /**
     * 项目专区推送：商业 / 非商业严格分栏，互不混入。
     */
    @GetMapping("/projects")
    public Result getProjectFeed(@RequestHeader(value = "Authorization", required = false) String authorization,
                                 @RequestParam("category") String category,
                                 @RequestParam(value = "limit", defaultValue = "10") int limit) {
        Long userId = clientAccessService.resolveOptionalCurrentUserId(authorization);
        return Result.success(feedRecommendationService.getProjectFeed(userId, category, limit));
    }

    /**
     * 项目专区「换一换」：{@code category} 分栏 + 机制 A/B。
     */
    @GetMapping("/projects/shuffle")
    public Result getProjectFeedShuffle(@RequestHeader(value = "Authorization", required = false) String authorization,
                                        @RequestParam("category") String category,
                                        @RequestParam(value = "page", defaultValue = "1") int page,
                                        @RequestParam(value = "size", defaultValue = "10") int size,
                                        @RequestParam(value = "seed", required = false) Integer seed) {
        Long userId = clientAccessService.resolveOptionalCurrentUserId(authorization);
        FeedShuffleResponse response = feedRecommendationService.getProjectFeedShuffleResponse(
                userId, category, seed, page, size);
        return Result.success(response);
    }

    /**
     * 笔记专区推送：图文 / 视频严格分栏，互不混入。
     */
    @GetMapping("/notes")
    public Result getNoteFeed(@RequestHeader(value = "Authorization", required = false) String authorization,
                              @RequestParam("noteType") String noteType,
                              @RequestParam(value = "limit", defaultValue = "10") int limit) {
        Long userId = clientAccessService.resolveOptionalCurrentUserId(authorization);
        return Result.success(feedRecommendationService.getNoteFeed(userId, noteType, limit));
    }

    /**
     * 笔记专区「换一换」：{@code noteType} 分栏 + 机制 A/B。
     */
    @GetMapping("/notes/shuffle")
    public Result getNoteFeedShuffle(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @RequestParam("noteType") String noteType,
                                     @RequestParam(value = "page", defaultValue = "1") int page,
                                     @RequestParam(value = "size", defaultValue = "10") int size,
                                     @RequestParam(value = "seed", required = false) Integer seed) {
        Long userId = clientAccessService.resolveOptionalCurrentUserId(authorization);
        FeedShuffleResponse response = feedRecommendationService.getNoteFeedShuffleResponse(
                userId, noteType, seed, page, size);
        return Result.success(response);
    }

    /**
     * 相似笔记推荐（Spring Cache：similar_notes）。
     */
    @GetMapping("/notes/{noteUid}/similar")
    public Result getSimilarNotes(@PathVariable String noteUid,
                                  @RequestParam(value = "limit", defaultValue = "10") int limit) {
        return Result.success(feedRecommendationService.getSimilarNotes(noteUid, limit));
    }

    /**
     * 用户行为埋点：详情点击 / 点赞 / 收藏 → 累加标签权重。
     */
    @PostMapping("/events")
    public Result trackBehavior(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @RequestBody FeedBehaviorEventRequest request) {
        feedBehaviorService.trackEvent(authorization, request);
        return Result.success(null);
    }
}
