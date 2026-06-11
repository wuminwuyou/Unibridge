package com.unibridge.backend.domain.user;

import com.unibridge.backend.domain.team.TeamManagementService;
import com.unibridge.backend.domain.organization.OrganizationProfileService;
import com.unibridge.backend.infrastructure.common.Result;
import com.unibridge.backend.infrastructure.common.BusinessException;
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

@Tag(name = "Client - 用户", description = "用户公开信息预览、实名认证预览、模糊搜索")
@RestController
@RequestMapping("/api/v1/client/users")
public class UserPublicController {

    @Autowired
    private TeamManagementService teamManagementService;

    @Autowired
    private OrganizationProfileService organizationProfileService;

    @Autowired
    private UserProfileService userProfileService;

    @Operation(summary = "用户公开预览", description = "管理成员表单添加前校验 UID 并回填昵称/头像")
    @GetMapping("/{uid}/public-preview")
    public Result getUserPublicPreview(
            @Parameter(description = "用户 UID（US+11）")
            @PathVariable("uid") String uid) {
        return Result.success(teamManagementService.getUserPublicPreview(uid));
    }

    @Operation(summary = "用户实名认证预览", description = "校验用户是否已实名认证，返回基本资料和认证状态。未实名返回 403")
    @GetMapping("/{uid}/verified-preview")
    public Result getUserVerifiedPreview(
            @Parameter(description = "用户 UID（US+11）")
            @PathVariable("uid") String uid) {
        try {
            return Result.success(userProfileService.getUserVerifiedPreview(uid));
        } catch (BusinessException e) {
            throw e;
        }
    }

    @Operation(summary = "用户模糊搜索", description = "搜索 uid / nickname / entity_name，限定为本机构已审核用户，用于实验室负责人/人员添加下拉",
            security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/search")
    public Result searchUsers(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "搜索关键词", required = true)
            @RequestParam("keyword") String keyword) {
        return Result.success(organizationProfileService.searchUsers(authorization, keyword));
    }
}
