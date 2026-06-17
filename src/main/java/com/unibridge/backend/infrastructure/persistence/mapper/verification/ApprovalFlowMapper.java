package com.unibridge.backend.infrastructure.persistence.mapper.verification;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.unibridge.backend.infrastructure.entities.verification.ApprovalFlow;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ApprovalFlowMapper extends BaseMapper<ApprovalFlow> {
}
