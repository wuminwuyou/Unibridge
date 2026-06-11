package com.unibridge.backend.domain.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSearchItem {
    private String uid;
    private String nickname;
    private String displayName;
    private String avatarUrl;
}
