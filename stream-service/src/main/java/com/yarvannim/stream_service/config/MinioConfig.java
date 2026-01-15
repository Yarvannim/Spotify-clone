package com.yarvannim.stream_service.config;

import io.minio.MinioClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local")
public class MinioConfig {

    private final ObjectStorageProperties objectStorageProperties;

    public MinioConfig(ObjectStorageProperties objectStorageProperties) {
        this.objectStorageProperties = objectStorageProperties;
    }

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(objectStorageProperties.getEndpoint())
                .credentials(objectStorageProperties.getAccessKey(), objectStorageProperties.getSecretKey())
                .build();
    }
}
