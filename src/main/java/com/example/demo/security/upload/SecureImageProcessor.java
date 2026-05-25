package com.example.demo.security.upload;

import com.example.demo.common.BusinessException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.parser.Parser;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;

/**
 * 图片重编码以剥离 EXIF 等元数据（等价于 Node sharp 的「去元数据+转码」思路，JDK 内置 ImageIO）。
 */
@Component
public class SecureImageProcessor {

    private static final Logger log = LoggerFactory.getLogger(SecureImageProcessor.class);
    private static final Set<String> REENCODE_FORMATS = Set.of("jpg", "jpeg", "png", "gif");

    public Path reencodeStripMetadata(Path source, String extension) throws IOException {
        String normalized = extension.toLowerCase(Locale.ROOT);
        if ("jpeg".equals(normalized)) {
            normalized = "jpg";
        }
        if (!REENCODE_FORMATS.contains(normalized)) {
            // WebP 等：JDK 写支持有限，仅做魔数校验后原样落盘（见 Facade 分支）
            return source;
        }
        String imageIoFormat = "jpg".equals(normalized) ? "jpg" : normalized;
        Path target = Files.createTempFile("secure-img-", "." + normalized);
        try (InputStream in = Files.newInputStream(source)) {
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                Files.deleteIfExists(target);
                throw BusinessException.badRequest("图片内容无效");
            }
            try (OutputStream out = Files.newOutputStream(target)) {
                if (!ImageIO.write(image, imageIoFormat, out)) {
                    Files.deleteIfExists(target);
                    throw BusinessException.badRequest("图片安全处理失败");
                }
            }
        } catch (BusinessException ex) {
            throw ex;
        } catch (IOException ex) {
            Files.deleteIfExists(target);
            throw ex;
        }
        log.debug("Image metadata stripped via re-encode: format={}", imageIoFormat);
        return target;
    }
}
