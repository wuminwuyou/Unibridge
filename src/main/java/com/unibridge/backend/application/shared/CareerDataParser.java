package com.unibridge.backend.application.shared;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 解析 {@code p_user_profile.career_data} JSON 为展示用字符串列表。
 */
public final class CareerDataParser {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final List<String> FIELD_ORDER = List.of(
            "school", "major", "grade", "degree", "title", "department", "company"
    );

    private CareerDataParser() {
    }

    public static List<String> parse(String jsonText) {
        if (jsonText == null || jsonText.isBlank()) {
            return List.of();
        }
        try {
            JsonNode root = OBJECT_MAPPER.readTree(jsonText);
            if (root.isArray()) {
                List<String> items = new ArrayList<>();
                for (JsonNode node : root) {
                    if (node.isTextual()) {
                        items.add(node.asText());
                    } else if (node.isObject()) {
                        items.addAll(parseObjectNode(node));
                    } else if (!node.isNull()) {
                        items.add(node.asText());
                    }
                }
                return items;
            }
            if (root.isObject()) {
                return parseObjectNode(root);
            }
            if (root.isTextual()) {
                return List.of(root.asText());
            }
            return List.of();
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private static List<String> parseObjectNode(JsonNode object) {
        List<String> result = new ArrayList<>();
        Set<String> handled = new HashSet<>();
        for (String key : FIELD_ORDER) {
            appendField(result, handled, object, key);
        }
        object.fields().forEachRemaining(entry -> {
            if (!handled.contains(entry.getKey())) {
                appendField(result, handled, object, entry.getKey());
            }
        });
        return result;
    }

    private static void appendField(List<String> result, Set<String> handled, JsonNode object, String key) {
        JsonNode valueNode = object.get(key);
        if (valueNode == null || valueNode.isNull()) {
            return;
        }
        String value = valueNode.asText().trim();
        if (value.isEmpty()) {
            return;
        }
        handled.add(key);
        result.add(value);
    }
}
