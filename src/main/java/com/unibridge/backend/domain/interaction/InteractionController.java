package com.unibridge.backend.domain.interaction;

import com.unibridge.backend.domain.interaction.dto.ContentInteractionRequest;
import com.unibridge.backend.domain.interaction.dto.ContentViewSyncRequest;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.unibridge.backend.infrastructure.config.OpenApiConfig.BEARER_AUTH;

@Tag(name = "Client - 内容互动", description = "点赞、收藏与浏览量同步")
@RestController
@RequestMapping("/api/v1/client/interactions")
public class InteractionController {

    private final InteractionService interactionService;

    public InteractionController(InteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @Operation(summary = "同步点赞状态", security = @SecurityRequirement(name = BEARER_AUTH))
    @PutMapping("/like")
    public Result syncLike(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody ContentInteractionRequest request) {
        interactionService.syncLike(authorization, request);
        return Result.success(null);
    }

    @Operation(summary = "同步收藏状态", security = @SecurityRequirement(name = BEARER_AUTH))
    @PutMapping("/collect")
    public Result syncCollect(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody ContentInteractionRequest request) {
        interactionService.syncCollect(authorization, request);
        return Result.success(null);
    }

    @Operation(summary = "同步浏览量", description = "详情页曝光上报，游客也可调用")
    @PostMapping("/view")
    public Result syncView(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody ContentViewSyncRequest request,
            HttpServletRequest httpRequest) {
        interactionService.syncView(authorization, request, httpRequest);
        return Result.success(null);
    }
}
