package com.unibridge.backend.infrastructure.common;

import com.unibridge.backend.application.shared.RateLimitService.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.sql.SQLException;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 全局异常拦截器 —— 内外隔离（Security by Obscurity + 可运维性）。
 * <p>
 * <b>对内（服务器日志）</b>：{@link #logInternalError} / {@link #logInternalWarn} 完整记录 URI、
 * 异常类型、message 与 stack trace，便于单兵开发者秒级定位问题。<br>
 * <b>对外（HTTP 响应体）</b>：{@link #buildSafeResponse} 仅返回标准 {@link Result}，
 * 绝不暴露表名、列名、SQL、Mapper 路径或 Java 堆栈。
 * </p>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 对外：数据库/持久层异常统一话术（零提示） */
    private static final String MSG_DB_SAFE = "服务内部异常，请稍后再试";

    /** 对外：未知运行时异常统一话术（零提示，不含 NPE/SQL 等字样） */
    private static final String MSG_UNKNOWN_SAFE = "网络连接超时，请稍后重试";

    /** 对外：参数校验失败时的兜底话术 */
    private static final String MSG_VALIDATION_FALLBACK = "请求参数不合法";

    private static final Set<String> UNAUTHORIZED_CODES = Set.of(
            "UNAUTHORIZED",
            "ACCESS_TOKEN_EXPIRED",
            "REFRESH_TOKEN_REQUIRED",
            "REFRESH_TOKEN_INVALID",
            "AUTH_REQUIRED",
            "TOKEN_INVALID",
            "未授权",
            "token错误",
            "token已过期"
    );

    private static final Set<String> FORBIDDEN_CODES = Set.of(
            "FORBIDDEN",
            "PERMISSION_DENIED",
            "权限不足"
    );

    // =========================================================================
    // 业务异常（可控错误码，消息可安全返回给前端）
    // =========================================================================

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result> handleBusiness(BusinessException ex, HttpServletRequest request) {
        // 业务异常属于预期分支：warn 级别即可，消息本身不含底层细节
        logInternalWarn(request, "BIZ", ex.getStatus(), ex.getMessage(), ex);
        return buildSafeResponse(ex.getStatus(), ex.getMessage());
    }

    // =========================================================================
    // 🟢 A. 数据库与持久层异常（核心安全区 —— 必须洗白）
    // =========================================================================

    /**
     * 拦截 Spring DataAccessException（涵盖 MyBatis 包装后的 SQL 语法错误、未知列、约束冲突等）。
     * <ul>
     *   <li>对内：log.error 打印完整堆栈与 cause 链</li>
     *   <li>对外：500 + 模糊话术，绝不回传 SQL/表名/字段名</li>
     * </ul>
     */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Result> handleDataAccess(DataAccessException ex, HttpServletRequest request) {
        logInternalError(request, "DB/DataAccess", ex);
        return buildSafeResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), MSG_DB_SAFE);
    }

    /**
     * 拦截原生 {@link SQLException}（部分 JDBC 驱动或工具类可能直接抛出）。
     * 洗白策略与 DataAccessException 一致。
     */
    @ExceptionHandler(SQLException.class)
    public ResponseEntity<Result> handleSqlException(SQLException ex, HttpServletRequest request) {
        logInternalError(request, "DB/SQL", ex);
        return buildSafeResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), MSG_DB_SAFE);
    }

    // =========================================================================
    // 🟡 B. 前端参数校验异常（UX 与安全并存 —— 可返回具体字段提示）
    // =========================================================================

    /**
     * 限流异常：映射为 429 Too Many Requests。
     */
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<Result> handleRateLimit(RateLimitExceededException ex, HttpServletRequest request) {
        logInternalWarn(request, "RATELIMIT", HttpStatus.TOO_MANY_REQUESTS.value(),
                ex.getLabel() + " limit=" + ex.getLimit() + "/" + ex.getWindowSec() + "s", ex);
        return buildSafeResponse(HttpStatus.TOO_MANY_REQUESTS.value(), ex.getMessage());
    }

    /**
     * 拦截 {@code @Valid} / {@code @Validated} 触发的参数校验失败。
     * <ul>
     *   <li>对内：warn 记录字段名与 defaultMessage（便于联调）</li>
     *   <li>对外：400 + 字段校验文案（如「用户昵称不能为空」），不含堆栈</li>
     * </ul>
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Result> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String validationDetail = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("；"));

        if (validationDetail.isBlank()) {
            validationDetail = MSG_VALIDATION_FALLBACK;
        }

        // 对内：记录完整 FieldError 列表（含 field / rejectedValue），不对外暴露 rejectedValue
        logInternalWarn(request, "VALIDATION", HttpStatus.BAD_REQUEST.value(), validationDetail, ex);

        String userMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .filter(msg -> msg != null && !msg.isBlank())
                .findFirst()
                .orElse(MSG_VALIDATION_FALLBACK);

        return buildSafeResponse(HttpStatus.BAD_REQUEST.value(), userMessage);
    }

    // =========================================================================
    // HTTP 协议层异常（保留原有行为，消息本身不含敏感底层信息）
    // =========================================================================

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Result> handleMaxUploadSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        logInternalWarn(request, "PAYLOAD_TOO_LARGE", HttpStatus.PAYLOAD_TOO_LARGE.value(), ex.getMessage(), ex);
        return buildSafeResponse(HttpStatus.PAYLOAD_TOO_LARGE.value(), "上传文件过大，请压缩后重试");
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Result> handleNotFound(NoHandlerFoundException ex, HttpServletRequest request) {
        logInternalWarn(request, "404", HttpStatus.NOT_FOUND.value(), "NOT_FOUND", ex);
        return buildSafeResponse(HttpStatus.NOT_FOUND.value(), "NOT_FOUND");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Result> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                           HttpServletRequest request) {
        logInternalWarn(request, "405", HttpStatus.METHOD_NOT_ALLOWED.value(), ex.getMessage(), ex);
        return buildSafeResponse(HttpStatus.METHOD_NOT_ALLOWED.value(), "METHOD_NOT_ALLOWED");
    }

    @ExceptionHandler({MissingRequestHeaderException.class, MissingServletRequestParameterException.class,
            HttpMessageNotReadableException.class})
    public ResponseEntity<Result> handleBadRequest(Exception ex, HttpServletRequest request) {
        logInternalWarn(request, "400", HttpStatus.BAD_REQUEST.value(), ex.getMessage(), ex);
        return buildSafeResponse(HttpStatus.BAD_REQUEST.value(), sanitizeClientMessage(ex.getMessage(), "BAD_REQUEST"));
    }

    /**
     * 拦截 query/path 参数类型不匹配（如 {@code seed=Date.now()} 传入仍声明为 {@code Integer} 的旧接口）。
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Result> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                     HttpServletRequest request) {
        String detail = ex.getName() + " 参数格式无效";
        logInternalWarn(request, "400", HttpStatus.BAD_REQUEST.value(), detail, ex);
        return buildSafeResponse(HttpStatus.BAD_REQUEST.value(), "请求参数不合法");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Result> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        String message = ex.getMessage();
        int status = resolveStatus(message);
        if (status >= 500) {
            logInternalError(request, "IllegalArgument/500", ex);
            return buildSafeResponse(status, MSG_UNKNOWN_SAFE);
        }
        logInternalWarn(request, "400", status, message, ex);
        return buildSafeResponse(status, sanitizeClientMessage(message, "BAD_REQUEST"));
    }

    /**
     * 业务层以 {@code throw new RuntimeException("ERROR_CODE")} 抛出的可控错误（全大写下划线错误码）。
     * 与 {@link IllegalArgumentException} 分支一致，对外返回 4xx + 错误码，避免误报 500。
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Result> handleRuntime(RuntimeException ex, HttpServletRequest request) {
        if (ex instanceof BusinessException business) {
            return handleBusiness(business, request);
        }
        String message = ex.getMessage();
        if (message != null && message.matches("^[A-Z][A-Z0-9_]+$")) {
            int status = resolveStatus(message);
            logInternalWarn(request, "BIZ-RUNTIME", status, message, ex);
            return buildSafeResponse(status, message);
        }
        logInternalError(request, "UNKNOWN-RUNTIME", ex);
        return buildSafeResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), MSG_UNKNOWN_SAFE);
    }

    // =========================================================================
    // 🔴 C. 全局未知异常（终极防漏斗 —— 必须洗白）
    // =========================================================================

    /**
     * 兜底所有未预料的运行时崩溃（NPE、ClassCastException、未捕获的 RuntimeException 等）。
     * <ul>
     *   <li>对内：log.error 完整堆栈</li>
     *   <li>对外：500 + 「网络连接超时，请稍后重试」，绝不出现异常类名</li>
     * </ul>
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result> handleUnexpected(Exception ex, HttpServletRequest request) {
        logInternalError(request, "UNKNOWN", ex);
        return buildSafeResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), MSG_UNKNOWN_SAFE);
    }

    // =========================================================================
    // 对内：安全日志（完整现场，仅写入服务器日志）
    // =========================================================================

    /** 错误级别：持久化/未知崩溃，必须带 stack trace。 */
    private void logInternalError(HttpServletRequest request, String category, Throwable ex) {
        log.error("[{}] {} {} | type={} | message={}",
                category,
                request.getMethod(),
                request.getRequestURI(),
                ex.getClass().getName(),
                ex.getMessage(),
                ex);
    }

    /** 警告级别：业务/校验/HTTP 层预期异常，按需附带 stack trace。 */
    private void logInternalWarn(HttpServletRequest request, String category, int status, String detail, Throwable ex) {
        log.warn("[{}] {} {} -> {} | type={} | detail={}",
                category,
                request.getMethod(),
                request.getRequestURI(),
                status,
                ex.getClass().getName(),
                detail,
                ex);
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + "=" + error.getDefaultMessage();
    }

    // =========================================================================
    // 对外：数据脱敏（构造标准 Result，禁止泄露底层实现）
    // =========================================================================

    /**
     * 构造对外安全响应：HTTP status 与 Result.code 对齐，body 仅含 code + message。
     */
    private ResponseEntity<Result> buildSafeResponse(int status, String safeMessage) {
        String msg = safeMessage == null || safeMessage.isBlank() ? "ERROR" : safeMessage;
        Result body = Result.fail(status, msg);
        return ResponseEntity.status(status).body(body);
    }

    /**
     * 对可能来自底层的 message 做最后一道清洗（防止误把 SQL 片段透传给前端）。
     */
    private String sanitizeClientMessage(String message, String fallback) {
        if (message == null || message.isBlank()) {
            return fallback;
        }
        String lower = message.toLowerCase();
        if (lower.contains("sql")
                || lower.contains("mysql")
                || lower.contains("table")
                || lower.contains("column")
                || lower.contains("mybatis")
                || lower.contains("jdbc")
                || lower.contains("syntax")
                || lower.contains("exception")
                || lower.contains("nullpointer")) {
            return fallback;
        }
        return message;
    }

    private int resolveStatus(String message) {
        if (message == null || message.isBlank()) {
            return HttpStatus.BAD_REQUEST.value();
        }
        if (UNAUTHORIZED_CODES.contains(message)) {
            return HttpStatus.UNAUTHORIZED.value();
        }
        if (FORBIDDEN_CODES.contains(message)) {
            return HttpStatus.FORBIDDEN.value();
        }
        return HttpStatus.BAD_REQUEST.value();
    }
}
