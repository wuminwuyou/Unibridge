package com.unibridge.backend.infrastructure.config;

import com.unibridge.backend.infrastructure.util.IpLocationUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * IP 属地拦截器：在每个 API 请求进入时解析客户端 IP 与属地，写入 Request 属性，供业务层或前端读取。
 * <p>
 * 写入字段示例（可映射到 {@code extendInfo.ipLocation}）：
 * <ul>
 *   <li>{@link #ATTR_CLIENT_IP} — 真实 IP</li>
 *   <li>{@link #ATTR_IP_LOCATION} — 属地文案，如「广东·深圳」</li>
 * </ul>
 */
@Component
public class IpLocationInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(IpLocationInterceptor.class);

    /** 请求属性：客户端真实 IP */
    public static final String ATTR_CLIENT_IP = "clientIp";

    /** 请求属性：IP 属地展示文案（extendInfo.ipLocation） */
    public static final String ATTR_IP_LOCATION = "ipLocation";

    /** 响应头：便于前端调试或直读（可选） */
    public static final String HEADER_IP_LOCATION = "X-IP-Location";

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) {
        String clientIp = IpLocationUtils.getRealIp(request);
        String ipLocation = IpLocationUtils.getIpLocation(clientIp);

        request.setAttribute(ATTR_CLIENT_IP, clientIp);
        request.setAttribute(ATTR_IP_LOCATION, ipLocation);
        response.setHeader(HEADER_IP_LOCATION, ipLocation);

        log.debug("IP属地解析: ip={}, location={}, uri={}", clientIp, ipLocation, request.getRequestURI());
        return true;
    }
}
