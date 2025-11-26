package com.yarvannim.stream_service.controller;

import com.yarvannim.stream_service.business.implementation.GdprComplianceService;
import com.yarvannim.stream_service.domain.entity.UserPrivacyPreferences;
import com.yarvannim.stream_service.dto.requests.PrivacyPreferencesUpdateRequest;
import com.yarvannim.stream_service.dto.responses.PrivacyPreferencesResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Slf4j
@Controller
@AllArgsConstructor
@RequestMapping("/api/users/privacy")
public class UserPrivacyController {
    private final GdprComplianceService gdprComplianceService;

    @GetMapping("/preferences")
    public Mono<ResponseEntity<PrivacyPreferencesResponse>> getPrivacyPreferences(Authentication authentication){
        return gdprComplianceService.getPrivacyPreferences(authentication)
                .map(this::toPrivacyPreferencesResponse)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> {
                    log.error("Error retrieving user privacy preferences: {}", error.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    @PutMapping("/preferences")
    public Mono<ResponseEntity<PrivacyPreferencesResponse>> updatePrivacyPreferences(Authentication authentication, @RequestBody PrivacyPreferencesUpdateRequest request){
        return gdprComplianceService.updatePrivacyPreferences(authentication, request)
                .map(this::toPrivacyPreferencesResponse)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> {
                    log.error("Error updating user privacy preferences: {}", error.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    @PostMapping("/withdraw-consent")
    public Mono<ResponseEntity<String>> withdrawConsent(Authentication authentication){
        return gdprComplianceService.withdrawConsent(authentication)
                .thenReturn(ResponseEntity.ok("Consent withdrawn"))
                .onErrorResume(error -> {
                    log.error("Error withdrawing user consent: {}", error.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    private PrivacyPreferencesResponse toPrivacyPreferencesResponse(UserPrivacyPreferences privacyPreferences){
        return new PrivacyPreferencesResponse(
                privacyPreferences.getUserId(),
                privacyPreferences.getAllowDataProcessing(),
                privacyPreferences.getAllowDataSharing(),
                privacyPreferences.getAllowMarketingEmails(),
                privacyPreferences.getConsertGivenAt(),
                privacyPreferences.getPreferencesUpdatedAt()
        );
    }
}
