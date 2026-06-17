package com.unibridge.backend.infrastructure.persistence.mapper.interaction;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.interaction.Achievement;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AchievementMapper extends BaseMapper<Achievement> {
}
