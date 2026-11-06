package xyz.cy666.blog.dto;

public record AnniversaryView(
        Long id,
        String label,
        String date,
        String note,
        Integer sort) {
}
