package com.unibridge.backend.domain.verification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeListItem {
    private String code;
    private Integer maxQuota;
    private Integer usedQuota;
    private String description;
    private String createdBy;
    private String createdByName;
    private Boolean isActive;
    private Boolean isMaster;
    /** 是否可以延期（人为停用=false，自然过期7天内=true，7天外=false） */
    private Boolean canRenew;
    private String createdAt;
    private String expireTime;
}
