package com.unibridge.backend.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.ClientUserProfile;
import org.apache.ibatis.annotations.Mapper;

/** 个人资料数据访问层。 */
@Mapper
public interface ClientUserProfileMapper extends BaseMapper<ClientUserProfile> {
}
