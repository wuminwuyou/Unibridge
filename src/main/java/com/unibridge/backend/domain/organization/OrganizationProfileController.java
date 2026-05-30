package com.unibridge.backend.domain.organization;

import com.unibridge.backend.domain.organization.dto.CreateLabRequest;
import com.unibridge.backend.domain.organization.dto.CreateLabResponse;
import com.unibridge.backend.domain.organization.dto.UpdateLabRequest;
import com.unibridge.backend.domain.organization.dto.AddMemberRequest;
import com.unibridge.backend.domain.organization.dto.AddMemberResponse;
import com.unibridge.backend.domain.organization.dto.UserSearchResponse;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.unibridge.backend.infrastructure.config.OpenApiConfig.BEARER_AUTH;

@Tag(name = "Client - 机构空间", description = "OrganizationView 页壳、实验室管理、人员管理（读接口游客可访问，写接口需机构管理员）")
@RestController
@RequestMapping("/api/v1/client/entity-profile")
public class OrganizationProfileController {

    @Autowired
    private OrganizationProfileService organizationProfileService;

    // ===================== 读取接口（已有，保留不变） =====================

    @Operation(summary = "机构管理员顶栏菜单", description = "organization-admin 角色；含 TOTP 绑定进度")
    @GetMapping("/menu")
    public Result getEntityProfileMenu(
            @Parameter(description = "主体代码", required = true, example = "10598")
            @RequestParam("entityCode") String entityCode) {
        return Result.success(organizationProfileService.getEntityProfileMenu(entityCode));
    }

    @Operation(summary = "机构空间页壳", description = "Hero + 侧栏 + 实验室/人员预览")
    @GetMapping("/space")
    public Result getEntityProfileSpace(
            @Parameter(description = "主体代码（高校 5 位 / 企业统一社会信用代码）", required = true, example = "10598")
            @RequestParam("entityCode") String entityCode) {
        return Result.success(organizationProfileService.getEntityProfileSpace(entityCode));
    }

    @Operation(summary = "机构空间主页 Tab", description = "实验室/项目/笔记预览")
    @GetMapping("/home")
    public Result getEntityProfileHome(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "teamLimit", required = false) Integer teamLimit,
            @RequestParam(value = "projectLimit", required = false) Integer projectLimit,
            @RequestParam(value = "noteLimit", required = false) Integer noteLimit) {
        return Result.success(organizationProfileService.getEntityProfileHome(entityCode, teamLimit, projectLimit, noteLimit));
    }

    @Operation(summary = "机构实验室 Tab", description = "仅 5 位高校代码返回数据；企业主体返回空列表")
    @GetMapping("/teams")
    public Result getEntityProfileTeams(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(organizationProfileService.getEntityProfileTeams(entityCode, page, pageSize));
    }

    @Operation(summary = "机构人员 Tab", description = "user_auth_link 中 PM/MENTOR 且已审核通过")
    @GetMapping("/members")
    public Result getEntityProfileMembers(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(organizationProfileService.getEntityProfileMembers(entityCode, page, pageSize));
    }

    @Operation(summary = "机构项目 Tab", description = "extended_uid = entityCode 的已发布项目")
    @GetMapping("/projects")
    public Result getEntityProfileProjects(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(organizationProfileService.getEntityProfileProjects(entityCode, page, pageSize));
    }

    @Operation(summary = "机构笔记 Tab", description = "extended_uid = entityCode 的已发布笔记")
    @GetMapping("/notes")
    public Result getEntityProfileNotes(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @Parameter(description = "预筛：图文 / 视频")
            @RequestParam(value = "contentType", required = false) String contentType) {
        return Result.success(organizationProfileService.getEntityProfileNotes(entityCode, page, pageSize, contentType));
    }

    // ===================== 写入接口（新增） =====================

    @Operation(summary = "创建实验室", description = "仅高校机构管理员可操作",
            security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/team")
    public Result createLab(@RequestBody CreateLabRequest request) {
        CreateLabResponse response = organizationProfileService.createLab(request);
        return Result.success(response);
    }

    @Operation(summary = "更新实验室", description = "修改名称/负责人",
            security = @SecurityRequirement(name = BEARER_AUTH))
    @PutMapping("/team")
    public Result updateLab(
            @Parameter(description = "实验室 teamUid", required = true)
            @RequestParam("teamUid") String teamUid,
            @RequestBody UpdateLabRequest request) {
        organizationProfileService.updateLab(teamUid, request);
        return Result.success(null);
    }

    @Operation(summary = "删除实验室", description = "级联删除实验室及其成员记录",
            security = @SecurityRequirement(name = BEARER_AUTH))
    @DeleteMapping("/team")
    public Result deleteLab(
            @Parameter(description = "实验室 teamUid", required = true)
            @RequestParam("teamUid") String teamUid) {
        organizationProfileService.deleteLab(teamUid);
        return Result.success(null);
    }

    @Operation(summary = "添加机构人员", description = "根据已有 user_auth_link 自动判定角色",
            security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/member")
    public Result addMember(@RequestBody AddMemberRequest request) {
        AddMemberResponse response = organizationProfileService.addMember(request);
        return Result.success(response);
    }

    @Operation(summary = "移除机构人员", description = "软删除（设 isActive=0）",
            security = @SecurityRequirement(name = BEARER_AUTH))
    @DeleteMapping("/member")
    public Result removeMember(
            @Parameter(description = "机构主体代码", required = true)
            @RequestParam("entityCode") String entityCode,
            @Parameter(description = "用户 uid", required = true)
            @RequestParam("uid") String uid) {
        organizationProfileService.removeMember(entityCode, uid);
        return Result.success(null);
    }
}
