package blog.demo.common.dto;

public record AnniversaryView(
        Long id,
        String label,
        String date,
        String note,
        Integer sort) {
}
