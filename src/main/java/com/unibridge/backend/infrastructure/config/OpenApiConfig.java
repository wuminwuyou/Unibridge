package com.unibridge.backend.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI unibridgeOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("UniBridge Backend API")
                        .description("产学研协作平台 REST API（Client 端 / Admin 端）")
                        .version("v1")
                        .contact(new Contact().name("UniBridge").url("https://github.com/unibridge")))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT access token，请求头格式：Authorization: Bearer {token}")));
    }
}
