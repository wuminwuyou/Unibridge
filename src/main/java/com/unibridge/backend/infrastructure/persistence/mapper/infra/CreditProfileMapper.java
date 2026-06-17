package com.unibridge.backend.infrastructure.persistence.mapper.infra;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.infra.CreditProfile;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CreditProfileMapper extends BaseMapper<CreditProfile> {
}
