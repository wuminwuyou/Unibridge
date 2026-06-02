package com.unibridge.backend.domain.team;

import com.unibridge.backend.domain.team.dto.CreateStudentTeamRequest;
import com.unibridge.backend.domain.team.dto.SyncTeamMembersRequest;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.unibridge.backend.infrastructure.config.OpenApiConfig.BEARER_AUTH;

@Tag(name = "Client - 团队管理", description = "团队创建、成员同步、团队解散")
@RestController
public class TeamController {

    @Autowired
    private TeamManagementService teamManagementService;

    @PostMapping("/api/v1/client/team/create")
    @Operation(summary = "创建团队", security = @SecurityRequirement(name = BEARER_AUTH))
    public Result createStudentTeam(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody CreateStudentTeamRequest request) {
        return Result.success(teamManagementService.createStudentTeam(authorization, request));
    }

    @PutMapping("/api/v1/client/team-profile/members")
    @Operation(summary = "批量同步团队成员", description = "需 team admin",
            security = @SecurityRequirement(name = BEARER_AUTH))
    public Result syncTeamMembers(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("teamUid") String teamUid,
            @RequestBody SyncTeamMembersRequest request) {
        return Result.success(teamManagementService.syncTeamMembers(authorization, teamUid, request));
    }

    @DeleteMapping("/api/v1/client/team-profile/team")
    @Operation(summary = "解散团队", description = "级联删除团队及成员记录",
            security = @SecurityRequirement(name = BEARER_AUTH))
    public Result dissolveTeam(
            @Parameter(description = "团队 teamUid", required = true)
            @RequestParam("teamUid") String teamUid) {
        teamManagementService.dissolveTeam(teamUid);
        return Result.success(null);
    }
}
