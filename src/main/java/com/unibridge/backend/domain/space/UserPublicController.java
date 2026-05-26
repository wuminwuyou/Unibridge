package com.unibridge.backend.domain.space;

import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Client - 用户", description = "用户公开信息预览")
@RestController
@RequestMapping("/api/v1/client/users")
public class UserPublicController {

    @Autowired
    private TeamSpaceService teamSpaceService;

    @Operation(summary = "用户公开预览", description = "管理成员表单添加前校验 UID 并回填昵称/头像")
    @GetMapping("/{uid}/public-preview")
    public Result getUserPublicPreview(
            @Parameter(description = "用户 UID（US+11）")
            @PathVariable("uid") String uid) {
        return Result.success(teamSpaceService.getUserPublicPreview(uid));
    }
}
