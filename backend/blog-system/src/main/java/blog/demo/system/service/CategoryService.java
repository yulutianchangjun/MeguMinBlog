package blog.demo.system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import blog.demo.common.dto.CategoryView;
import blog.demo.system.domain.BlogCategory;
import blog.demo.system.mapper.BlogCategoryMapper;
import blog.demo.system.mapper.BlogPostMapper;

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
