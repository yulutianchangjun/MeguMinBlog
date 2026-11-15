package blog.demo.system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import blog.demo.common.dto.PostLikeView;
import blog.demo.common.exception.BizException;

/**
 * 文章点赞：按 IP 去重，一人一篇一次。
 * 不做"两个浏览器各点一次"，同一 IP 再点即为取消 —— 保证计数与真实人数一致。
 */
@Service
@RequiredArgsConstructor
public class PostLikeService {

    private final JdbcTemplate jdbc;

    /** 查询某篇文章对当前 IP 的点赞状态与总数 */
    public PostLikeView status(String slug, String ip) {
        Long postId = requirePostId(slug);
        return buildView(postId, normalizeIp(ip));
    }

    /** 切换点赞：已赞则取消，未赞则点赞（唯一键保证并发下不会重复插入） */
    @Transactional
    public PostLikeView toggle(String slug, String ip) {
        Long postId = requirePostId(slug);
        String normalized = normalizeIp(ip);
        Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM blog_post_like WHERE post_id = ? AND ip = ?",
                Integer.class, postId, normalized);
        if (existing != null && existing > 0) {
            jdbc.update("DELETE FROM blog_post_like WHERE post_id = ? AND ip = ?", postId, normalized);
        } else {
            jdbc.update("INSERT IGNORE INTO blog_post_like (post_id, ip) VALUES (?, ?)", postId, normalized);
        }
        return buildView(postId, normalized);
    }

    private PostLikeView buildView(Long postId, String ip) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM blog_post_like WHERE post_id = ?", Integer.class, postId);
        Integer mine = jdbc.queryForObject(
                "SELECT COUNT(*) FROM blog_post_like WHERE post_id = ? AND ip = ?",
                Integer.class, postId, ip);
        return new PostLikeView(mine != null && mine > 0, total == null ? 0 : total);
    }

    private Long requirePostId(String slug) {
        if (!StringUtils.hasText(slug)) {
            throw new BizException("文章标识不能为空");
        }
        var ids = jdbc.query(
                "SELECT id FROM blog_post WHERE slug = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"), slug.trim());
        if (ids.isEmpty()) {
            throw BizException.notFound("这篇手记不存在");
        }
        return ids.get(0);
    }

    /** IP 可能为空（直连、健康检查），用 unknown 兜底，避免 NOT NULL 约束报错 */
    private String normalizeIp(String ip) {
        return StringUtils.hasText(ip) ? ip.trim() : "unknown";
    }
}
