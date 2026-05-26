package com.unibridge.backend.infrastructure.web;

import com.unibridge.backend.infrastructure.common.Result;
import com.unibridge.backend.infrastructure.config.IpLocationInterceptor;
import com.unibridge.backend.infrastructure.util.IpLocationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@Tag(name = "Client - 工具", description = "开发/联调辅助接口")
@RestController
@RequestMapping("/api/v1/client/ip-location")
public class IpLocationDemoController {

    @Operation(summary = "IP 属地演示", description = "返回当前请求的 IP 与属地，便于联调 extendInfo.ipLocation")
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
