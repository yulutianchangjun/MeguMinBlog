package xyz.cy666.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("blog_message_board")
public class BlogMessage {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String author;
    private String content;
    /** top / left / right */
    private String wall;
    private String bgColor;
    private String fontColor;
    private String texture;
    private Double rotation;
    private Boolean pinned;
    private String ip;
    /** approved / hidden */
    private String status;
    private LocalDateTime createdAt;
}
