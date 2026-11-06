package xyz.cy666.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("blog_anniversary")
public class BlogAnniversary {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String label;
    /** MM-DD 形式的纪念日日期，每年循环 */
    private String memorialDate;
    private String note;
    private Integer sort;
    private LocalDateTime createdAt;
}
