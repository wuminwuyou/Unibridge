package com.unibridge.backend.domain.verification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeStudentItem {
    private String uid;
    private String nickname;
    private String realName;
    private String studentId;
    private Integer graduationYear;
    private String subCode;
    private String activatedAt;
}
