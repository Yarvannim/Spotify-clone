package com.yarvannim.stream_service.business.implementation;

import com.yarvannim.stream_service.domain.entity.User;
import com.yarvannim.stream_service.dto.responses.UserResponse;
import com.yarvannim.stream_service.repository.UserPrivacyPreferencesReposity;
import com.yarvannim.stream_service.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

import static com.yarvannim.stream_service.business.utils.AuthUtils.extractUserIdFromAuthentication;

@AllArgsConstructor
@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserPrivacyPreferencesReposity userPrivacyPreferencesReposity;


    public Mono<User> syncUserFromKeycloak(Authentication authentication){
        if (!(authentication instanceof JwtAuthenticationToken jwtToken)) {
            return Mono.error(new RuntimeException("Invalid authentication type"));
        }

        String userIdStr = jwtToken.getToken().getClaimAsString("sub");
        String username = jwtToken.getToken().getClaimAsString("preferred_username");
        String displayName = jwtToken.getToken().getClaimAsString("name");

        Boolean isArtist = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ARTIST"));

        UUID userId = UUID.fromString(userIdStr);

        return userRepository.findByUserId(userId)
                .flatMap(existingUser -> {
                    if (!existingUser.getDisplayName().equals(displayName) || !existingUser.getIsArtist().equals(isArtist)) {
                        existingUser.setDisplayName(displayName);
                        existingUser.setIsArtist(isArtist);
                        existingUser.setUpdatedAt(Instant.now());
                        existingUser.setLastActiveAt(Instant.now());
                        return userRepository.save(existingUser);
                    }
                    return Mono.just(existingUser);
                })
                .switchIfEmpty(Mono.defer(() -> {
                    User newUser = new User(
                            userId,
                            username,
                            displayName,
                            isArtist,
                            Instant.now(),
                            Instant.now(),
                            Instant.now()
                    );
                    return userRepository.save(newUser);
                }));
    }

    public Mono<UserResponse> getUserByUserId(UUID userId){
        return userRepository.findByUserId(userId)
                .map(this::toUserResponse)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")));
    }

    public Mono<UserResponse> getCurrentUser(Authentication authentication){
        UUID userId = extractUserIdFromAuthentication(authentication);
        return getUserByUserId(userId);
    }

    public Mono<UserResponse> updateDisplayName(Authentication authentication, String displayName){
        UUID userId = extractUserIdFromAuthentication(authentication);
        return userRepository.findByUserId(userId)
                .flatMap(user -> {
                    user.setDisplayName(displayName);
                    user.setUpdatedAt(Instant.now());
                    return userRepository.save(user);
                })
                .map(this::toUserResponse)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")));
    }

    public Mono<Void> deleteCurrentUser(Authentication authentication){
        UUID userId = extractUserIdFromAuthentication(authentication);
        return userRepository.findByUserId(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found for deletion")))
                .flatMap(user -> userRepository.deleteUser(userId))
                .then();
    }

    public Mono<Boolean> isArtist(UUID userId){
        return userRepository.findByUserId(userId)
                .map(User::getIsArtist)
                .defaultIfEmpty(false);
    }

    public UserResponse toUserResponse(User user){
        return new UserResponse(
                user.getUserId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getIsArtist(),
                user.getCreatedAt().toString()
        );
    }
}
