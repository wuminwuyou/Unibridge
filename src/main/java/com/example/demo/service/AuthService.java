package com.example.demo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.dto.*;
import com.example.demo.entity.Entity;
import com.example.demo.entity.SystemAdmin;
import com.example.demo.entity.UserProfile;
import com.example.demo.mapper.EntityMapper;
import com.example.demo.mapper.SystemAdminMapper;
import com.example.demo.mapper.UserProfileMapper;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private SystemAdminMapper systemAdminMapper;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private EntityMapper entityMapper;

    @Autowired
    private JwtUtil jwtUtil;

    public LoginResponse adminLogin(AdminLoginRequest request) {
        LambdaQueryWrapper<SystemAdmin> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SystemAdmin::getId, request.getAdminId());
        SystemAdmin admin = systemAdminMapper.selectOne(wrapper);

        if (admin == null) {
            throw new RuntimeException("管理员不存在");
        }

        if (!admin.getPasswordHash().equals(request.getPasswordHash())) {
            throw new RuntimeException("密码错误");
        }

        admin.setLastLoginAt(LocalDateTime.now());
        systemAdminMapper.updateById(admin);

        String token = jwtUtil.generateToken(admin.getId(), "ADMIN", admin.getAuthLevel());
        return new LoginResponse(token, admin.getAuthLevel(), admin.getId(), "ADMIN");
    }

    public LoginResponse userLogin(UserLoginRequest request) {
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getPhone, request.getPhone());
        UserProfile userProfile = userProfileMapper.selectOne(wrapper);

        if (userProfile == null) {
            throw new RuntimeException("用户不存在");
        }

        if (!userProfile.getPasswordHash().equals(request.getPasswordHash())) {
            throw new RuntimeException("密码错误");
        }

        userProfile.setLastLoginAt(LocalDateTime.now());
        userProfileMapper.updateById(userProfile);

        String token = jwtUtil.generateToken(userProfile.getId().toString(), "USER", 0);
        return new LoginResponse(token, 0, userProfile.getId().toString(), "USER");
    }


    public LoginResponse entityLogin(EntityLoginRequest request) {
        LambdaQueryWrapper<Entity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Entity::getName, request.getName());
        Entity entity = entityMapper.selectOne(wrapper);

        if (entity == null) {
            throw new RuntimeException("主体不存在");
        }

        if (!"APPROVED".equals(entity.getAuditStatus())) {
            throw new RuntimeException("主体未审核通过");
        }

        entity.setLastLoginAt(LocalDateTime.now());
        entityMapper.updateById(entity);

        String token = jwtUtil.generateToken(entity.getId().toString(), "ENTITY", 0);
        return new LoginResponse(token, 0, entity.getId().toString(), "ENTITY");
    }

    public void logout(String token) {
        String userId = jwtUtil.getUserId(token);
        String userType = jwtUtil.getUserType(token);

        if ("ADMIN".equals(userType)) {
            SystemAdmin admin = systemAdminMapper.selectById(userId);
            if (admin != null) {
                admin.setLastLoginAt(null);
                systemAdminMapper.updateById(admin);
            }
        } else if ("USER".equals(userType)) {
            UserProfile userProfile = userProfileMapper.selectById(Long.parseLong(userId));
            if (userProfile != null) {
                userProfile.setLastLoginAt(null);
                userProfileMapper.updateById(userProfile);
            }
        } else if ("ENTITY".equals(userType)) {
            Entity entity = entityMapper.selectById(Long.parseLong(userId));
            if (entity != null) {
                entity.setLastLoginAt(null);
                entityMapper.updateById(entity);
            }
        }
    }
}