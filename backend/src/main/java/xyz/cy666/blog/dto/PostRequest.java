package xyz.cy666.blog.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class PostRequest {
    private Long id;
    private String slug;
    private String title;
    private String subtitle;
    private String excerpt;
    private List<String> tags = new ArrayList<>();
    private String content;
    private String cover;
    /** published / hidden / draft */
    private String status;
    private Boolean pinned;
    private LocalDate publishedAt;
    private List<String> categories = new ArrayList<>();
    private List<String> collections = new ArrayList<>();
}
