package com.unibridge.backend.infrastructure.persistence.mapper.project;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.project.ProjectSecret;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProjectSecretMapper extends BaseMapper<ProjectSecret> {
}
