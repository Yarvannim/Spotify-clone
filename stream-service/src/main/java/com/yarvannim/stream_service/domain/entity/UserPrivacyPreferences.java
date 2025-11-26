package com.yarvannim.stream_service.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("user_privacy_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserPrivacyPreferences {
    @PrimaryKey
    private UUID userId;
    private Boolean allowMarketingEmails;
    private Boolean allowDataProcessing;
    private Boolean allowDataSharing;
    private Instant consertGivenAt;
    private Instant preferencesUpdatedAt;

    public static UserPrivacyPreferences createDefault(UUID userId){
        Instant now = Instant.now();
        return new UserPrivacyPreferences(
                userId,
                false,
                false,
                false,
                null,
                now
        );
    }
}
