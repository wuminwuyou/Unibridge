package com.unibridge.backend.infrastructure.util;

import jakarta.servlet.http.HttpServletRequest;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * IP 地址解析工具：从 HTTP 请求头/直连地址提取客户端 IP，并做基础校验与规范化。
 */
public final class IpUtil {

    public static final String UNKNOWN = "unknown";

    private static final String HEADER_X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String HEADER_X_REAL_IP = "X-Real-IP";
    private static final String HEADER_PROXY_CLIENT_IP = "Proxy-Client-IP";
    private static final String HEADER_WL_PROXY_CLIENT_IP = "WL-Proxy-Client-IP";

    private IpUtil() {
    }

    /**
     * 从请求中解析客户端真实 IP。
     * 优先级：X-Forwarded-For（首段） > X-Real-IP > Proxy-Client-IP > WL-Proxy-Client-IP > RemoteAddr
     */
    public static String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return UNKNOWN;
        }

        String ip = parseFirstIp(request.getHeader(HEADER_X_FORWARDED_FOR));
        if (isValidIp(ip)) {
            return normalize(ip);
        }

        ip = parseFirstIp(request.getHeader(HEADER_X_REAL_IP));
        if (isValidIp(ip)) {
            return normalize(ip);
        }

        ip = parseFirstIp(request.getHeader(HEADER_PROXY_CLIENT_IP));
        if (isValidIp(ip)) {
            return normalize(ip);
        }

        ip = parseFirstIp(request.getHeader(HEADER_WL_PROXY_CLIENT_IP));
        if (isValidIp(ip)) {
            return normalize(ip);
        }

        return normalize(request.getRemoteAddr());
    }

    /**
     * 从代理链头部取值中解析第一个有效 IP。
     * 例如 {@code X-Forwarded-For: 203.0.113.1, 10.0.0.1} → {@code 203.0.113.1}
     */
    public static String parseFirstIp(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        for (String segment : headerValue.split(",")) {
            String candidate = stripPort(segment.trim());
            if (isValidIp(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    /**
     * 规范化 IP 字符串：去空白，回环地址统一为 IPv4 形式。
     */
    public static String normalize(String ip) {
        if (ip == null || ip.isBlank()) {
            return UNKNOWN;
        }
        String trimmed = stripPort(ip.trim());
        if ("::1".equals(trimmed) || "0:0:0:0:0:0:0:1".equalsIgnoreCase(trimmed)) {
            return "127.0.0.1";
        }
        return trimmed;
    }

    /**
     * 判断是否为可解析的 IP 地址（IPv4 / IPv6）。
     */
    public static boolean isValidIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        String candidate = stripPort(ip.trim());
        if (UNKNOWN.equalsIgnoreCase(candidate)) {
            return false;
        }
        try {
            InetAddress address = InetAddress.getByName(candidate);
            String host = address.getHostAddress();
            return host != null && !host.isBlank();
        } catch (UnknownHostException ex) {
            return false;
        }
    }

    /**
     * 去掉 {@code [2001:db8::1]:8080} 或 {@code 192.168.1.1:8080} 中的端口部分。
     */
    private static String stripPort(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        if (value.startsWith("[") && value.contains("]")) {
            int end = value.indexOf(']');
            return value.substring(1, end);
        }
        int colonCount = value.length() - value.replace(":", "").length();
        if (colonCount == 1) {
            return value.substring(0, value.indexOf(':'));
        }
        return value;
    }
}
