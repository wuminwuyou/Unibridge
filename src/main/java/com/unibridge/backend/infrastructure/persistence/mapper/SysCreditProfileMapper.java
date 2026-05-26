package com.unibridge.backend.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.SysCreditProfile;
import org.apache.ibatis.annotations.Mapper;

/** 用户信用档案数据访问层。 */
@Mapper
public interface SysCreditProfileMapper extends BaseMapper<SysCreditProfile> {
}
