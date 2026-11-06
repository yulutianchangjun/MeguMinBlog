package xyz.cy666.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("blog_post")
public class BlogPost {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String slug;
    private String title;
    private String subtitle;
    private String excerpt;
    private String tags;
    private String content;
    private String cover;
    /** published / hidden / draft */
    private String status;
    private Boolean pinned;
    private Integer views;
    private LocalDate publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
