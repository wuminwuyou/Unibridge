package com.unibridge.backend.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.ClientUser;
import org.apache.ibatis.annotations.Mapper;

/** 个人账号数据访问层。 */
@Mapper
public interface ClientUserMapper extends BaseMapper<ClientUser> {
}
