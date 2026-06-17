package com.unibridge.backend.infrastructure.persistence.mapper.interaction;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.interaction.UserInteraction;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserInteractionMapper extends BaseMapper<UserInteraction> {
}
