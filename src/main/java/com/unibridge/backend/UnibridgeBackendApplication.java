package com.unibridge.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication(scanBasePackages = "com.unibridge.backend")
@EnableScheduling
@MapperScan({
        "com.unibridge.backend.infrastructure.persistence.mapper",
        "com.unibridge.backend.infrastructure.media.mapper",
        "com.unibridge.backend.domain.admin.mapper"
})
public class UnibridgeBackendApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(UnibridgeBackendApplication.class, args);
    }

    /**
     * 从项目根目录加载 .env 文件到系统属性中。
     * IDE 环境下不会自动加载 .env，Docker 环境下环境变量已由 docker-compose 传入，
     * 此处仅在系统属性未设置时才写入，保证 Docker 环境变量优先。
     */
    private static void loadDotEnv() {
        Path envFile = Paths.get(".env");
        if (!Files.isRegularFile(envFile)) {
            envFile = Paths.get("../.env");
        }
        if (!Files.isRegularFile(envFile)) {
            return;
        }
        try {
            for (String line : Files.readAllLines(envFile)) {
                line = line.strip();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int eq = line.indexOf('=');
                if (eq <= 0) {
                    continue;
                }
                String key = line.substring(0, eq).strip();
                String value = line.substring(eq + 1).strip();
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException ignored) {
            // .env loading is best-effort
        }
    }
}
