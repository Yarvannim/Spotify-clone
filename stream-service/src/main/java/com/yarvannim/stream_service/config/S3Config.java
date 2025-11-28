package com.yarvannim.stream_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.S3AsyncClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {
    private final ObjectStorageProperties objectStorageProperties;

    public S3Config(ObjectStorageProperties objectStorageProperties) {
        this.objectStorageProperties = objectStorageProperties;
    }

    @Bean
    public S3AsyncClient s3AsyncClient() {
        S3AsyncClientBuilder builder = S3AsyncClient.builder()
                .region(Region.of(objectStorageProperties.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(objectStorageProperties.getAccessKey(), objectStorageProperties.getSecretKey())
                ));
        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        S3Presigner.Builder builder = S3Presigner.builder()
                .region(Region.of(objectStorageProperties.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(objectStorageProperties.getAccessKey(), objectStorageProperties.getSecretKey())
                ));
        return builder.build();
    }
}
