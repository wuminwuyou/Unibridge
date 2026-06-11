package com.unibridge.backend.infrastructure.entities;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_user_identity")
public class UserIdentity {
    @TableId(type = IdType.AUTO)
    private Long id;
    @TableField("user_uid")
    private String userUid;
    @TableField("encrypted_real_name")
    private String encryptedRealName;
    @TableField("real_name_mask")
    private String realNameMask;
    @TableField("id_card_no")
    private String idCardNo;
    @TableField("id_card_hash")
    private String idCardHash;
    @TableField("encryption_key_id")
    private String encryptionKeyId;
    @TableField("verified_at")
    private LocalDateTime verifiedAt;
    @TableField("created_at")
    private LocalDateTime createdAt;
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
