package com.unibridge.backend.infrastructure.persistence.mapper.compliance;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.compliance.PolicyConfig;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PolicyConfigMapper extends BaseMapper<PolicyConfig> {
}
