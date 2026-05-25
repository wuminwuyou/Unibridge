package com.unibridge.backend.domain.legacy;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.domain.admin.service.AdminAuthService;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.domain.legacy.dto.EntityLoginRequest;
import com.unibridge.backend.domain.legacy.dto.LoginResponse;
import com.unibridge.backend.domain.legacy.dto.UserLoginRequest;
import com.unibridge.backend.infrastructure.entities.Entity;
import com.unibridge.backend.infrastructure.entities.UserProfile;
import com.unibridge.backend.infrastructure.persistence.mapper.EntityMapper;
import com.unibridge.backend.infrastructure.persistence.mapper.UserProfileMapper;
import com.unibridge.backend.infrastructure.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class LegacyAuthService {

    @Autowired
    private AdminAuthService adminAuthService;

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private EntityMapper entityMapper;

    @Autowired
    private JwtUtil jwtUtil;

    public LoginResponse userLogin(UserLoginRequest request) {
        LambdaQueryWrapper<UserProfile> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserProfile::getPhone, request.getPhone());
        UserProfile userProfile = userProfileMapper.selectOne(wrapper);

        if (userProfile == null) {
            throw BusinessException.unauthorized("用户不存在");
        }

        if (!userProfile.getPasswordHash().equals(request.getPasswordHash())) {
            throw BusinessException.unauthorized("密码错误");
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
            throw BusinessException.unauthorized("主体不存在");
        }

        if (!"APPROVED".equals(entity.getAuditStatus())) {
            throw BusinessException.forbidden("主体未审核通过");
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
            adminAuthService.clearAdminLastLogin(userId);
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
