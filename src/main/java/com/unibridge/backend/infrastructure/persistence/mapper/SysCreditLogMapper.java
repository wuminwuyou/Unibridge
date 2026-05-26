package com.unibridge.backend.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.SysCreditLog;
import org.apache.ibatis.annotations.Mapper;

/** 用户信用分变更流水数据访问层。 */
@Mapper
public interface SysCreditLogMapper extends BaseMapper<SysCreditLog> {
}
