package com.unibridge.backend.domain.interaction;

import com.unibridge.backend.domain.interaction.dto.ContentInteractionRequest;
import com.unibridge.backend.domain.interaction.dto.ContentViewSyncRequest;
import com.unibridge.backend.domain.interaction.InteractionService;
import com.unibridge.backend.infrastructure.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/client/interactions")
public class InteractionController {

    private final InteractionService interactionService;

    public InteractionController(InteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @PutMapping("/like")
    public Result syncLike(@RequestHeader(value = "Authorization", required = false) String authorization,
                           @RequestBody ContentInteractionRequest request) {
        interactionService.syncLike(authorization, request);
        return Result.success(null);
    }

    @PutMapping("/collect")
    public Result syncCollect(@RequestHeader(value = "Authorization", required = false) String authorization,
                              @RequestBody ContentInteractionRequest request) {
        interactionService.syncCollect(authorization, request);
        return Result.success(null);
    }

    @PostMapping("/view")
    public Result syncView(@RequestHeader(value = "Authorization", required = false) String authorization,
                           @RequestBody ContentViewSyncRequest request,
                           HttpServletRequest httpRequest) {
        interactionService.syncView(authorization, request, httpRequest);
        return Result.success(null);
    }
}
