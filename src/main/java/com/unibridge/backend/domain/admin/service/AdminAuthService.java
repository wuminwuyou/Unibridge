package com.unibridge.backend.domain.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
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

    /**
     * 管理员登录。
     * <p>
     * 【并发安全】使用 LambdaUpdateWrapper 仅更新 last_login_at 字段，
     * 避免 updateById 全字段覆盖导致并发密码修改等操作丢失。
     * </p>
     */
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

        // 仅更新 lastLoginAt，避免全字段覆盖
        LambdaUpdateWrapper<SystemAdmin> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(SystemAdmin::getId, admin.getId())
                .set(SystemAdmin::getLastLoginAt, LocalDateTime.now());
        systemAdminMapper.update(null, updateWrapper);

        String token = jwtUtil.generateToken(admin.getId(), "ADMIN", admin.getAuthLevel());
        return new LoginResponse(token, admin.getAuthLevel(), admin.getId(), "ADMIN");
    }

    public void clearAdminLastLogin(String userId) {
        LambdaUpdateWrapper<SystemAdmin> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(SystemAdmin::getId, userId)
                .set(SystemAdmin::getLastLoginAt, null);
        systemAdminMapper.update(null, updateWrapper);
    }
}
