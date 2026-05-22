package com.example.demo.client.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.client.entity.ClientNote;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ClientNoteMapper extends BaseMapper<ClientNote> {
}
