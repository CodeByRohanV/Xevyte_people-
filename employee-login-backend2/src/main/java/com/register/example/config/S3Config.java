package com.register.example.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;

@Configuration
public class S3Config {

    @Value("${aws.s3.region:ap-south-1}")
    private String region;

    @Value("${aws.s3.endpoint:#{null}}")
    private String endpoint;

    @Bean
    public S3Client s3Client() {
        software.amazon.awssdk.services.s3.S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create());
        
        if (endpoint != null && !endpoint.isEmpty()) {
            builder.endpointOverride(java.net.URI.create(endpoint));
        }
        
        return builder.build();
    }
}
