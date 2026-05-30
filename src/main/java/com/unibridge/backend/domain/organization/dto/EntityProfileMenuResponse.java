package com.unibridge.backend.domain.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 机构管理员顶栏菜单（`ProfileMenuContext`）。 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityProfileMenuResponse {
    private String entityCode;
    private String entityName;
    private String logoUrl;
    private Integer boundAdminCount;
    private Integer minAdminCount;
    private Integer maxAdminCount;
    private Boolean entityFullyActivated;
}
