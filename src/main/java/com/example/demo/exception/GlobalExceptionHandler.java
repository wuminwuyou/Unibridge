package com.example.demo.exception;

import com.example.demo.common.Result;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public Result handleRuntimeException(RuntimeException e) {
        String message = e.getMessage();

        if (message != null) {
            if (message.contains("未授权") || message.contains("token错误")) {
                return Result.unauthorized(message);
            } else if (message.contains("权限不足")) {
                return Result.forbidden(message);
            }
        }

        return Result.error(message);
    }
}
