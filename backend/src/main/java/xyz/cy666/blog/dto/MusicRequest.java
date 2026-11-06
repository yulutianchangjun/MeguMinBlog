package xyz.cy666.blog.dto;

import lombok.Data;

@Data
public class MusicRequest {
    private String title;
    private String artist;
    private String cover;
    private String url;
    private String kind;
    private Long size;
    private Integer sort;
}
