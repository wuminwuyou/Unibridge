package com.unibridge.backend.domain.space.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** 机构空间人员 Tab 分页响应。 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityProfileMembersResponse {
    private String entityCode;
    private List<EntityMemberItem> members;
    private Long total;
    private Integer page;
    private Integer pageSize;
}
