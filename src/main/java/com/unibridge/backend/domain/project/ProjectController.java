package com.unibridge.backend.domain.project;

import com.unibridge.backend.domain.project.dto.ProjectEvaluateRequest;
import com.unibridge.backend.domain.project.dto.PublishProjectRequest;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.unibridge.backend.infrastructure.config.OpenApiConfig.BEARER_AUTH;

@Tag(name = "Client - 项目", description = "项目发布、编辑与详情/草稿读取")
@RestController
@RequestMapping("/api/v1/client/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectEvaluateService projectEvaluateService;

    public ProjectController(ProjectService projectService,
                             ProjectEvaluateService projectEvaluateService) {
        this.projectService = projectService;
        this.projectEvaluateService = projectEvaluateService;
    }

    @Operation(summary = "创建项目", security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping
    public Result createProject(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody PublishProjectRequest request) {
        return Result.success(projectService.createProject(authorization, request));
    }

    @Operation(summary = "更新项目", security = @SecurityRequirement(name = BEARER_AUTH))
    @PutMapping("/{uid}")
    public Result updateProject(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "项目 UID（PR+11）")
            @PathVariable String uid,
            @RequestBody PublishProjectRequest request) {
        return Result.success(projectService.updateProject(authorization, uid, request));
    }

    @Operation(summary = "项目详情", description = "已发布项目详情，需要登录", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/{uid}")
    public Result getProjectDetail(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String uid) {
        return Result.success(projectService.getProjectDetail(authorization, uid));
    }

    @Operation(summary = "项目草稿", description = "仅 owner 可读", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/{uid}/draft")
    public Result getProjectDraft(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String uid) {
        return Result.success(projectService.getProjectDraft(authorization, uid));
    }

    @Operation(summary = "获取项目难度评估公钥", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/evaluate/public-key")
    public Result getPublicKey() {
        return Result.success(projectEvaluateService.generatePublicKey());
    }

    @Operation(summary = "提交项目难度评估", security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/evaluate")
    public Result evaluate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody ProjectEvaluateRequest request) {
        return Result.success(projectEvaluateService.evaluate(request));
    }
}
