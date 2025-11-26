package com.yarvannim.stream_service.dto.requests;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class PrivacyPreferencesUpdateRequest {
    private Boolean allowMarketingEmails;
    private Boolean allowDataProcessing;
    private Boolean allowDataSharing;
}
