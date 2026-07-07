package com.unibridge.backend.infrastructure.persistence.mapper.infra;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.infra.AsymmetricKey;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AsymmetricKeyMapper extends BaseMapper<AsymmetricKey> {
}
