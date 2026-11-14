package blog.demo.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import blog.demo.system.domain.BlogComment;

@Mapper
public interface BlogCommentMapper extends BaseMapper<BlogComment> {
}
