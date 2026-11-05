package xyz.cy666.blog.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("blog_checkin")
public class BlogCheckin {
    @TableId(type = IdType.AUTO)
    private Long id;
    private LocalDate checkinDate;
    private LocalDateTime createdAt;
}
