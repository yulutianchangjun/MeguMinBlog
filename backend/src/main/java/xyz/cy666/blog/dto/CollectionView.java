package xyz.cy666.blog.dto;

public record CollectionView(
        Long id,
        String slug,
        String title,
        String subtitle,
        String description,
        String cover,
        String runes,
        Integer sort,
        long postCount) {
}
