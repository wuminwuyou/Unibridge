package com.unibridge.backend.infrastructure.security.xss;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标记需要在 JSON 反序列化阶段自动 XSS 清洗的字符串字段（方案 A：契约式拦截）。
 * <p>
 * Spring MVC 将请求体绑定为 DTO 时，Jackson 会调用 {@link XssStringJsonDeserializer}，
 * Controller / Service 层拿到的已是洗白后的安全字符串。
 * </p>
 */
@Documented
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotationsInside
@JsonDeserialize(using = XssStringJsonDeserializer.class)
public @interface XssClean {
}
