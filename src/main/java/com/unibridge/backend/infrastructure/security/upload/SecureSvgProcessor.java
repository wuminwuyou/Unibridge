package com.unibridge.backend.infrastructure.security.upload;

import com.unibridge.backend.infrastructure.common.BusinessException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * SVG 特殊处理：Jsoup 白名单清洗（等价 dompurify 思路）；当前封面白名单不含 svg，主要用于扩展场景。
 */
@Component
public class SecureSvgProcessor {

    private static final Logger log = LoggerFactory.getLogger(SecureSvgProcessor.class);

    private static final Safelist SVG_SAFELIST = Safelist.none()
            .addTags("svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "title")
            .addAttributes(":all", "viewBox", "width", "height", "fill", "stroke", "d", "cx", "cy", "r", "x", "y")
            .addProtocols("a", "href", "http", "https");

    public Path sanitize(Path source) throws IOException {
        String raw = Files.readString(source, StandardCharsets.UTF_8);
        Document doc = Jsoup.parse(raw, "", Parser.xmlParser());
        String cleaned = Jsoup.clean(doc.outerHtml(), "", SVG_SAFELIST,
                new Document.OutputSettings().prettyPrint(false));
        if (!StringUtils.hasText(cleaned)) {
            throw BusinessException.badRequest("SVG 内容非法");
        }
        Path target = Files.createTempFile("secure-svg-", ".svg");
        Files.writeString(target, cleaned, StandardCharsets.UTF_8);
        log.debug("SVG sanitized, bytes={}", cleaned.length());
        return target;
    }
}
