package com.example.demo.client.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.client.entity.ClientEntity;
import org.apache.ibatis.annotations.Mapper;

/** 主体账号数据访问层。 */
@Mapper
public interface ClientEntityMapper extends BaseMapper<ClientEntity> {
}
