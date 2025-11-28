package com.yarvannim.stream_service.business.implementation;


import com.yarvannim.stream_service.domain.document.SongDocument;
import com.yarvannim.stream_service.dto.responses.SongSearchResponse;
import com.yarvannim.stream_service.repository.SongSearchRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.UUID;

@AllArgsConstructor
@Service
public class SongSearchService {
    private final SongSearchRepository songSearchRepository;

    public Flux<SongSearchResponse> fuzzySearch(String query){
        return songSearchRepository.fuzzySearch(query)
                .map(this::convertToSafeResponse)
                .onErrorResume(throwable -> {
                    System.out.println("Exception occurred while searching for song: " + throwable.getMessage());
                    return Flux.empty();
                });
    }

    private SongSearchResponse convertToSafeResponse(SongDocument songDocument){
        return new SongSearchResponse(UUID.fromString(songDocument.getId()), songDocument.getTitle(), songDocument.getArtistName());
    }
}
