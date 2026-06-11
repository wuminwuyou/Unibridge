package com.unibridge.backend.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVerifiedPreviewResponse {
    private String uid;
    private String realNameMask;
    private String nickname;
    private String avatarUrl;
    private boolean verified;
    private String role;
}

