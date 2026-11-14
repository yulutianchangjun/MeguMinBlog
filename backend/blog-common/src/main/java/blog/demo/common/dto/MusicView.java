package blog.demo.common.dto;

import java.time.LocalDateTime;

public record MusicView(
        Long id,
        String title,
        String artist,
        String cover,
        String url,
        String kind,
        Long size,
        Integer sort,
        LocalDateTime createdAt) {
}
