package xyz.cy666.blog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import xyz.cy666.blog.entity.BlogPost;

import java.util.List;

public interface BlogPostMapper extends BaseMapper<BlogPost> {

    @Select("""
            SELECT p.id FROM blog_post p
            JOIN blog_post_category pc ON pc.post_id = p.id
            JOIN blog_category c ON c.id = pc.category_id
            WHERE c.name = #{name}
            """)
    List<Long> selectIdsByCategory(@Param("name") String name);

    @Select("""
            SELECT c.name FROM blog_category c
            JOIN blog_post_category pc ON pc.category_id = c.id
            WHERE pc.post_id = #{postId}
            ORDER BY c.sort, c.id
            """)
    List<String> selectCategoryNames(@Param("postId") Long postId);

    @Select("""
            SELECT col.slug FROM blog_collection col
            JOIN blog_post_collection pc ON pc.collection_id = col.id
            WHERE pc.post_id = #{postId}
            ORDER BY col.sort, col.id
            """)
    List<String> selectCollectionSlugs(@Param("postId") Long postId);

    @Select("""
            SELECT col.id FROM blog_collection col
            JOIN blog_post_collection pc ON pc.collection_id = col.id
            WHERE pc.post_id = #{postId}
            ORDER BY col.sort, col.id
            """)
    List<Long> selectCollectionIds(@Param("postId") Long postId);

    @Select("""
            SELECT p.* FROM blog_post p
            JOIN blog_post_collection pc ON pc.post_id = p.id
            JOIN blog_collection col ON col.id = pc.collection_id
            WHERE col.slug = #{slug} AND p.status = 'published'
            ORDER BY p.published_at DESC, p.id DESC
            """)
    List<BlogPost> selectPublishedByCollection(@Param("slug") String slug);

    @Select("""
            SELECT COUNT(*) FROM blog_post p
            JOIN blog_post_category pc ON pc.post_id = p.id
            JOIN blog_category c ON c.id = pc.category_id
            WHERE c.name = #{name} AND p.status = 'published'
            """)
    long countPublishedByCategory(@Param("name") String name);
}
