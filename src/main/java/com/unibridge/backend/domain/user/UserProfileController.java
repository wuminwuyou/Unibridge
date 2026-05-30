package com.unibridge.backend.domain.user;

import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Client - 个人空间", description = "用户 Profile 页壳、主页预览与各 Tab 分页列表")
@RestController
@RequestMapping("/api/v1/client/user-profile")
public class UserProfileController {

    @Autowired
    private UserProfileService UserProfileService;

    @Operation(summary = "Profile 顶部菜单", description = "UserProfileMenu 初始化数据，需登录")
    @GetMapping("/menu")
    public Result getProfileMenu(
            @Parameter(description = "Bearer JWT access_token")
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return Result.success(UserProfileService.getProfileMenu(authorization));
    }

    @Operation(summary = "个人空间页壳", description = "Hero + Sidebar + 关联团队，一次性返回")
    @GetMapping("/space")
    public Result getProfileSpace(
            @Parameter(description = "Bearer JWT，可选；用于判断是否 viewingOwnSpace")
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "目标用户 UID（US+11），为空时查看 token 当前用户")
            @RequestParam(value = "uid", required = false) String uid,
            @Parameter(description = "兼容旧参数 userUid")
            @RequestParam(value = "userUid", required = false) String userUid,
            @Parameter(description = "兼容旧参数 userId（数值 id，已废弃）")
            @RequestParam(value = "userId", required = false) Long userId,
            HttpServletRequest request) {
        return Result.success(UserProfileService.getProfileSpace(authorization, uid, userUid, userId, request));
    }

    @Operation(summary = "个人空间主页 Tab", description = "项目 + 笔记预览列表")
    @GetMapping("/home")
    public Result getProfileHome(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "uid", required = false) String uid,
            @RequestParam(value = "userUid", required = false) String userUid,
            @RequestParam(value = "userId", required = false) Long userId,
            @Parameter(description = "项目预览条数，默认 4")
            @RequestParam(value = "projectLimit", required = false) Integer projectLimit,
            @Parameter(description = "笔记预览条数，默认 3")
            @RequestParam(value = "noteLimit", required = false) Integer noteLimit) {
        return Result.success(UserProfileService.getProfileHome(authorization, uid, userUid, userId, projectLimit, noteLimit));
    }

    @Operation(summary = "个人空间项目 Tab", description = "分页项目列表")
    @GetMapping("/projects")
    public Result getProfileProjects(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "uid", required = false) String uid,
            @RequestParam(value = "userUid", required = false) String userUid,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(UserProfileService.getProfileProjects(authorization, uid, userUid, userId, page, pageSize));
    }

    @Operation(summary = "个人空间笔记 Tab", description = "分页笔记列表，支持 contentType=图文/视频 预筛")
    @GetMapping("/notes")
    public Result getProfileNotes(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "uid", required = false) String uid,
            @RequestParam(value = "userUid", required = false) String userUid,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @Parameter(description = "预筛：图文 / 视频")
            @RequestParam(value = "contentType", required = false) String contentType) {
        return Result.success(UserProfileService.getProfileNotes(authorization, uid, userUid, userId, page, pageSize, contentType));
    }
}
