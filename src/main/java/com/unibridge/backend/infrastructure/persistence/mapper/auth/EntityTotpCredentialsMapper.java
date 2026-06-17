package com.unibridge.backend.infrastructure.persistence.mapper.auth;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.auth.EntityTotpCredentials;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EntityTotpCredentialsMapper extends BaseMapper<EntityTotpCredentials> {
}
