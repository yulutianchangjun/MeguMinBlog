package xyz.cy666.blog.dto;

import java.time.LocalDate;
import java.util.List;

public record PostDetail(
        Long id,
        String slug,
        String title,
        String subtitle,
        String excerpt,
        List<String> tags,
        String content,
        String cover,
        Boolean pinned,
        String status,
        LocalDate publishedAt,
        Integer views,
        List<String> categories,
        List<String> collections,
        String prevSlug,
        String prevTitle,
        String nextSlug,
        String nextTitle) {
}
