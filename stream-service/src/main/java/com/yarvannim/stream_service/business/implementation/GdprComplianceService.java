package com.yarvannim.stream_service.business.implementation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yarvannim.stream_service.domain.entity.User;
import com.yarvannim.stream_service.domain.entity.UserPrivacyPreferences;
import com.yarvannim.stream_service.dto.requests.PrivacyPreferencesUpdateRequest;
import com.yarvannim.stream_service.repository.UserPrivacyPreferencesReposity;
import com.yarvannim.stream_service.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static com.yarvannim.stream_service.business.utils.AuthUtils.extractUserIdFromAuthentication;

@Slf4j
@AllArgsConstructor
@Service
public class GdprComplianceService {
    private final UserRepository userRepository;
    private static final Integer INACTIVITY_PERIOD_YEARS = 2;
    private final UserPrivacyPreferencesReposity userPrivacyPreferencesReposity;

    @Scheduled(cron = "0 0 2 * * ?")
    public void deleteInactiveUsers(){
        Instant cutOffDate = Instant.now().minus(INACTIVITY_PERIOD_YEARS, ChronoUnit.YEARS);

        userRepository.findUsersByInactiveSince(cutOffDate)
                .flatMap(this::deleteUserAndAssociatedData)
                .collectList()
                .subscribe(deletedUsers -> {
                    if (!deletedUsers.isEmpty()) {
                        log.info("GDPR inactive users cleanup completed. Deleted {} inactive users.", deletedUsers.size());
                    } else {
                        log.info("GDPR inactive users cleanup completed. No users to delete.");
                    }
                }, error -> log.error("GDPR inactive users cleanup failed.", error));
    }

    public Mono<byte[]> exportUserData(Authentication authentication){
        UUID userId = extractUserIdFromAuthentication(authentication);

        return userRepository.findByUserId(userId)
                .flatMap(user -> {
                    try {
                        return userPrivacyPreferencesReposity.findByUserId(userId)
                                .defaultIfEmpty(UserPrivacyPreferences.createDefault(userId))
                                .mapNotNull(userPrivacyPreferences -> createUserDataExport(user, userPrivacyPreferences))
                                .doOnSuccess(data -> log.info("Successfully exported user data for user :{}", userId))
                                .doOnError(error -> log.error("Failed to export user data for user {}: {}", userId, error.getMessage()));
                    } catch (Exception e) {
                        return Mono.error(new RuntimeException("Error processing user data"));
                    }
                });
    }

    public Mono<UserPrivacyPreferences> getPrivacyPreferences(Authentication authentication){
        UUID userId = extractUserIdFromAuthentication(authentication);
        return userPrivacyPreferencesReposity.findByUserId(userId)
                .switchIfEmpty(Mono.defer(() -> {
                    UserPrivacyPreferences defaultPreferences = UserPrivacyPreferences.createDefault(userId);
                    return userPrivacyPreferencesReposity.save(defaultPreferences);
                }));
    }

    public Mono<UserPrivacyPreferences> updatePrivacyPreferences(Authentication authentication, PrivacyPreferencesUpdateRequest request){
        UUID userId = extractUserIdFromAuthentication(authentication);
        UserPrivacyPreferences newPrivacyPreferences = fromUpdateRequestToObject(request);
        return getPrivacyPreferences(authentication)
                .flatMap(existingPrivacyPreferences -> {
                    newPrivacyPreferences.setUserId(userId);
                    newPrivacyPreferences.setPreferencesUpdatedAt(Instant.now());

                    if (newPrivacyPreferences.getAllowDataProcessing() || !existingPrivacyPreferences.getAllowDataProcessing()) {
                        newPrivacyPreferences.setConsertGivenAt(Instant.now());
                    } else {
                        newPrivacyPreferences.setConsertGivenAt(existingPrivacyPreferences.getConsertGivenAt());
                    }
                    return userPrivacyPreferencesReposity.save(newPrivacyPreferences);
                });
    }

    public Mono<UserPrivacyPreferences> withdrawConsent(Authentication authentication){
        return getPrivacyPreferences(authentication)
                .flatMap(userPrivacyPreferences -> {
                    userPrivacyPreferences.setAllowDataProcessing(false);
                    userPrivacyPreferences.setAllowDataSharing(false);
                    userPrivacyPreferences.setAllowDataSharing(false);
                    userPrivacyPreferences.setPreferencesUpdatedAt(Instant.now());
                    return userPrivacyPreferencesReposity.save(userPrivacyPreferences);
                });
    }

    public Mono<Boolean> canProcessUserData(Authentication authentication){
        return getPrivacyPreferences(authentication)
                .map(UserPrivacyPreferences::getAllowDataProcessing)
                .defaultIfEmpty(false);
    }

    private byte[] createUserDataExport(User user, UserPrivacyPreferences privacyPreferences){
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> userData = new HashMap<>();

        userData.put("user", user);
        userData.put("privacyPreferences", privacyPreferences);
        userData.put("exportedAt", Instant.now());

        try {
            return mapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(userData)
                    .getBytes(StandardCharsets.UTF_8);
        } catch (JsonProcessingException e) {
            log.error("Error processing user data export: {}", e.getMessage());
        }
        return null;
    }

    private UserPrivacyPreferences fromUpdateRequestToObject(PrivacyPreferencesUpdateRequest request){
        return new UserPrivacyPreferences(
                null,
                request.getAllowMarketingEmails(),
                request.getAllowDataProcessing(),
                request.getAllowDataSharing(),
                null,
                null

        );
    }

    private Mono<User> deleteUserAndAssociatedData(User user){
        return userRepository.deleteUser(user.getUserId())
                .doOnSuccess(_ -> log.debug("Successfully deleted user :{}", user.getUserId()))
                .doOnError(error -> log.error("Failed to delete user {}: {}", user.getUserId(), error.getMessage()))
                .thenReturn(user);
    }
}
