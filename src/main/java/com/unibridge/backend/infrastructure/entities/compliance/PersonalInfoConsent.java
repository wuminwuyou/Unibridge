package com.unibridge.backend.infrastructure.entities.compliance;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_personal_info_consent")
public class PersonalInfoConsent {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_uid")
    private String userUid;
    @TableField("consent_type")
    private String consentType;
    @TableField("consent_action")
    private String consentAction;
    @TableField("consent_version")
    private String consentVersion;
    @TableField("policy_content_hash")
    private String policyContentHash;
    @TableField("consented_at")
    private LocalDateTime consentedAt;
    private String source;
    @TableField("ip_address_hash")
    private String ipAddressHash;
    @TableField("ip_address_salt")
    private String ipAddressSalt;
}
