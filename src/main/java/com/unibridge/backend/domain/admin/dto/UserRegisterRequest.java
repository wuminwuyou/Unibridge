package com.unibridge.backend.domain.admin.dto;

import lombok.Data;

@Data
public class UserRegisterRequest {
    private String phone;
    private String passwordHash;
    private Profile profile;

    @Data
    public static class Profile {
        private String realName;
        private String bioData;
        private String careerData;
        private String intro;
    }
}
