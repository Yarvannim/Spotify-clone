package com.yarvannim.stream_service.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class PrivacyPreferencesResponse {
    private UUID userId;
    private Boolean dataProcessingConsent;
    private Boolean dataSharingConsent;
    private Boolean marketingConsent;
    private Instant consentGivenAt;
    private Instant preferencesUpdatedAt;
}
