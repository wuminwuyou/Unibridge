package com.unibridge.backend.infrastructure.aspect;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unibridge.backend.infrastructure.util.IpLocationUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Parameter;
import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 全局 API 日志切面。
 * <p>
 * 拦截所有 Controller 下的公开方法，记录：
 * <ul>
 *   <li>请求进入：客户端 IP、HTTP 方法、URI、类名.方法名、参数</li>
 *   <li>请求结束：响应耗时（ms）</li>
 *   <li>异常：完整堆栈</li>
 * </ul>
 * 日志同时输出到 CONSOLE 和 API_FILE。
 * </p>
 */
@Aspect
@Component
public class ApiLogAspect {

    private static final Logger log = LoggerFactory.getLogger(ApiLogAspect.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Controller 切点：拦截 domain 和 infrastructure 下所有 controller 包的公开方法 */
    @Around("execution(public * com.unibridge.backend.domain..*Controller.*(..))"
            + " || execution(public * com.unibridge.backend.infrastructure..*Controller.*(..))")
    public Object logApi(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = signature.getName();
        String httpInfo = resolveHttpInfo();

        // ===== 请求进入 =====
        log.info("[API-IN] {} | {}.{} | params={}",
                httpInfo, className, methodName, formatArgs(joinPoint));

        try {
            Object result = joinPoint.proceed();
            long cost = System.currentTimeMillis() - start;

            // ===== 请求正常结束 =====
            log.info("[API-OUT] {} | {}.{} | cost={}ms",
                    httpInfo, className, methodName, cost);

            return result;
        } catch (Throwable ex) {
            long cost = System.currentTimeMillis() - start;

            // ===== 请求异常 =====
            log.error("[API-ERR] {} | {}.{} | cost={}ms | error={}",
                    httpInfo, className, methodName, cost,
                    ex.getClass().getSimpleName() + ": " + ex.getMessage(), ex);

            throw ex;
        }
    }

    /**
     * 解析当前请求的 HTTP 信息：METHOD URI?query  clientIP。
     */
    private String resolveHttpInfo() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) {
                return "NONE";
            }
            HttpServletRequest request = attrs.getRequest();
            String method = request.getMethod();
            String uri = request.getRequestURI();
            String query = request.getQueryString();
            String path = (query != null && !query.isBlank()) ? uri + "?" + query : uri;
            String clientIp = IpLocationUtils.getRealIp(request);
            return method + " " + path + " " + clientIp;
        } catch (Exception e) {
            return "NONE";
        }
    }

    /**
     * 格式化方法参数，跳过 HttpServletRequest/Response 等容器类型。
     */
    private String formatArgs(ProceedingJoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Parameter[] parameters = signature.getMethod().getParameters();
        Object[] args = joinPoint.getArgs();

        if (args == null || args.length == 0) {
            return "[]";
        }

        return Arrays.stream(args)
                .filter(Objects::nonNull)
                .filter(arg -> !(arg instanceof HttpServletRequest)
                        && !(arg instanceof jakarta.servlet.http.HttpServletResponse))
                .map(this::toJsonSafe)
                .collect(Collectors.joining(", ", "[", "]"));
    }

    /**
     * 安全序列化为 JSON 字符串，避免大对象撑爆日志。
     */
    private String toJsonSafe(Object obj) {
        if (obj == null) {
            return "null";
        }
        try {
            String json = MAPPER.writeValueAsString(obj);
            // 截断过长的内容
            return json.length() > 500 ? json.substring(0, 500) + "…" : json;
        } catch (JsonProcessingException e) {
            return obj.getClass().getSimpleName() + "@" + Integer.toHexString(System.identityHashCode(obj));
        }
    }
}
