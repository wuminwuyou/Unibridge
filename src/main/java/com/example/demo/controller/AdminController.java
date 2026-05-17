package com.example.demo.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.common.Result;
import com.example.demo.dto.*;
import com.example.demo.entity.Entity;
import com.example.demo.entity.UserProfile;
import com.example.demo.mapper.EntityMapper;
import com.example.demo.mapper.UserProfileMapper;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private EntityMapper entityMapper;

    private String validateToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new RuntimeException("未授权");
        }
        String token = authorization.replace("Bearer ", "");
        if (!jwtUtil.validateToken(token)) {
            throw new RuntimeException("token错误");
        }
        return token;
    }

    private Integer getAuthLevel(String token) {
        return jwtUtil.getAuthLevel(token);
    }

    private void checkAuth(String token, Integer requiredLevel) {
        Integer authLevel = getAuthLevel(token);
        if (authLevel == null || authLevel < requiredLevel) {
            throw new RuntimeException("权限不足");
        }
    }

    @GetMapping("/entities/list")
    public Result getEntitiesList(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @RequestParam(required = false) String type,
                                     @RequestParam(required = false) String auditStatus,
                                     @RequestParam(required = false) String q,
                                     @RequestParam(defaultValue = "1") Integer page,
                                     @RequestParam(defaultValue = "20") Integer pageSize) {
        String token = validateToken(authorization);
        checkAuth(token, 1);

        Page<Entity> pageParam = new Page<>(page, pageSize);
        LambdaQueryWrapper<Entity> wrapper = new LambdaQueryWrapper<>();

        if (type != null && !type.isEmpty()) {
            wrapper.eq(Entity::getType, type);
        }
        if (auditStatus != null && !auditStatus.isEmpty()) {
            wrapper.eq(Entity::getAuditStatus, auditStatus);
        }
        if (q != null && !q.isEmpty()) {
            wrapper.like(Entity::getName, q);
        }

        IPage<Entity> result = entityMapper.selectPage(pageParam, wrapper);
        return Result.success(result);
    }

    @GetMapping("/entities/{id}")
    public Result getEntityDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @PathVariable Long id) {
        String token = validateToken(authorization);
        checkAuth(token, 1);

        Entity entity = entityMapper.selectById(id);
        if (entity == null) {
            return Result.error(404, "主体不存在");
        }
        return Result.success(entity);
    }

    @PostMapping("/entities")
    public Result createEntity(@RequestHeader(value = "Authorization", required = false) String authorization,
                             @RequestBody EntityCreateRequest request) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        Entity entity = new Entity();
        entity.setName(request.getName());
        entity.setType(request.getType());
        entity.setIntro(request.getIntro());
        entity.setAuditStatus("APPROVED");
        entity.setAuditAdminId(jwtUtil.getUserId(token));

        entityMapper.insert(entity);
        return Result.success("创建成功", entity);
    }

    @PutMapping("/entities/{id}")
    public Result updateEntity(@RequestHeader(value = "Authorization", required = false) String authorization,
                             @PathVariable Long id,
                             @RequestBody EntityCreateRequest request) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        Entity entity = entityMapper.selectById(id);
        if (entity == null) {
            return Result.error(404, "主体不存在");
        }

        entity.setName(request.getName());
        entity.setType(request.getType());
        entity.setIntro(request.getIntro());
        entityMapper.updateById(entity);
        return Result.success("更新成功", entity);
    }

    @DeleteMapping("/entities/{id}")
    public Result deleteEntity(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @PathVariable Long id) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        Entity entity = entityMapper.selectById(id);
        if (entity == null) {
            return Result.error(404, "主体不存在");
        }

        entityMapper.deleteById(id);
        return Result.success("删除成功", null);
    }

    @GetMapping("/users/list")
    public Result getUsersList(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @RequestParam(required = false) String q,
                                @RequestParam(defaultValue = "1") Integer page,
                                @RequestParam(defaultValue = "20") Integer pageSize,
                                @RequestParam(required = false) String sort,
                                @RequestParam(required = false) String order) {
        String token = validateToken(authorization);
        checkAuth(token, 1);

        Page<UserProfile> pageParam = new Page<>(page, pageSize);
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();

        if (q != null && !q.isEmpty()) {
    wrapper.like(UserProfile::getPhone, q);
}


        if (sort != null && !sort.isEmpty()) {
            if ("last_login_at".equals(sort)) {
                wrapper.orderBy(true, "desc".equals(order), UserProfile::getLastLoginAt);
            } else {
                wrapper.orderBy(true, "desc".equals(order), UserProfile::getId);
            }
        } else {
            wrapper.orderBy(true, false, UserProfile::getId);
        }

        IPage<UserProfile> result = userProfileMapper.selectPage(pageParam, wrapper);
        return Result.success(result);
    }

    @GetMapping("/users/{id}")
    public Result getUserDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @PathVariable Long id) {
        String token = validateToken(authorization);
        checkAuth(token, 1);

        UserProfile userProfile = userProfileMapper.selectById(id);
        if (userProfile == null) {
            return Result.error(404, "用户不存在");
        }
        return Result.success(userProfile);
    }

    @PostMapping("/users")
    public Result createUser(@RequestHeader(value = "Authorization", required = false) String authorization,
                          @RequestBody UserRegisterRequest request) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getPhone, request.getPhone());
        UserProfile existingUser = userProfileMapper.selectOne(wrapper);

        if (existingUser != null) {
            return Result.error(400, "手机号已注册");
        }

        UserProfile userProfile = new UserProfile();
        userProfile.setPhone(request.getPhone());
        userProfile.setPasswordHash(request.getPasswordHash());

        userProfileMapper.insert(userProfile);
        return Result.success("创建成功", userProfile);
    }

    @PutMapping("/users/{id}")
    public Result updateUser(@RequestHeader(value = "Authorization", required = false) String authorization,
                          @PathVariable Long id,
                          @RequestBody UserRegisterRequest request) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        UserProfile userProfile = userProfileMapper.selectById(id);
        if (userProfile == null) {
            return Result.error(404, "用户不存在");
        }

        if (request.getPasswordHash() != null) {
            userProfile.setPasswordHash(request.getPasswordHash());
        }

        userProfileMapper.updateById(userProfile);
        return Result.success("更新成功", userProfile);
    }

    @DeleteMapping("/users/{id}")
    public Result deleteUser(@RequestHeader(value = "Authorization", required = false) String authorization,
                          @PathVariable Long id) {
        String token = validateToken(authorization);
        checkAuth(token, 2);

        UserProfile userProfile = userProfileMapper.selectById(id);
        if (userProfile == null) {
            return Result.error(404, "用户不存在");
        }

        userProfileMapper.deleteById(id);
        return Result.success("删除成功", null);
    }
}