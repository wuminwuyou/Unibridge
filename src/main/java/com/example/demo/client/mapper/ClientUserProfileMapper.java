package com.example.demo.client.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.client.entity.ClientUserProfile;
import org.apache.ibatis.annotations.Mapper;

/** 个人资料数据访问层。 */
@Mapper
public interface ClientUserProfileMapper extends BaseMapper<ClientUserProfile> {
}
