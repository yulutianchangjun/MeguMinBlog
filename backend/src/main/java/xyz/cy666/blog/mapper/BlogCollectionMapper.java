package xyz.cy666.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import xyz.cy666.blog.entity.BlogCollection;

public interface BlogCollectionMapper extends BaseMapper<BlogCollection> {

    @Select("""
            SELECT COUNT(*) FROM blog_post_collection pc
            JOIN blog_post p ON p.id = pc.post_id
            WHERE pc.collection_id = #{id} AND p.status = 'published'
            """)
    long countPublishedPosts(@Param("id") Long id);
}
