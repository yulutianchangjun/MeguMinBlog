package xyz.cy666.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.dto.CollectionRequest;
import xyz.cy666.blog.dto.CollectionView;
import xyz.cy666.blog.dto.PostSummary;
import xyz.cy666.blog.entity.BlogCollection;
import xyz.cy666.blog.mapper.BlogCollectionMapper;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final BlogCollectionMapper collectionMapper;
    private final PostService postService;
    private final JdbcTemplate jdbc;

    public List<CollectionView> list() {
        return collectionMapper.selectList(new QueryWrapper<BlogCollection>()
                        .orderByAsc("sort").orderByAsc("id"))
                .stream().map(this::toView).toList();
    }

    public CollectionView detail(String slug) {
        BlogCollection collection = collectionMapper.selectOne(
                new QueryWrapper<BlogCollection>().eq("slug", slug).last("LIMIT 1"));
        if (collection == null) {
            throw BizException.notFound("这个综集不存在");
        }
        return toView(collection);
    }

    public List<PostSummary> posts(String slug) {
        return postService.listByCollection(slug);
    }

    @Transactional
    public CollectionView save(CollectionRequest request) {
        if (!StringUtils.hasText(request.getTitle())) {
            throw new BizException("综集名称不能为空");
        }
        BlogCollection collection;
        if (request.getId() != null) {
            collection = collectionMapper.selectById(request.getId());
            if (collection == null) {
                throw BizException.notFound("要修改的综集不存在");
            }
        } else {
            collection = new BlogCollection();
        }
        collection.setTitle(request.getTitle().trim());
        collection.setSubtitle(trimToNull(request.getSubtitle()));
        collection.setDescription(trimToNull(request.getDescription()));
        collection.setCover(trimToNull(request.getCover()));
        collection.setRunes(trimToNull(request.getRunes()));
        collection.setSort(request.getSort() == null ? 99 : request.getSort());
        collection.setSlug(uniqueSlug(request.getSlug(), collection.getTitle(), collection.getId()));

        if (collection.getId() == null) {
            collectionMapper.insert(collection);
        } else {
            collectionMapper.updateById(collection);
        }
        return toView(collection);
    }

    @Transactional
    public void delete(Long id) {
        if (collectionMapper.selectById(id) == null) {
            throw BizException.notFound("综集不存在");
        }
        jdbc.update("DELETE FROM blog_post_collection WHERE collection_id = ?", id);
        collectionMapper.deleteById(id);
    }

    private CollectionView toView(BlogCollection collection) {
        return new CollectionView(
                collection.getId(),
                collection.getSlug(),
                collection.getTitle(),
                collection.getSubtitle(),
                collection.getDescription(),
                collection.getCover(),
                collection.getRunes(),
                collection.getSort(),
                collectionMapper.countPublishedPosts(collection.getId()));
    }

    private String uniqueSlug(String requested, String title, Long id) {
        String base = StringUtils.hasText(requested) ? requested.trim()
                : title.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (!StringUtils.hasText(base)) {
            base = "series-" + System.currentTimeMillis();
        }
        String candidate = base;
        int index = 2;
        while (true) {
            QueryWrapper<BlogCollection> wrapper = new QueryWrapper<BlogCollection>().eq("slug", candidate);
            if (id != null) {
                wrapper.ne("id", id);
            }
            Long count = collectionMapper.selectCount(wrapper);
            if (count == null || count == 0) {
                return candidate;
            }
            candidate = base + "-" + index++;
        }
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
