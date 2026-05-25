package com.unibridge.backend.infrastructure.web;

import com.unibridge.backend.infrastructure.common.Result;
import com.unibridge.backend.infrastructure.config.IpLocationInterceptor;
import com.unibridge.backend.infrastructure.util.IpLocationUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * IP 属地演示接口：展示拦截器解析结果，便于联调与写入 extendInfo 字段参考。
 */
@RestController
@RequestMapping("/api/v1/client/ip-location")
public class IpLocationDemoController {

    /**
     * 返回当前请求的 IP 与属地（优先读拦截器写入的 Request 属性）。
     */
    @GetMapping("/demo")
    public Result demo(HttpServletRequest request) {
        String clientIp = attributeOrResolve(request, IpLocationInterceptor.ATTR_CLIENT_IP);
        String ipLocation = attributeOrResolveLocation(request);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("clientIp", clientIp);
        data.put("ipLocation", ipLocation);
        data.put("extendInfo", Map.of("ipLocation", ipLocation));

        return Result.success(data);
    }

    private String attributeOrResolve(HttpServletRequest request, String attrName) {
        Object value = request.getAttribute(attrName);
        if (value instanceof String str && !str.isBlank()) {
            return str;
        }
        return IpLocationUtils.getRealIp(request);
    }

    private String attributeOrResolveLocation(HttpServletRequest request) {
        Object value = request.getAttribute(IpLocationInterceptor.ATTR_IP_LOCATION);
        if (value instanceof String str && !str.isBlank()) {
            return str;
        }
        return IpLocationUtils.resolveLocationFromRequest(request);
    }
}
