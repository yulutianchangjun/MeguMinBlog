package xyz.cy666.blog.dto;

import java.time.LocalDateTime;

public record CommentView(
        Long id,
        Long postId,
        String author,
        String content,
        String status,
        LocalDateTime createdAt) {
}
