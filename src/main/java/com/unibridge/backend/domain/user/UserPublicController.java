package com.unibridge.backend.domain.user;

import com.unibridge.backend.domain.organization.OrganizationProfileService;
import com.unibridge.backend.domain.team.TeamProfileService;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.unibridge.backend.infrastructure.config.OpenApiConfig.BEARER_AUTH;

@Tag(name = "Client - 用户", description = "用户公开信息预览")
@RestController
@RequestMapping("/api/v1/client/users")
public class UserPublicController {

    @Autowired
    private TeamProfileService teamUserProfileService;

    @Autowired
    private OrganizationProfileService organizationProfileService;

    @Operation(summary = "用户公开预览", description = "管理成员表单添加前校验 UID 并回填昵称/头像")
    @GetMapping("/{uid}/public-preview")
    public Result getUserPublicPreview(
            @Parameter(description = "用户 UID（US+11）")
            @PathVariable("uid") String uid) {
        return Result.success(teamUserProfileService.getUserPublicPreview(uid));
    }

    @Operation(summary = "用户模糊搜索", description = "搜索 uid / nickname / realName，限定为本机构已审核用户，用于实验室负责人/人员添加下拉",
            security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/search")
    public Result searchUsers(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "搜索关键词", required = true)
            @RequestParam("keyword") String keyword) {
        return Result.success(organizationProfileService.searchUsers(authorization, keyword));
    }
}
