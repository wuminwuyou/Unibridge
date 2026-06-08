package com.unibridge.backend.domain.verification;

import com.unibridge.backend.domain.verification.dto.*;
import com.unibridge.backend.infrastructure.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import static com.unibridge.backend.infrastructure.config.OpenApiConfig.BEARER_AUTH;

@Tag(name = "Client - 双阶段认证", description = "人脸核身（阶段一）+ 机构认证（阶段二）")
@RestController
@RequestMapping("/api/v1/client/verification")
public class VerificationController {

    @Autowired
    private VerificationService verificationService;

    // ===================== 阶段一：人脸核身 =====================

    @Operation(summary = "初始化人脸核身", security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/face/init")
    public Result initFace(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody FaceInitRequest request) {
        return Result.success(verificationService.initFace(authorization, request));
    }

    @Operation(summary = "查询人脸核身结果", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/face/result")
    public Result getFaceResult(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "核身令牌") @RequestParam("token") String token) {
        return Result.success(verificationService.getFaceResult(authorization, token));
    }

    // ===================== 阶段二：机构认证 =====================

    @Operation(summary = "检索机构", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/entities/search")
    public Result searchEntities(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "关键词") @RequestParam("keyword") String keyword) {
        return Result.success(verificationService.searchEntities(authorization, keyword));
    }

    @Operation(summary = "教职工认证申请", security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/staff-apply")
    public Result applyStaff(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody StaffApplyRequest request) {
        return Result.success(verificationService.applyStaff(authorization, request));
    }

    @Operation(summary = "学生认证激活", security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/codes/activate")
    public Result activateStudent(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody StudentActivateRequest request) {
        return Result.success(verificationService.activateStudent(authorization, request));
    }

    @Operation(summary = "生成认证母码", description = "机构管理员生成机构级认证母码。全校学生共用，额度默认1000",
            security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/codes/generate")
    public Result generateMasterCode(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody VerificationCodeGenerateRequest request) {
        return Result.success(verificationService.generateMasterCode(authorization, request));
    }

    @Operation(summary = "生成认证子码", description = "辅导员在母码下创建子码。限额默认60，消耗母码额度",
            security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/codes/sub-code")
    public Result generateSubCode(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody VerificationCodeGenerateRequest request) {
        return Result.success(verificationService.generateSubCode(authorization, request));
    }
}
