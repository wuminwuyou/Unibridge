package com.example.demo.common;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.Set;

/**
 * 全局异常处理：
 * - 把业务异常映射到 HTTP 状态码（401 / 403 / 404 / 400 / 500）
 * - 保证 Response.body.code 与 HTTP status 一致，避免“业务失败但 HTTP 200”
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result> handleBusiness(BusinessException ex, HttpServletRequest request) {
        log.warn("[BIZ] {} {} -> {} {}", request.getMethod(), request.getRequestURI(), ex.getStatus(), ex.getMessage());
        return build(ex.getStatus(), ex.getMessage());
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Result> handleNotFound(NoHandlerFoundException ex, HttpServletRequest request) {
        log.warn("[404] {} {}", request.getMethod(), request.getRequestURI());
        return build(HttpStatus.NOT_FOUND.value(), "NOT_FOUND");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Result> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                           HttpServletRequest request) {
        log.warn("[405] {} {} -> {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.METHOD_NOT_ALLOWED.value(), "METHOD_NOT_ALLOWED");
    }

    @ExceptionHandler({MissingRequestHeaderException.class, MissingServletRequestParameterException.class,
            HttpMessageNotReadableException.class, IllegalArgumentException.class})
    public ResponseEntity<Result> handleBadRequest(Exception ex, HttpServletRequest request) {
        log.warn("[400] {} {} -> {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST.value(), ex.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Result> handleRuntime(RuntimeException ex, HttpServletRequest request) {
        String message = ex.getMessage();
        int status = resolveStatus(message);
        if (status >= 500) {
            log.error("[500] {} {} -> {}", request.getMethod(), request.getRequestURI(), message, ex);
        } else {
            log.warn("[{}] {} {} -> {}", status, request.getMethod(), request.getRequestURI(), message);
        }
        return build(status, message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("[500] {} {} -> {}", request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR.value(), "INTERNAL_SERVER_ERROR");
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

    private ResponseEntity<Result> build(int status, String message) {
        Result body = Result.error(status, message == null || message.isBlank() ? "ERROR" : message);
        return ResponseEntity.status(status).body(body);
    }
}
