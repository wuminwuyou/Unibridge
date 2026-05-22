package com.example.demo.config;

import com.example.demo.util.IpLocationUtils;
import org.lionsoul.ip2region.xdb.LongByteArray;
import org.lionsoul.ip2region.xdb.Searcher;
import org.lionsoul.ip2region.xdb.Version;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;

/**
 * ip2region 离线库配置。
 * <p>
 * 启动时将 {@code ip2region.xdb} 全量载入内存，创建全局唯一 {@link Searcher} 实例。
 * 全内存模式下 Searcher 线程安全，高并发查询无磁盘 I/O。
 * </p>
 */
@Configuration
public class IpRegionConfig {

    private static final Logger log = LoggerFactory.getLogger(IpRegionConfig.class);

    /** classpath 下的 xdb 数据文件（打包 Jar 后仍可直接读取） */
    public static final String XDB_CLASSPATH = "ip2region/ip2region.xdb";

    @Bean(destroyMethod = "close")
    public Searcher ip2regionSearcher() throws Exception {
        ClassPathResource resource = new ClassPathResource(XDB_CLASSPATH);
        if (!resource.exists()) {
            throw new IllegalStateException(
                    "缺少 ip2region 数据文件，请将 ip2region_v4.xdb 放到 src/main/resources/" + XDB_CLASSPATH);
        }

        LongByteArray xdbBuffer;
        try (InputStream inputStream = resource.getInputStream()) {
            // 从 classpath 一次性载入全量 xdb 到内存（无运行期磁盘 I/O）
            xdbBuffer = Searcher.loadContentFromInputStream(inputStream);
        }

        // 全内存 Searcher 线程安全，可作为全局单例供高并发查询
        Searcher searcher = Searcher.newWithBuffer(Version.IPv4, xdbBuffer);
        IpLocationUtils.initSearcher(searcher);

        log.info("ip2region 已就绪：classpath:{}，xdbSize={} bytes", XDB_CLASSPATH, xdbBuffer.length());
        return searcher;
    }
}
