package com.example.demo.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.admin.dto.AdminLoginRequest;
import com.example.demo.admin.entity.SystemAdmin;
import com.example.demo.admin.mapper.SystemAdminMapper;
import com.example.demo.dto.LoginResponse;
import com.example.demo.util.JwtUtil;
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

    public void clearAdminLastLogin(String userId) {
        SystemAdmin admin = systemAdminMapper.selectById(userId);
        if (admin != null) {
            admin.setLastLoginAt(null);
            systemAdminMapper.updateById(admin);
        }
    }
}
