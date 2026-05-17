package com.example.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.entity.Entity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EntityMapper extends BaseMapper<Entity> {
}
