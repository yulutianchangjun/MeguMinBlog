package xyz.cy666.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("blog_music")
public class BlogMusic {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String artist;
    private String cover;
    private String url;
    /** file / url / synth */
    private String kind;
    private Long size;
    private Integer sort;
    private LocalDateTime createdAt;
}
