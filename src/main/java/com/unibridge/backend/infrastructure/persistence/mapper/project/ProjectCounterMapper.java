package com.unibridge.backend.infrastructure.persistence.mapper.project;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.project.ProjectCounter;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProjectCounterMapper extends BaseMapper<ProjectCounter> {
}
