package com.unibridge.backend.infrastructure.persistence.mapper.profile;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.profile.UserOrganizationBinding;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserOrganizationBindingMapper extends BaseMapper<UserOrganizationBinding> {
}
