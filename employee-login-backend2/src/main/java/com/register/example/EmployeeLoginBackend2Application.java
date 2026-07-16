package com.register.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableScheduling
@EnableJpaAuditing
@EnableAsync
@org.springframework.boot.autoconfigure.domain.EntityScan(basePackages = "com.register.example.entity")
@org.springframework.data.jpa.repository.config.EnableJpaRepositories(basePackages = "com.register.example.repository")
public class EmployeeLoginBackend2Application {

    @jakarta.annotation.PostConstruct
    public void init() {
        java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
    }

    public static void main(String[] args) {
        SpringApplication.run(EmployeeLoginBackend2Application.class, args);
    }
}
