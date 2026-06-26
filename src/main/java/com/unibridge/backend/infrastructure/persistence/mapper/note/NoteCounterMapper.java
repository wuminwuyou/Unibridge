package com.unibridge.backend.infrastructure.persistence.mapper.note;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.note.NoteCounter;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface NoteCounterMapper extends BaseMapper<NoteCounter> {
}
