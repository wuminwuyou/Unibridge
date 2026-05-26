package com.unibridge.backend.domain.space;

import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Client - 机构空间", description = "OrganizationView 页壳、主页预览与各 Tab 分页列表（游客只读）")
@RestController
@RequestMapping("/api/v1/client/entity-profile")
public class EntitySpaceController {

    @Autowired
    private EntitySpaceService entitySpaceService;

    @Operation(summary = "机构管理员顶栏菜单", description = "organization-admin 角色；含 TOTP 绑定进度")
    @GetMapping("/menu")
    public Result getEntityProfileMenu(
            @Parameter(description = "主体代码", required = true, example = "10598")
            @RequestParam("entityCode") String entityCode) {
        return Result.success(entitySpaceService.getEntityProfileMenu(entityCode));
    }

    @Operation(summary = "机构空间页壳", description = "Hero + 侧栏 + 实验室/人员预览")
    @GetMapping("/space")
    public Result getEntityProfileSpace(
            @Parameter(description = "主体代码（高校 5 位 / 企业统一社会信用代码）", required = true, example = "10598")
            @RequestParam("entityCode") String entityCode) {
        return Result.success(entitySpaceService.getEntityProfileSpace(entityCode));
    }

    @Operation(summary = "机构空间主页 Tab", description = "实验室/项目/笔记预览")
    @GetMapping("/home")
    public Result getEntityProfileHome(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "teamLimit", required = false) Integer teamLimit,
            @RequestParam(value = "projectLimit", required = false) Integer projectLimit,
            @RequestParam(value = "noteLimit", required = false) Integer noteLimit) {
        return Result.success(entitySpaceService.getEntityProfileHome(entityCode, teamLimit, projectLimit, noteLimit));
    }

    @Operation(summary = "机构实验室 Tab", description = "仅 5 位高校代码返回数据；企业主体返回空列表")
    @GetMapping("/teams")
    public Result getEntityProfileTeams(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(entitySpaceService.getEntityProfileTeams(entityCode, page, pageSize));
    }

    @Operation(summary = "机构人员 Tab", description = "user_auth_link 中 PM/MENTOR 且已审核通过")
    @GetMapping("/members")
    public Result getEntityProfileMembers(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(entitySpaceService.getEntityProfileMembers(entityCode, page, pageSize));
    }

    @Operation(summary = "机构项目 Tab", description = "extended_uid = entityCode 的已发布项目")
    @GetMapping("/projects")
    public Result getEntityProfileProjects(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(entitySpaceService.getEntityProfileProjects(entityCode, page, pageSize));
    }

    @Operation(summary = "机构笔记 Tab", description = "extended_uid = entityCode 的已发布笔记")
    @GetMapping("/notes")
    public Result getEntityProfileNotes(
            @RequestParam("entityCode") String entityCode,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @Parameter(description = "预筛：图文 / 视频")
            @RequestParam(value = "contentType", required = false) String contentType) {
        return Result.success(entitySpaceService.getEntityProfileNotes(entityCode, page, pageSize, contentType));
    }
}
