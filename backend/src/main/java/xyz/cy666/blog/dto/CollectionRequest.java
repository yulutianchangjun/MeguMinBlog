package xyz.cy666.blog.dto;

import lombok.Data;

@Data
public class CollectionRequest {
    private Long id;
    private String slug;
    private String title;
    private String subtitle;
    private String description;
    private String cover;
    private String runes;
    private Integer sort;
}
