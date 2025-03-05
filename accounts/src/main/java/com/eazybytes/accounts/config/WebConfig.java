package com.eazybytes.accounts.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
          @Override
          public void addCorsMappings(CorsRegistry registry) {
              registry.addMapping("/subscribe")
                      .allowedOrigins("http://localhost:9300") // 프론트엔드 도메인
                      .allowedMethods("GET")
                      .allowedHeaders("*")
                      .allowCredentials(true);
          }
        };
    }
}
