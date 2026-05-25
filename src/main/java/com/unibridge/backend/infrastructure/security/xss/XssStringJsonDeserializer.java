package com.unibridge.backend.infrastructure.security.xss;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

/**
 * Jackson 字符串反序列化器：在 JSON → Java 对象瞬间调用 {@link XssCleanUtil#clean(String)}。
 * <p>
 * 通过 {@link XssClean} 注解挂载到 DTO 字段，实现无感自动清洗（方案 A）。
 * </p>
 */
public class XssStringJsonDeserializer extends JsonDeserializer<String> {

    @Override
    public String deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String raw = parser.getValueAsString();
        return XssCleanUtil.clean(raw);
    }
}
