package com.unibridge.backend.infrastructure.security.upload;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 上传安全审计日志（10. 访问日志记录）。
 */
@Component
public class UploadSecurityAuditLogger {

    private static final Logger AUDIT = LoggerFactory.getLogger("UPLOAD_SECURITY_AUDIT");

    private final FileUploadSecurityProperties securityProperties;

    public UploadSecurityAuditLogger(FileUploadSecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    public void logSuccess(UploadMediaCategory category,
                           String sanitizedFilename,
                           String extension,
                           long sizeBytes,
                           String md5Hex,
                           String clientIp,
                           boolean reencoded) {
        if (!securityProperties.isAuditEnabled()) {
            return;
        }
        AUDIT.info("UPLOAD_OK category={} name={} ext={} size={} md5={} ip={} reencoded={}",
                category.name(), sanitizedFilename, extension, sizeBytes, md5Hex, nullToDash(clientIp), reencoded);
    }

    public void logRejected(UploadMediaCategory category,
                            String reason,
                            String sanitizedFilename,
                            String clientIp) {
        if (!securityProperties.isAuditEnabled()) {
            return;
        }
        AUDIT.warn("UPLOAD_REJECT category={} reason={} name={} ip={}",
                category.name(), reason, nullToDash(sanitizedFilename), nullToDash(clientIp));
    }

    private String nullToDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
