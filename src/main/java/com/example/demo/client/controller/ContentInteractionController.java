package com.example.demo.client.controller;

import com.example.demo.client.dto.ContentInteractionRequest;
import com.example.demo.client.dto.ContentViewSyncRequest;
import com.example.demo.client.service.ContentInteractionService;
import com.example.demo.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/client/interactions")
public class ContentInteractionController {

    private final ContentInteractionService contentInteractionService;

    public ContentInteractionController(ContentInteractionService contentInteractionService) {
        this.contentInteractionService = contentInteractionService;
    }

    @PutMapping("/like")
    public Result syncLike(@RequestHeader(value = "Authorization", required = false) String authorization,
                           @RequestBody ContentInteractionRequest request) {
        contentInteractionService.syncLike(authorization, request);
        return Result.success(null);
    }

    @PutMapping("/collect")
    public Result syncCollect(@RequestHeader(value = "Authorization", required = false) String authorization,
                              @RequestBody ContentInteractionRequest request) {
        contentInteractionService.syncCollect(authorization, request);
        return Result.success(null);
    }

    @PostMapping("/view")
    public Result syncView(@RequestHeader(value = "Authorization", required = false) String authorization,
                           @RequestBody ContentViewSyncRequest request,
                           HttpServletRequest httpRequest) {
        contentInteractionService.syncView(authorization, request, httpRequest);
        return Result.success(null);
    }
}
