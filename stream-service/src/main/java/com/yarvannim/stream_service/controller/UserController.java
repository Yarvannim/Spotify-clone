package com.yarvannim.stream_service.controller;

import com.yarvannim.stream_service.business.implementation.GdprComplianceService;
import com.yarvannim.stream_service.business.implementation.UserService;
import com.yarvannim.stream_service.domain.entity.UserPrivacyPreferences;
import com.yarvannim.stream_service.dto.requests.UserUpdateRequest;
import com.yarvannim.stream_service.dto.responses.UserResponse;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@AllArgsConstructor
@RestController
@RequestMapping("api/users")
public class UserController {
    private final UserService userService;
    private final GdprComplianceService gdprComplianceService;

    @PostMapping("/sync")
    public Mono<ResponseEntity<UserResponse>> syncUser(Authentication authentication){
        return userService.syncUserFromKeycloak(authentication)
                .map(user -> ResponseEntity.ok().body(userService.toUserResponse(user)))
                .onErrorResume(throwable -> Mono.just(ResponseEntity.badRequest().build()));
    }

    @GetMapping("/me")
    public Mono<ResponseEntity<UserResponse>> getCurrentUser(Authentication authentication){
        return userService.getCurrentUser(authentication)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> Mono.just(ResponseEntity.notFound().build()));
    }

    @PutMapping("/me/display-name")
    public Mono<ResponseEntity<UserResponse>> updateDisplayName(Authentication authentication, @RequestBody UserUpdateRequest request){
        return userService.updateDisplayName(authentication, request.getDisplayName())
                .map(ResponseEntity::ok)
                .onErrorResume(error -> Mono.just(ResponseEntity.badRequest().build()));
    }

    @GetMapping("me/is-artist")
    public Mono<ResponseEntity<Boolean>> isCurrentUserArtist(Authentication authentication){
        return userService.getCurrentUser(authentication)
                .map(UserResponse::getIsArtist)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> Mono.just(ResponseEntity.ok(false)));
    }

    @DeleteMapping("/me")
    public Mono<ResponseEntity<Void>> deleteCurrentUser(Authentication authentication){
        return userService.deleteCurrentUser(authentication)
                .then(Mono.just(ResponseEntity.noContent().<Void>build()))
                .onErrorResume(error -> Mono.just(ResponseEntity.badRequest().build()));
    }

    @GetMapping("/me/export-data")
    public Mono<ResponseEntity<byte[]>> exportUserData(Authentication authentication){
        return gdprComplianceService.exportUserData(authentication)
                .map(data -> ResponseEntity.ok().header("Content-Disposition", "attachment; filename=\"user-data.json\"").body(data))
                .onErrorResume(error -> Mono.just(ResponseEntity.internalServerError().build()));
    }
}
