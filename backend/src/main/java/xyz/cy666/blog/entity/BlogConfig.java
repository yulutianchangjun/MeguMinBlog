package xyz.cy666.blog.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("blog_config")
public class BlogConfig {
    @TableId
    private String configKey;
    private String configValue;
}
