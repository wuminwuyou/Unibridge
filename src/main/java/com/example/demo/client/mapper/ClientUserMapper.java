package com.example.demo.client.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.client.entity.ClientUser;
import org.apache.ibatis.annotations.Mapper;

/** 个人账号数据访问层。 */
@Mapper
public interface ClientUserMapper extends BaseMapper<ClientUser> {
}
