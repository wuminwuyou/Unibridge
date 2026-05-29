package com.unibridge.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.unibridge.backend")
@EnableScheduling
@MapperScan({
        "com.unibridge.backend.infrastructure.persistence.mapper",
        "com.unibridge.backend.infrastructure.media.mapper",
        "com.unibridge.backend.domain.admin.mapper"
})
public class UnibridgeBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnibridgeBackendApplication.class, args);
    }
}
