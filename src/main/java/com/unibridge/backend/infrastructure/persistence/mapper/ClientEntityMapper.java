package com.unibridge.backend.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.ClientEntity;
import org.apache.ibatis.annotations.Mapper;

/** 主体账号数据访问层。 */
@Mapper
public interface ClientEntityMapper extends BaseMapper<ClientEntity> {
}
