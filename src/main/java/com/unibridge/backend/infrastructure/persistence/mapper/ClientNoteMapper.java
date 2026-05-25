package com.unibridge.backend.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.ClientNote;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ClientNoteMapper extends BaseMapper<ClientNote> {
}
