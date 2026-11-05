package xyz.cy666.blog.dto;

import java.time.LocalDateTime;

public record MessageView(
        Long id,
        String author,
        String content,
        String wall,
        String bgColor,
        String fontColor,
        String texture,
        Double rotation,
        Boolean pinned,
        String status,
        LocalDateTime createdAt) {
}
