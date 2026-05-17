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
