package com.example.demo.client.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.client.entity.UserAuthLink;
import org.apache.ibatis.annotations.Mapper;

/** 用户认证关系数据访问层。 */
@Mapper
public interface UserAuthLinkMapper extends BaseMapper<UserAuthLink> {
}
