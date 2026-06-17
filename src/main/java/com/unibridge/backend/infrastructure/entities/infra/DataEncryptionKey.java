package com.unibridge.backend.infrastructure.entities.infra;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_data_encryption_keys")
public class DataEncryptionKey {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("key_id")
    private String keyId;
    @TableField("key_version")
    private Integer keyVersion;
    @TableField("key_type")
    private String keyType;
    private String algorithm;
    @TableField("encrypted_key")
    private String encryptedKey;
    @TableField("master_key_id")
    private String masterKeyId;
    @TableField("wrapping_algorithm")
    private String wrappingAlgorithm;
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
