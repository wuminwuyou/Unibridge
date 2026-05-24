package com.example.demo.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result {
    private Integer code;
    private String message;
    private Object data;

    public static Result success(Object data) {
        return new Result(200, "success", data);
    }

    public static Result success(String message, Object data) {
        return new Result(200, message, data);
    }

    public static Result error(Integer code, String message) {
        return new Result(code, message, null);
    }

    /** 失败响应（与 {@link #error(Integer, String)} 语义一致，便于全局异常处理器统一调用）。 */
    public static Result fail(int code, String msg) {
        return error(code, msg);
    }

    public static Result error(String message) {
        return new Result(500, message, null);
    }

    public static Result unauthorized(String message) {
        return new Result(401, message, null);  // 新增
    }

    public static Result forbidden(String message) {
        return new Result(403, message, null);  // 新增
    }
}
