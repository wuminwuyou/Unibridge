package com.unibridge.backend.domain.project.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectEvaluatePublicKeyResponse {
    private String keyId;
    private String publicKey;
}
