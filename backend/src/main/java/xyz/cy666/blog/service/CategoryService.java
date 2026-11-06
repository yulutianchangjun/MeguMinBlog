package xyz.cy666.blog.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.cy666.blog.dto.CategoryView;
import xyz.cy666.blog.entity.BlogCategory;
import xyz.cy666.blog.mapper.BlogCategoryMapper;
import xyz.cy666.blog.mapper.BlogPostMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final BlogCategoryMapper categoryMapper;
    private final BlogPostMapper postMapper;

    public List<CategoryView> list() {
        List<BlogCategory> categories = categoryMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<BlogCategory>()
                        .orderByAsc("sort").orderByAsc("id"));
        return categories.stream()
                .map(c -> new CategoryView(c.getName(), postMapper.countPublishedByCategory(c.getName())))
                .filter(item -> item.count() > 0)
                .toList();
    }
}
