package com.unibridge.backend.infrastructure.entities.infra;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_asymmetric_keys")
public class AsymmetricKey {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("key_id")
    private String keyId;
    @TableField("key_version")
    private Integer keyVersion;
    @TableField("key_type")
    private String keyType;
    private String algorithm;
    @TableField("public_key")
    private String publicKey;
    @TableField("public_key_fingerprint")
    private String publicKeyFingerprint;
    @TableField("encrypted_private_key")
    private String encryptedPrivateKey;
    @TableField("private_key_dek_id")
    private String privateKeyDekId;
    @TableField("holder_type")
    private String holderType;
    @TableField("holder_key")
    private String holderKey;
    @TableField("key_status")
    private String keyStatus;
    @TableField("activated_at")
    private LocalDateTime activatedAt;
    @TableField("rotation_at")
    private LocalDateTime rotationAt;
    @TableField("revoked_at")
    private LocalDateTime revokedAt;
    @TableField("auto_retire_on")
    private LocalDateTime autoRetireOn;
    @TableField("created_by")
    private String createdBy;
    @TableField("rotated_by")
    private String rotatedBy;
    @TableField("revoked_by")
    private String revokedBy;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
