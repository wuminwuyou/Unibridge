package com.example.demo.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ProfileMenuResponse {
    private Long userId;
    private String nickname;
    private String level;
    private String avatarUrl;
    private String verifiedOrganization;
}
