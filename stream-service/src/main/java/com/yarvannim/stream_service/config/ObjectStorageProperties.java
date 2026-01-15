package com.yarvannim.stream_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "object.storage")
@Getter
@Setter
public class ObjectStorageProperties {
    public enum Provider {
        MINIO,
        S3
    }
    private Provider provider;
    private String endpoint;
    private String accessKey;
    private String secretKey;
    private String bucketName;
    private Integer presignedUrlExpirationMinutes;
    private String region;
}
