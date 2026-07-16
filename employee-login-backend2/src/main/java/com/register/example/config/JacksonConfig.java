package com.register.example.config;

import com.fasterxml.jackson.core.StreamReadConstraints;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> builder.postConfigurer(objectMapper ->
            objectMapper.getFactory().setStreamReadConstraints(
                StreamReadConstraints.builder()
                    .maxStringLength(20 * 1024 * 1024) // 20MB
                    .build()
            )
        );
    }
}
