package com.unibridge.backend.domain.project;

import com.unibridge.backend.domain.project.dto.PublishProjectRequest;
import com.unibridge.backend.domain.project.ProjectService;
import com.unibridge.backend.infrastructure.common.Result;
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
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public Result createProject(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @RequestBody PublishProjectRequest request) {
        return Result.success(projectService.createProject(authorization, request));
    }

    @PutMapping("/{uid}")
    public Result updateProject(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @PathVariable String uid,
                                @RequestBody PublishProjectRequest request) {
        return Result.success(projectService.updateProject(authorization, uid, request));
    }

    @GetMapping("/{uid}")
    public Result getProjectDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                   @PathVariable String uid) {
        return Result.success(projectService.getProjectDetail(authorization, uid));
    }

    @GetMapping("/{uid}/draft")
    public Result getProjectDraft(@RequestHeader(value = "Authorization", required = false) String authorization,
                                  @PathVariable String uid) {
        return Result.success(projectService.getProjectDraft(authorization, uid));
    }
}
