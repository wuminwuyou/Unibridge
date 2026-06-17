package com.unibridge.backend.domain.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.unibridge.backend.domain.admin.dto.EntityCreateRequest;
import com.unibridge.backend.domain.admin.dto.UserRegisterRequest;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.common.Result;
import com.unibridge.backend.infrastructure.entities.auth.User;
import com.unibridge.backend.infrastructure.entities.auth.TenantOrganization;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.UserMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.auth.TenantOrganizationMapper;
import com.unibridge.backend.infrastructure.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.unibridge.backend.infrastructure.config.OpenApiConfig.BEARER_AUTH;

@Tag(name = "Admin - 主体与用户", description = "管理后台主体/用户 CRUD（需 Admin JWT）")
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private TenantOrganizationMapper tenantOrganizationMapper;

    private String validateToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw BusinessException.unauthorized("未授权");
        }
        String token = authorization.replace("Bearer ", "");
        if (!jwtUtil.validateToken(token)) {
            throw BusinessException.unauthorized("token错误");
        }
        return token;
    }

    private Integer getAuthLevel(String token) {
        return jwtUtil.getAuthLevel(token);
    }

    private void checkAuth(String token, Integer requiredLevel) {
        Integer authLevel = getAuthLevel(token);
        if (authLevel == null || authLevel < requiredLevel) {
            throw BusinessException.forbidden("权限不足");
        }
    }

    @Operation(summary = "主体列表", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/entities/list")
    public Result getEntitiesList(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Parameter(description = "UNIVERSITY | ENTERPRISE")
            @RequestParam(required = false) String type,
            @Parameter(description = "PENDING | APPROVED | REJECTED")
            @RequestParam(required = false) String auditStatus,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        String token = validateToken(authorization);
        checkAuth(token, 1);

        Page<TenantOrganization> pageParam = new Page<>(page, pageSize);
        LambdaQueryWrapper<TenantOrganization> wrapper = new LambdaQueryWrapper<>();

        if (type != null && !type.isEmpty()) {
            wrapper.eq(TenantOrganization::getType, type);
        }
        if (auditStatus != null && !auditStatus.isEmpty()) {
            wrapper.eq(TenantOrganization::getAuditStatus, auditStatus);
        }
        if (q != null && !q.isEmpty()) {
            wrapper.like(TenantOrganization::getName, q);
        }

        IPage<TenantOrganization> result = tenantOrganizationMapper.selectPage(pageParam, wrapper);
        return Result.success(result);
    }

    @Operation(summary = "主体详情", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/entities/{id}")
    public Result getEntityDetail(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        String token = validateToken(authorization);
        checkAuth(token, 1);

        TenantOrganization entity = tenantOrganizationMapper.selectById(id);
        if (entity == null) {
            throw BusinessException.notFound("主体不存在");
        }
        return Result.success(entity);
    }

    @Operation(summary = "创建主体", description = "需 authLevel ≥ 2", security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/entities")
    public Result createEntity(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody EntityCreateRequest request) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        TenantOrganization entity = new TenantOrganization();
        entity.setName(request.getName());
        entity.setType(request.getType());
        entity.setIntro(request.getIntro());
        entity.setAuditStatus("APPROVED");
        entity.setAuditAdminId(jwtUtil.getUserId(token));

        tenantOrganizationMapper.insert(entity);
        return Result.success("创建成功", entity);
    }

    @Operation(summary = "更新主体", security = @SecurityRequirement(name = BEARER_AUTH))
    @PutMapping("/entities/{id}")
    public Result updateEntity(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody EntityCreateRequest request) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        TenantOrganization entity = tenantOrganizationMapper.selectById(id);
        if (entity == null) {
            throw BusinessException.notFound("主体不存在");
        }

        entity.setName(request.getName());
        entity.setType(request.getType());
        entity.setIntro(request.getIntro());
        tenantOrganizationMapper.updateById(entity);
        return Result.success("更新成功", entity);
    }

    @Operation(summary = "删除主体", security = @SecurityRequirement(name = BEARER_AUTH))
    @DeleteMapping("/entities/{id}")
    public Result deleteEntity(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        TenantOrganization TenantOrganization = tenantOrganizationMapper.selectById(id);
        if (TenantOrganization == null) {
            throw BusinessException.notFound("主体不存在");
        }

        tenantOrganizationMapper.deleteById(id);
        return Result.success("删除成功", null);
    }

    @Operation(summary = "用户列表", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/users/list")
    public Result getUsersList(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String order) {
        String token = validateToken(authorization);
        checkAuth(token, 1);

        Page<User> pageParam = new Page<>(page, pageSize);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();

        if (q != null && !q.isEmpty()) {
            wrapper.like(User::getPhone, q);
        }

        if (sort != null && !sort.isEmpty()) {
            if ("last_login_at".equals(sort)) {
                wrapper.orderBy(true, "desc".equals(order), User::getLastLoginAt);
            } else {
                wrapper.orderBy(true, "desc".equals(order), User::getId);
            }
        } else {
            wrapper.orderBy(true, false, User::getId);
        }

        IPage<User> result = userMapper.selectPage(pageParam, wrapper);
        return Result.success(result);
    }

    @Operation(summary = "用户详情", security = @SecurityRequirement(name = BEARER_AUTH))
    @GetMapping("/users/{id}")
    public Result getUserDetail(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        String token = validateToken(authorization);
        checkAuth(token, 1);

        User user = userMapper.selectById(id);
        if (user == null) {
            throw BusinessException.notFound("用户不存在");
        }
        return Result.success(user);
    }

    @Operation(summary = "创建用户", security = @SecurityRequirement(name = BEARER_AUTH))
    @PostMapping("/users")
    public Result createUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody UserRegisterRequest request) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getPhone, request.getPhone());
        User existingUser = userMapper.selectOne(wrapper);

        if (existingUser != null) {
            throw BusinessException.badRequest("手机号已注册");
        }

        User User = new User();
        User.setPhone(request.getPhone());
        User.setPasswordHash(request.getPasswordHash());

        userMapper.insert(User);
        return Result.success("创建成功", User);
    }

    @Operation(summary = "更新用户", security = @SecurityRequirement(name = BEARER_AUTH))
    @PutMapping("/users/{id}")
    public Result updateUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody UserRegisterRequest request) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        User User = userMapper.selectById(id);
        if (User == null) {
            throw BusinessException.notFound("用户不存在");
        }

        if (request.getPasswordHash() != null) {
            User.setPasswordHash(request.getPasswordHash());
        }

        userMapper.updateById(User);
        return Result.success("更新成功", User);
    }

    @Operation(summary = "删除用户", security = @SecurityRequirement(name = BEARER_AUTH))
    @DeleteMapping("/users/{id}")
    public Result deleteUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        User User = userMapper.selectById(id);
        if (User == null) {
            throw BusinessException.notFound("用户不存在");
        }

        userMapper.deleteById(id);
        return Result.success("删除成功", null);
    }
}
