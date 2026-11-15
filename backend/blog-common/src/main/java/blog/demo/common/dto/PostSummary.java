package blog.demo.common.dto;

import java.time.LocalDate;
import java.util.List;

public record PostSummary(
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
        Integer likes,
        List<String> categories,
        List<String> collections) {
}
