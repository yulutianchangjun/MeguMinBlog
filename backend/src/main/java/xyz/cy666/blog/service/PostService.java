package xyz.cy666.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.dto.PostDetail;
import xyz.cy666.blog.dto.PostRequest;
import xyz.cy666.blog.dto.PostSummary;
import xyz.cy666.blog.entity.BlogCategory;
import xyz.cy666.blog.entity.BlogCollection;
import xyz.cy666.blog.entity.BlogPost;
import xyz.cy666.blog.mapper.BlogCategoryMapper;
import xyz.cy666.blog.mapper.BlogCollectionMapper;
import xyz.cy666.blog.mapper.BlogPostMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PostService {

    private final BlogPostMapper postMapper;
    private final BlogCategoryMapper categoryMapper;
    private final BlogCollectionMapper collectionMapper;
    private final JdbcTemplate jdbc;

    // ---------- 公开读取 ----------

    public List<PostSummary> listPublished(String category, String keyword, String sort) {
        QueryWrapper<BlogPost> wrapper = new QueryWrapper<>();
        wrapper.eq("status", "published");

        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim();
            wrapper.and(q -> q.like("title", kw).or().like("subtitle", kw).or().like("excerpt", kw));
        }
        if (StringUtils.hasText(category)) {
            List<Long> ids = postMapper.selectIdsByCategory(category.trim());
            if (ids.isEmpty()) {
                return List.of();
            }
            wrapper.in("id", ids);
        }

        switch (sort == null ? "new" : sort) {
            case "old" -> wrapper.orderByAsc("published_at").orderByAsc("id");
            case "hot" -> wrapper.orderByDesc("views").orderByDesc("published_at");
            default -> wrapper.orderByDesc("pinned").orderByDesc("published_at").orderByDesc("id");
        }
        return postMapper.selectList(wrapper).stream().map(this::toSummary).toList();
    }

    public PostDetail detail(String slug, boolean includeUnpublished) {
        BlogPost post = postMapper.selectOne(new QueryWrapper<BlogPost>().eq("slug", slug).last("LIMIT 1"));
        if (post == null) {
            throw BizException.notFound("这篇手记不存在");
        }
        if (!includeUnpublished && !"published".equals(post.getStatus())) {
            throw BizException.notFound("这篇手记不存在");
        }
        return toDetail(post);
    }

    public List<PostSummary> listAll() {
        return postMapper.selectList(new QueryWrapper<BlogPost>()
                        .orderByDesc("pinned").orderByDesc("published_at").orderByDesc("id"))
                .stream().map(this::toSummary).toList();
    }

    public List<PostSummary> listByCollection(String slug) {
        return postMapper.selectPublishedByCollection(slug).stream().map(this::toSummary).toList();
    }

    public void incrementViews(Long id) {
        jdbc.update("UPDATE blog_post SET views = views + 1 WHERE id = ?", id);
    }

    // ---------- 博主写入 ----------

    @Transactional
    public PostDetail save(PostRequest request) {
        if (!StringUtils.hasText(request.getTitle())) {
            throw new BizException("标题不能为空");
        }
        if (!StringUtils.hasText(request.getContent())) {
            throw new BizException("正文不能为空");
        }
        String status = normalizeStatus(request.getStatus());

        BlogPost post;
        if (request.getId() != null) {
            post = postMapper.selectById(request.getId());
            if (post == null) {
                throw BizException.notFound("要修改的文章不存在");
            }
        } else {
            post = new BlogPost();
            post.setViews(0);
            post.setCreatedAt(LocalDateTime.now());
        }

        post.setTitle(request.getTitle().trim());
        post.setSubtitle(trimToNull(request.getSubtitle()));
        post.setExcerpt(StringUtils.hasText(request.getExcerpt())
                ? request.getExcerpt().trim()
                : buildExcerpt(request.getContent()));
        post.setTags(request.getTags() == null ? null : String.join(",", request.getTags()));
        post.setContent(request.getContent());
        post.setCover(trimToNull(request.getCover()));
        post.setStatus(status);
        post.setPinned(Boolean.TRUE.equals(request.getPinned()));
        post.setPublishedAt(request.getPublishedAt() == null ? LocalDate.now() : request.getPublishedAt());
        // slug：新建时用请求值/标题生成；更新时未显式传 slug 则沿用原值，避免编辑保存后链接失效
        String requestedSlug = request.getSlug();
        if (!StringUtils.hasText(requestedSlug) && post.getId() != null && StringUtils.hasText(post.getSlug())) {
            requestedSlug = post.getSlug();
        }
        post.setSlug(uniqueSlug(requestedSlug, post.getTitle(), post.getId()));
        post.setUpdatedAt(LocalDateTime.now());

        if (post.getId() == null) {
            postMapper.insert(post);
        } else {
            postMapper.updateById(post);
        }

        saveCategories(post.getId(), request.getCategories());
        saveCollections(post.getId(), request.getCollections());
        return toDetail(postMapper.selectById(post.getId()));
    }

    @Transactional
    public void delete(Long id) {
        if (postMapper.selectById(id) == null) {
            throw BizException.notFound("文章不存在");
        }
        jdbc.update("DELETE FROM blog_post_category WHERE post_id = ?", id);
        jdbc.update("DELETE FROM blog_post_collection WHERE post_id = ?", id);
        postMapper.deleteById(id);
    }

    public PostSummary updateFlags(Long id, Boolean pinned, String status) {
        BlogPost post = postMapper.selectById(id);
        if (post == null) {
            throw BizException.notFound("文章不存在");
        }
        if (pinned != null) {
            post.setPinned(pinned);
        }
        if (StringUtils.hasText(status)) {
            post.setStatus(normalizeStatus(status));
        }
        post.setUpdatedAt(LocalDateTime.now());
        postMapper.updateById(post);
        return toSummary(post);
    }

    // ---------- 映射与工具 ----------

    private PostSummary toSummary(BlogPost post) {
        return new PostSummary(
                post.getId(),
                post.getSlug(),
                post.getTitle(),
                post.getSubtitle(),
                post.getExcerpt(),
                splitTags(post.getTags()),
                post.getContent(),
                post.getCover(),
                Boolean.TRUE.equals(post.getPinned()),
                post.getStatus(),
                post.getPublishedAt(),
                post.getViews() == null ? 0 : post.getViews(),
                postMapper.selectCategoryNames(post.getId()),
                postMapper.selectCollectionSlugs(post.getId()));
    }

    private PostDetail toDetail(BlogPost post) {
        BlogPost prev = null;
        BlogPost next = null;
        if (post.getPublishedAt() != null) {
            prev = postMapper.selectOne(new QueryWrapper<BlogPost>()
                    .eq("status", "published")
                    .ne("id", post.getId())
                    .lt("published_at", post.getPublishedAt())
                    .orderByDesc("published_at").orderByDesc("id")
                    .last("LIMIT 1"));
            next = postMapper.selectOne(new QueryWrapper<BlogPost>()
                    .eq("status", "published")
                    .ne("id", post.getId())
                    .gt("published_at", post.getPublishedAt())
                    .orderByAsc("published_at").orderByAsc("id")
                    .last("LIMIT 1"));
        }

        return new PostDetail(
                post.getId(),
                post.getSlug(),
                post.getTitle(),
                post.getSubtitle(),
                post.getExcerpt(),
                splitTags(post.getTags()),
                post.getContent(),
                post.getCover(),
                Boolean.TRUE.equals(post.getPinned()),
                post.getStatus(),
                post.getPublishedAt(),
                post.getViews() == null ? 0 : post.getViews(),
                postMapper.selectCategoryNames(post.getId()),
                postMapper.selectCollectionSlugs(post.getId()),
                prev == null ? null : prev.getSlug(),
                prev == null ? null : prev.getTitle(),
                next == null ? null : next.getSlug(),
                next == null ? null : next.getTitle());
    }

    private void saveCategories(Long postId, List<String> names) {
        jdbc.update("DELETE FROM blog_post_category WHERE post_id = ?", postId);
        if (names == null) {
            return;
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String name : names) {
            if (StringUtils.hasText(name)) {
                unique.add(name.trim());
            }
        }
        int sort = 0;
        for (String name : unique) {
            BlogCategory category = categoryMapper.selectOne(
                    new QueryWrapper<BlogCategory>().eq("name", name).last("LIMIT 1"));
            if (category == null) {
                category = new BlogCategory();
                category.setName(name);
                category.setSlug("cat-" + Math.abs(name.hashCode()));
                category.setSort(sort);
                categoryMapper.insert(category);
            }
            jdbc.update("INSERT IGNORE INTO blog_post_category(post_id, category_id) VALUES (?, ?)",
                    postId, category.getId());
            sort += 1;
        }
    }

    private void saveCollections(Long postId, List<String> slugs) {
        jdbc.update("DELETE FROM blog_post_collection WHERE post_id = ?", postId);
        if (slugs == null) {
            return;
        }
        Set<String> unique = new LinkedHashSet<>(slugs.stream().filter(StringUtils::hasText).toList());
        for (String slug : unique) {
            BlogCollection collection = collectionMapper.selectOne(
                    new QueryWrapper<BlogCollection>().eq("slug", slug.trim()).last("LIMIT 1"));
            if (collection != null) {
                jdbc.update("INSERT IGNORE INTO blog_post_collection(post_id, collection_id) VALUES (?, ?)",
                        postId, collection.getId());
            }
        }
    }

    private String uniqueSlug(String requested, String title, Long id) {
        String base = StringUtils.hasText(requested) ? requested.trim() : asciiSlug(title);
        base = base.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]+", "-")
                .replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
        if (!StringUtils.hasText(base)) {
            base = "post-" + System.currentTimeMillis();
        }
        String candidate = base;
        int index = 2;
        while (true) {
            QueryWrapper<BlogPost> wrapper = new QueryWrapper<BlogPost>().eq("slug", candidate);
            if (id != null) {
                wrapper.ne("id", id);
            }
            Long count = postMapper.selectCount(wrapper);
            if (count == null || count == 0) {
                return candidate;
            }
            candidate = base + "-" + index++;
        }
    }

    private String asciiSlug(String title) {
        if (title == null) {
            return "";
        }
        return title.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }

    private String normalizeStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return "published";
        }
        return switch (status) {
            case "hidden", "draft" -> status;
            default -> "published";
        };
    }

    private String buildExcerpt(String content) {
        String text = content.replaceAll("[#>*`\\-\\n]", " ").trim();
        return text.length() > 90 ? text.substring(0, 90) : text;
    }

    private List<String> splitTags(String tags) {
        if (!StringUtils.hasText(tags)) {
            return List.of();
        }
        List<String> list = new ArrayList<>();
        for (String item : tags.split(",")) {
            if (StringUtils.hasText(item)) {
                list.add(item.trim());
            }
        }
        return list;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
