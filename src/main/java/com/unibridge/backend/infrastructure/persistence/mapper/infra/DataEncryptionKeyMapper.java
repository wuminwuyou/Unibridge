package com.unibridge.backend.infrastructure.persistence.mapper.infra;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.infra.DataEncryptionKey;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DataEncryptionKeyMapper extends BaseMapper<DataEncryptionKey> {
}
