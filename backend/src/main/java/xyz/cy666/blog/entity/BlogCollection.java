package xyz.cy666.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("blog_collection")
public class BlogCollection {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String slug;
    private String title;
    private String subtitle;
    private String description;
    private String cover;
    private String runes;
    private Integer sort;
}
