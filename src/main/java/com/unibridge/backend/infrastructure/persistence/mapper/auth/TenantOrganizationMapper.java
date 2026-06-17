package com.unibridge.backend.infrastructure.persistence.mapper.auth;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.auth.TenantOrganization;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TenantOrganizationMapper extends BaseMapper<TenantOrganization> {
}
