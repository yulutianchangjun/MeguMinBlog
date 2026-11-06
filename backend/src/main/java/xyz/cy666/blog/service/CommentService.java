package xyz.cy666.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.dto.CommentRequest;
import xyz.cy666.blog.dto.CommentView;
import xyz.cy666.blog.entity.BlogComment;
import xyz.cy666.blog.entity.BlogPost;
import xyz.cy666.blog.mapper.BlogCommentMapper;
import xyz.cy666.blog.mapper.BlogPostMapper;
import xyz.cy666.blog.security.RateLimiter;
import xyz.cy666.blog.security.TurnstileService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final BlogCommentMapper commentMapper;
    private final BlogPostMapper postMapper;
    private final RateLimiter rateLimiter;
    private final TurnstileService turnstileService;

    /** 文章下的已通过评论（正序展示，像楼层） */
    public List<CommentView> listBySlug(String slug) {
        BlogPost post = postMapper.selectOne(new QueryWrapper<BlogPost>().eq("slug", slug));
        if (post == null) {
            throw BizException.notFound("文章不存在");
        }
        return commentMapper.selectList(new QueryWrapper<BlogComment>()
                        .eq("post_id", post.getId())
                        .eq("status", "approved")
                        .orderByAsc("created_at")
                        .last("LIMIT 500"))
                .stream().map(this::toView).toList();
    }

    public CommentView create(String slug, CommentRequest request, String ip) {
        BlogPost post = postMapper.selectOne(new QueryWrapper<BlogPost>().eq("slug", slug)
                .eq("status", "published"));
        if (post == null) {
            throw BizException.notFound("文章不存在或未发布");
        }
        rateLimiter.checkComment(ip);
        turnstileService.verify(request.turnstileToken(), ip);

        String author = sanitize(request.author());
        String content = sanitize(request.content());
        if (author.length() < 2 || content.length() < 2) {
            throw new BizException("评论内容过于简单");
        }

        BlogComment comment = new BlogComment();
        comment.setPostId(post.getId());
        comment.setAuthor(author);
        comment.setContent(content);
        comment.setIp(ip);
        comment.setStatus("approved");
        comment.setCreatedAt(LocalDateTime.now());
        commentMapper.insert(comment);
        return toView(comment);
    }

    public List<CommentView> listAll() {
        return commentMapper.selectList(new QueryWrapper<BlogComment>()
                        .orderByDesc("created_at")
                        .last("LIMIT 500"))
                .stream().map(this::toView).toList();
    }

    public void delete(Long id) {
        if (commentMapper.deleteById(id) == 0) {
            throw BizException.notFound("这条评论不存在");
        }
    }

    private CommentView toView(BlogComment comment) {
        return new CommentView(
                comment.getId(),
                comment.getPostId(),
                comment.getAuthor(),
                comment.getContent(),
                comment.getStatus(),
                comment.getCreatedAt());
    }

    /** 去除所有 HTML 标签并转义特殊字符，防 Stored XSS */
    private String sanitize(String input) {
        if (!StringUtils.hasText(input)) {
            return "";
        }
        return Jsoup.clean(input, Safelist.none()).trim();
    }
}
