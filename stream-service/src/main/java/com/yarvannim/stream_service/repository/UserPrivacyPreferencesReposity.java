package com.yarvannim.stream_service.repository;

import com.yarvannim.stream_service.domain.entity.UserPrivacyPreferences;
import org.springframework.data.cassandra.repository.Query;
import org.springframework.data.cassandra.repository.ReactiveCassandraRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserPrivacyPreferencesReposity extends ReactiveCassandraRepository<UserPrivacyPreferences, UUID> {

    @Query("SELECT * FROM user_privacy_preferences WHERE userId = ?0")
    Mono<UserPrivacyPreferences> findByUserId(UUID userId);
}
