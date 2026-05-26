package com.unibridge.backend.domain.feed;

import com.unibridge.backend.domain.feed.dto.FeedBehaviorEventRequest;
import com.unibridge.backend.domain.auth.AccessService;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Client - Feed 推荐", description = "首页/项目/笔记推送、换一换与用户行为埋点")
@RestController
@RequestMapping("/api/v1/client/feed")
public class FeedController {

    private final FeedRecommendationService feedRecommendationService;
    private final FeedBehaviorService feedBehaviorService;
    private final AccessService accessService;

    public FeedController(FeedRecommendationService feedRecommendationService,
                          FeedBehaviorService feedBehaviorService,
                          AccessService accessService) {
        this.feedRecommendationService = feedRecommendationService;
        this.feedBehaviorService = feedBehaviorService;
        this.accessService = accessService;
    }

    @Operation(summary = "首页个性化推送", description = "未登录走冷启动；登录后按 user_tag_interests 加权（Spring Cache: home_feed）")
    @GetMapping("/home")
    public Result getHomeFeed(
            @Parameter(description = "Bearer JWT，可选")
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        String userUid = accessService.resolveOptionalCurrentUserUid(authorization);
        return Result.success(feedRecommendationService.getHomeFeed(userUid));
    }

    @Operation(summary = "首页换一换", description = "机制 A：递增 page；机制 B：传 seed 固定 page=1")
    @GetMapping("/home/shuffle")
    public Result getHomeFeedShuffle(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "15") int size,
            @Parameter(description = "换一换随机种子，传则启用机制 B")
            @RequestParam(value = "seed", required = false) Long seed) {
        String userUid = accessService.resolveOptionalCurrentUserUid(authorization);
        return Result.success(feedRecommendationService.getHomeFeedShuffleResponse(userUid, seed, page, size));
    }

    @Operation(summary = "项目专区推送", description = "category=COMMERCIAL|RECRUITMENT，商业/非商业严格分栏")
    @GetMapping("/projects")
    public Result getProjectFeed(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "COMMERCIAL | RECRUITMENT", required = true)
            @RequestParam("category") String category,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        String userUid = accessService.resolveOptionalCurrentUserUid(authorization);
        return Result.success(feedRecommendationService.getProjectFeed(userUid, category, limit));
    }

    @Operation(summary = "项目专区换一换")
    @GetMapping("/projects/shuffle")
    public Result getProjectFeedShuffle(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("category") String category,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "seed", required = false) Long seed) {
        String userUid = accessService.resolveOptionalCurrentUserUid(authorization);
        return Result.success(feedRecommendationService.getProjectFeedShuffleResponse(userUid, category, seed, page, size));
    }

    @Operation(summary = "笔记专区推送", description = "noteType=IMAGE_TEXT|VIDEO，图文/视频严格分栏")
    @GetMapping("/notes")
    public Result getNoteFeed(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "IMAGE_TEXT | VIDEO", required = true)
            @RequestParam("noteType") String noteType,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        String userUid = accessService.resolveOptionalCurrentUserUid(authorization);
        return Result.success(feedRecommendationService.getNoteFeed(userUid, noteType, limit));
    }

    @Operation(summary = "笔记专区换一换")
    @GetMapping("/notes/shuffle")
    public Result getNoteFeedShuffle(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("noteType") String noteType,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "seed", required = false) Long seed) {
        String userUid = accessService.resolveOptionalCurrentUserUid(authorization);
        return Result.success(feedRecommendationService.getNoteFeedShuffleResponse(userUid, noteType, seed, page, size));
    }

    @Operation(summary = "相似笔记推荐", description = "Spring Cache: similar_notes")
    @GetMapping("/notes/{noteUid}/similar")
    public Result getSimilarNotes(
            @Parameter(description = "笔记 UID（TX/VD+11）")
            @PathVariable String noteUid,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        return Result.success(feedRecommendationService.getSimilarNotes(noteUid, limit));
    }

    @Operation(summary = "用户行为埋点", description = "详情点击/点赞/收藏 → 累加标签权重")
    @PostMapping("/events")
    public Result trackBehavior(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody FeedBehaviorEventRequest request) {
        feedBehaviorService.trackEvent(authorization, request);
        return Result.success(null);
    }
}
