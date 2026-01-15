package com.yarvannim.stream_service.business.implementation;

import com.yarvannim.stream_service.business.interfaces.ObjectStorageService;
import com.yarvannim.stream_service.config.ObjectStorageProperties;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ObjectStorageServiceFactory {
    private final ApplicationContext applicationContext;
    private final ObjectStorageProperties objectStorageProperties;

    public ObjectStorageServiceFactory(ApplicationContext applicationContext, ObjectStorageProperties objectStorageProperties) {
        this.applicationContext = applicationContext;
        this.objectStorageProperties = objectStorageProperties;
    }

    public ObjectStorageService getObjectStorageService() {
        return switch (objectStorageProperties.getProvider()){
            case MINIO -> applicationContext.getBean(MinioStorageService.class);
            case S3 -> applicationContext.getBean(S3StorageService.class);
        };
    }
}
