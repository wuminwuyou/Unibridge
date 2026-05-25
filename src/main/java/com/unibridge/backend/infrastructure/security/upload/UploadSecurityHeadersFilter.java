package com.unibridge.backend.infrastructure.security.upload;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 静态上传资源与 API 的安全响应头（Content-Type nosniff + CSP）。
 */
@Component
@Order(2)
public class UploadSecurityHeadersFilter extends OncePerRequestFilter {

    private static final String UPLOADS_PREFIX = "/uploads/";
    private static final String UPLOAD_API_PREFIX = "/api/uploads";
    private static final String UPLOAD_API_V1_PREFIX = "/api/v1/client/uploads";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (shouldApplyHeaders(path)) {
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setHeader("X-Frame-Options", "DENY");
            response.setHeader("Referrer-Policy", "no-referrer");
            if (path.startsWith(UPLOADS_PREFIX)) {
                response.setHeader("Content-Security-Policy",
                        "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'none'; script-src 'none'");
            } else {
                response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
            }
        }
        filterChain.doFilter(request, response);
    }

    private boolean shouldApplyHeaders(String path) {
        return path.startsWith(UPLOADS_PREFIX)
                || path.startsWith(UPLOAD_API_PREFIX)
                || path.startsWith(UPLOAD_API_V1_PREFIX);
    }
}
