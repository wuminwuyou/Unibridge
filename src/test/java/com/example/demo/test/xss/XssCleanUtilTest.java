package com.example.demo.test.xss;

import com.example.demo.security.xss.XssCleanUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class XssCleanUtilTest {

    @Test
    @DisplayName("攻击 1：<script> 注入被整段剔除")
    void stripsScriptInjection() {
        String malicious = "<p>正常段落</p><script>alert('XSS')</script><p>结尾</p>";
        String cleaned = XssCleanUtil.clean(malicious);

        assertFalse(cleaned.contains("script"));
        assertFalse(cleaned.contains("alert"));
        assertTrue(cleaned.contains("正常段落"));
        assertTrue(cleaned.contains("结尾"));
        assertEquals("<p>正常段落</p><p>结尾</p>", cleaned);
    }

    @Test
    @DisplayName("攻击 2：<img onerror> 事件处理器被剔除，合法 src/alt 保留")
    void stripsImgOnerrorKeepsSafeAttributes() {
        String malicious = "<img src=\"https://cdn.example.com/a.jpg\" "
                + "onerror=\"alert(1)\" alt=\"封面\" title=\"图\">";
        String cleaned = XssCleanUtil.clean(malicious);

        assertFalse(cleaned.contains("onerror"));
        assertFalse(cleaned.contains("alert"));
        assertTrue(cleaned.contains("src=\"https://cdn.example.com/a.jpg\""));
        assertTrue(cleaned.contains("alt=\"封面\""));
        assertTrue(cleaned.contains("title=\"图\""));
    }

    @Test
    @DisplayName("攻击 3：javascript: 伪协议链接 href 被剔除")
    void stripsJavascriptHref() {
        String malicious = "<a href=\"javascript:alert(document.cookie)\">点击劫持</a>";
        String cleaned = XssCleanUtil.clean(malicious);

        assertFalse(cleaned.toLowerCase().contains("javascript:"));
        assertTrue(cleaned.contains("点击劫持"));
        assertFalse(cleaned.contains("href="));
    }

    @Test
    @DisplayName("合法 https 链接与排版标签保留")
    void keepsSafeMarkup() {
        String safe = "<h2>标题</h2><p><strong>加粗</strong> "
                + "<a href=\"https://example.com/doc\">文档</a></p>"
                + "<ul><li>项一</li></ul>";
        String cleaned = XssCleanUtil.clean(safe);

        assertEquals(safe, cleaned);
    }

    @Test
    @DisplayName("null / 空白原样或归 null")
    void handlesNullAndBlank() {
        assertNull(XssCleanUtil.clean(null));
        assertNull(XssCleanUtil.clean("   "));
    }
}
