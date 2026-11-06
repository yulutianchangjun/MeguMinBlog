package xyz.cy666.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("blog_comment")
public class BlogComment {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long postId;
    private String author;
    private String content;
    private String ip;
    /** approved / hidden */
    private String status;
    private LocalDateTime createdAt;
}
