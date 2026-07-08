package com.unibridge.backend.infrastructure.persistence.mapper.project;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.project.ProjectLevelAudit;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProjectLevelAuditMapper extends BaseMapper<ProjectLevelAudit> {
}
