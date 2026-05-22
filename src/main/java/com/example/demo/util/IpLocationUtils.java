package com.example.demo.util;

import jakarta.servlet.http.HttpServletRequest;
import org.lionsoul.ip2region.xdb.Searcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * IP 属地工具类：提取真实客户端 IP，并基于 ip2region 离线库解析为展示文案（如「广东·深圳」）。
 */
public final class IpLocationUtils {

    private static final Logger log = LoggerFactory.getLogger(IpLocationUtils.class);

    /** 解析失败或库未初始化时的兜底文案 */
    public static final String UNKNOWN_LOCATION = "未知";

    /** 内网 / 本机地址的展示文案 */
    public static final String LAN_LOCATION = "局域网";

    private static final String HEADER_X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String HEADER_X_REAL_IP = "X-Real-IP";
    private static final String HEADER_PROXY_CLIENT_IP = "Proxy-Client-IP";
    private static final String HEADER_WL_PROXY_CLIENT_IP = "WL-Proxy-Client-IP";

    /** 由 {@link com.example.demo.config.IpRegionConfig} 在启动时注入 */
    private static volatile Searcher searcher;

    private IpLocationUtils() {
    }

    /**
     * 启动阶段由配置类注入全局 Searcher（全内存模式，线程安全）。
     */
    public static void initSearcher(Searcher ip2regionSearcher) {
        searcher = ip2regionSearcher;
    }

    /**
     * 穿透 Nginx / CDN 等反向代理，获取用户真实外网 IP。
     * <p>
     * 优先级：X-Forwarded-For（首段有效 IP） &gt; X-Real-IP &gt; Proxy-Client-IP &gt; WL-Proxy-Client-IP &gt; RemoteAddr
     */
    public static String getRealIp(HttpServletRequest request) {
        if (request == null) {
            return IpUtil.UNKNOWN;
        }

        String ip = firstValidIpFromHeader(request.getHeader(HEADER_X_FORWARDED_FOR));
        if (IpUtil.isValidIp(ip)) {
            return IpUtil.normalize(ip);
        }

        ip = firstValidIpFromHeader(request.getHeader(HEADER_X_REAL_IP));
        if (IpUtil.isValidIp(ip)) {
            return IpUtil.normalize(ip);
        }

        ip = firstValidIpFromHeader(request.getHeader(HEADER_PROXY_CLIENT_IP));
        if (IpUtil.isValidIp(ip)) {
            return IpUtil.normalize(ip);
        }

        ip = firstValidIpFromHeader(request.getHeader(HEADER_WL_PROXY_CLIENT_IP));
        if (IpUtil.isValidIp(ip)) {
            return IpUtil.normalize(ip);
        }

        return IpUtil.normalize(request.getRemoteAddr());
    }

    /**
     * 根据 IP 解析属地展示文案。
     *
     * @param ip IPv4 / IPv6 字符串
     * @return 国内「省·市」、海外国家名、内网「局域网」、失败「未知」
     */
    public static String getIpLocation(String ip) {
        if (ip == null || ip.isBlank() || IpUtil.UNKNOWN.equalsIgnoreCase(ip)) {
            return UNKNOWN_LOCATION;
        }

        String normalizedIp = IpUtil.normalize(ip);
        if (isPrivateOrLoopback(normalizedIp)) {
            return LAN_LOCATION;
        }

        Searcher currentSearcher = searcher;
        if (currentSearcher == null) {
            log.warn("ip2region Searcher 尚未初始化，无法解析 IP: {}", normalizedIp);
            return UNKNOWN_LOCATION;
        }

        try {
            String rawRegion = currentSearcher.search(normalizedIp);
            return formatRegion(rawRegion);
        } catch (Exception ex) {
            log.warn("IP 属地解析失败, ip={}, reason={}", normalizedIp, ex.getMessage());
            return UNKNOWN_LOCATION;
        }
    }

    /**
     * 一步完成：从请求取真实 IP 并解析属地。
     */
    public static String resolveLocationFromRequest(HttpServletRequest request) {
        return getIpLocation(getRealIp(request));
    }

    /**
     * 将 ip2region 原始串格式化为前端展示文案。
     * <ul>
     *   <li>国内：{@code 中国|广东省|深圳市|电信|CN} → {@code 广东·深圳}</li>
     *   <li>海外：{@code 美国|0|0|0|US} → {@code 美国}</li>
     *   <li>无效：{@code 0|0|0|0|0} → {@code 未知}</li>
     * </ul>
     */
    public static String formatRegion(String rawRegion) {
        if (rawRegion == null || rawRegion.isBlank()) {
            return UNKNOWN_LOCATION;
        }

        String[] parts = rawRegion.split("\\|");
        if (parts.length == 0) {
            return UNKNOWN_LOCATION;
        }

        String country = cleanField(parts[0]);
        if (country.isEmpty() || "0".equals(country)) {
            return UNKNOWN_LOCATION;
        }

        // 国内：国家字段为「中国」
        if ("中国".equals(country)) {
            String province = parts.length > 1 ? cleanField(parts[1]) : "";
            String city = parts.length > 2 ? cleanField(parts[2]) : "";

            province = trimAdministrativeSuffix(province);
            city = trimAdministrativeSuffix(city);

            if (province.isEmpty() && city.isEmpty()) {
                return country;
            }
            if (city.isEmpty() || city.equals(province)) {
                return province.isEmpty() ? country : province;
            }
            return province + "·" + city;
        }

        // 海外：仅返回国家名
        return country;
    }

    private static String firstValidIpFromHeader(String headerValue) {
        String parsed = IpUtil.parseFirstIp(headerValue);
        return parsed == null ? "" : parsed;
    }

    private static String cleanField(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return "0".equals(trimmed) ? "" : trimmed;
    }

    /**
     * 去掉行政区划常见后缀，便于展示「广东·深圳」。
     */
    private static String trimAdministrativeSuffix(String name) {
        if (name == null || name.isEmpty()) {
            return "";
        }
        return name
                .replace("特别行政区", "")
                .replace("自治区", "")
                .replace("自治州", "")
                .replace("地区", "")
                .replace("省", "")
                .replace("市", "")
                .trim();
    }

    /**
     * 判断是否为内网或本机回环地址。
     */
    public static boolean isPrivateOrLoopback(String ip) {
        if (ip == null || ip.isBlank()) {
            return true;
        }

        if ("127.0.0.1".equals(ip) || "localhost".equalsIgnoreCase(ip)) {
            return true;
        }

        if (ip.startsWith("10.")) {
            return true;
        }
        if (ip.startsWith("192.168.")) {
            return true;
        }
        if (ip.startsWith("169.254.")) {
            return true;
        }

        // 172.16.0.0 - 172.31.255.255
        if (ip.startsWith("172.")) {
            String[] segments = ip.split("\\.");
            if (segments.length >= 2) {
                try {
                    int second = Integer.parseInt(segments[1]);
                    return second >= 16 && second <= 31;
                } catch (NumberFormatException ignored) {
                    return false;
                }
            }
        }

        // IPv6 本地链路 / 唯一本地 / 回环
        String lower = ip.toLowerCase();
        return lower.startsWith("fc")
                || lower.startsWith("fd")
                || lower.startsWith("fe80")
                || "::1".equals(lower)
                || "0:0:0:0:0:0:0:1".equals(lower);
    }
}
