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

@Tag(name = "Client - 团队空间", description = "TeamView 页壳、主页预览与各 Tab 分页列表（游客只读）")
@RestController
@RequestMapping("/api/v1/client/team-profile")
public class TeamSpaceController {

    @Autowired
    private TeamSpaceService teamSpaceService;

    @Operation(summary = "团队空间页壳", description = "Hero + 侧栏 + 成员预览")
    @GetMapping("/space")
    public Result getTeamProfileSpace(
            @Parameter(description = "团队 UID（LB/ST+11）", required = true, example = "LB00000000001")
            @RequestParam("teamUid") String teamUid) {
        return Result.success(teamSpaceService.getTeamProfileSpace(teamUid));
    }

    @Operation(summary = "团队空间主页 Tab", description = "项目/笔记/成果预览")
    @GetMapping("/home")
    public Result getTeamProfileHome(
            @RequestParam("teamUid") String teamUid,
            @Parameter(description = "项目预览条数，默认 3")
            @RequestParam(value = "projectLimit", required = false) Integer projectLimit,
            @Parameter(description = "笔记预览条数，默认 3")
            @RequestParam(value = "noteLimit", required = false) Integer noteLimit,
            @Parameter(description = "成果预览条数，默认 3")
            @RequestParam(value = "achievementLimit", required = false) Integer achievementLimit) {
        return Result.success(teamSpaceService.getTeamProfileHome(teamUid, projectLimit, noteLimit, achievementLimit));
    }

    @Operation(summary = "团队成员 Tab", description = "完整成员列表，卡片不可跳转")
    @GetMapping("/members")
    public Result getTeamProfileMembers(
            @RequestParam("teamUid") String teamUid,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(teamSpaceService.getTeamProfileMembers(teamUid, page, pageSize));
    }

    @Operation(summary = "团队项目 Tab", description = "project.team_uid = teamUid 的分页列表")
    @GetMapping("/projects")
    public Result getTeamProfileProjects(
            @RequestParam("teamUid") String teamUid,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(teamSpaceService.getTeamProfileProjects(teamUid, page, pageSize));
    }

    @Operation(summary = "团队笔记 Tab", description = "团队成员发布的笔记，三列网格分页")
    @GetMapping("/notes")
    public Result getTeamProfileNotes(
            @RequestParam("teamUid") String teamUid,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @Parameter(description = "预筛：图文 / 视频")
            @RequestParam(value = "contentType", required = false) String contentType) {
        return Result.success(teamSpaceService.getTeamProfileNotes(teamUid, page, pageSize, contentType));
    }

    @Operation(summary = "团队成果 Tab", description = "团队成员 achievement_archive 脱敏列表")
    @GetMapping("/achievements")
    public Result getTeamProfileAchievements(
            @RequestParam("teamUid") String teamUid,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize) {
        return Result.success(teamSpaceService.getTeamProfileAchievements(teamUid, page, pageSize));
    }
}
