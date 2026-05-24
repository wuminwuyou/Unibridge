package com.example.demo.client.controller;

import com.example.demo.client.dto.PublishProjectRequest;
import com.example.demo.client.service.ClientProjectService;
import com.example.demo.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/client/projects")
public class ClientProjectController {

    private final ClientProjectService clientProjectService;

    public ClientProjectController(ClientProjectService clientProjectService) {
        this.clientProjectService = clientProjectService;
    }

    @PostMapping
    public Result createProject(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @RequestBody PublishProjectRequest request) {
        return Result.success(clientProjectService.createProject(authorization, request));
    }

    @PutMapping("/{projectId}")
    public Result updateProject(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @PathVariable Long projectId,
                                @RequestBody PublishProjectRequest request) {
        return Result.success(clientProjectService.updateProject(authorization, projectId, request));
    }

    @GetMapping("/{projectId}")
    public Result getProjectDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                   @PathVariable Long projectId) {
        return Result.success(clientProjectService.getProjectDetail(authorization, projectId));
    }

    @GetMapping("/{projectId}/draft")
    public Result getProjectDraft(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @PathVariable Long projectId) {
        return Result.success(clientProjectService.getProjectDraft(authorization, projectId));
    }
}
