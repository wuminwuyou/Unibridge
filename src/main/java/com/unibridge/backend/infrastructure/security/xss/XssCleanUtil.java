package com.unibridge.backend.infrastructure.security.xss;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;
import org.springframework.util.StringUtils;

/**
 * 基于 Jsoup 的存储型 XSS 清洗工具。
 * <p>
 * 策略：在 {@link Safelist#relaxed()} 的排版能力之上，收窄为 Markdown 图文笔记 / 项目详情
 * 所需的最小白名单，并强制 {@code http/https} 协议，剔除一切事件处理器与危险标签。
 * </p>
 * <p>
 * <b>方案 B（业务层手动清洗）</b> 示例：
 * <pre>{@code
 * dto.setContent(XssCleanUtil.clean(dto.getContent()));
 * dto.setDescription(XssCleanUtil.clean(dto.getDescription()));
 * }</pre>
 * 推荐优先使用 {@link XssClean} + {@link XssStringJsonDeserializer} 在反序列化阶段无感拦截。
 * </p>
 */
public final class XssCleanUtil {

    /**
     * Markdown 富文本白名单：排版 + 图片 + 外链（仅 http/https）。
     * <p>
     * 不使用原生 {@link Safelist#relaxed()} 全量放行——relaxed 允许 {@code style} 等属性，
     * 存在 CSS 表达式 / url(javascript:) 等绕过风险；此处按业务收窄标签与属性集合。
     * </p>
     */
    private static final Safelist MARKDOWN_CONTENT_SAFELIST = buildMarkdownContentSafelist();

    private static final Document.OutputSettings OUTPUT_SETTINGS = new Document.OutputSettings()
            .prettyPrint(false);

    private XssCleanUtil() {
    }

    /**
     * 清洗用户提交的 HTML/Markdown 混排正文。
     *
     * @param rawContent 原始字符串；{@code null} 原样返回
     * @return 洗白后的安全文本；空白输入 trim 后若为空则返回 {@code null}
     */
    public static String clean(String rawContent) {
        if (rawContent == null) {
            return null;
        }
        String trimmed = rawContent.trim();
        if (!StringUtils.hasText(trimmed)) {
            return null;
        }
        return Jsoup.clean(trimmed, "", MARKDOWN_CONTENT_SAFELIST, OUTPUT_SETTINGS);
    }

    /**
     * 清洗单行短文本（标题、摘要等）。允许纯文本；若夹带 HTML 则同样走白名单。
     */
    public static String cleanPlain(String rawText) {
        return clean(rawText);
    }

    private static Safelist buildMarkdownContentSafelist() {
        Safelist safelist = Safelist.none()
                .addTags("h1", "h2", "h3", "h4", "h5", "h6",
                        "p", "strong", "em", "ul", "ol", "li", "br",
                        "img", "a")
                .addAttributes("img", "src", "alt", "title")
                .addAttributes("a", "href")
                .addProtocols("a", "href", "http", "https")
                .addProtocols("img", "src", "http", "https");
        // 在 relaxed 基础上补充常用排版标签，但不继承 relaxed 的危险属性（style/on* 等）
        return safelist;
    }
}
