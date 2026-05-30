package com.unibridge.backend.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ProfileMenuResponse {
    private String userUid;
    private String nickname;
    private String level;
    private String avatarUrl;
    private String verifiedOrganization;
}
