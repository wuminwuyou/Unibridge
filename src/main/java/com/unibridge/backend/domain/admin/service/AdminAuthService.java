package com.unibridge.backend.domain.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.unibridge.backend.domain.admin.dto.AdminLoginRequest;
import com.unibridge.backend.domain.admin.dto.LoginResponse;
import com.unibridge.backend.domain.admin.entity.SystemAdmin;
import com.unibridge.backend.domain.admin.mapper.SystemAdminMapper;
import com.unibridge.backend.infrastructure.common.BusinessException;
import com.unibridge.backend.infrastructure.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AdminAuthService {

    @Autowired
    private SystemAdminMapper systemAdminMapper;

    @Autowired
    private JwtUtil jwtUtil;

    public LoginResponse adminLogin(AdminLoginRequest request) {
        LambdaQueryWrapper<SystemAdmin> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SystemAdmin::getId, request.getAdminId());
        SystemAdmin admin = systemAdminMapper.selectOne(wrapper);

        if (admin == null) {
            throw BusinessException.unauthorized("管理员不存在");
        }

        if (!admin.getPasswordHash().equals(request.getPasswordHash())) {
            throw BusinessException.unauthorized("密码错误");
        }

        admin.setLastLoginAt(LocalDateTime.now());
        systemAdminMapper.updateById(admin);

        String token = jwtUtil.generateToken(admin.getId(), "ADMIN", admin.getAuthLevel());
        return new LoginResponse(token, admin.getAuthLevel(), admin.getId(), "ADMIN");
    }

    public void clearAdminLastLogin(String userId) {
        SystemAdmin admin = systemAdminMapper.selectById(userId);
        if (admin != null) {
            admin.setLastLoginAt(null);
            systemAdminMapper.updateById(admin);
        }
    }
}
