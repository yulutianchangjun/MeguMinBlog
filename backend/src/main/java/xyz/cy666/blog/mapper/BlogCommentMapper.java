package xyz.cy666.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import xyz.cy666.blog.entity.BlogComment;

@Mapper
public interface BlogCommentMapper extends BaseMapper<BlogComment> {
}
