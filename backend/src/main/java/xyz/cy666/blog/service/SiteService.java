package xyz.cy666.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.dto.AnniversaryRequest;
import xyz.cy666.blog.dto.AnniversaryView;
import xyz.cy666.blog.dto.SiteInfoView;
import xyz.cy666.blog.entity.BlogAnniversary;
import xyz.cy666.blog.entity.BlogConfig;
import xyz.cy666.blog.mapper.BlogAnniversaryMapper;
import xyz.cy666.blog.mapper.BlogConfigMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteService {

    public static final String KEY_START_DATE = "site.start-date";
    private static final String DEFAULT_START_DATE = "2026-11-05";

    private final BlogAnniversaryMapper anniversaryMapper;
    private final BlogConfigMapper configMapper;

    public SiteInfoView info() {
        return new SiteInfoView(getStartDate(), listAnniversaries());
    }

    public String getStartDate() {
        BlogConfig config = configMapper.selectById(KEY_START_DATE);
        if (config != null && StringUtils.hasText(config.getConfigValue())) {
            return config.getConfigValue().trim();
        }
        return DEFAULT_START_DATE;
    }

    public void updateStartDate(String startDate) {
        if (!StringUtils.hasText(startDate)) {
            throw new BizException("开站日期不能为空");
        }
        try {
            LocalDate.parse(startDate.trim());
        } catch (Exception e) {
            throw new BizException("开站日期格式应为 YYYY-MM-DD");
        }
        BlogConfig config = configMapper.selectById(KEY_START_DATE);
        if (config == null) {
            config = new BlogConfig();
            config.setConfigKey(KEY_START_DATE);
            config.setConfigValue(startDate.trim());
            configMapper.insert(config);
        } else {
            config.setConfigValue(startDate.trim());
            configMapper.updateById(config);
        }
    }

    public List<AnniversaryView> listAnniversaries() {
        return anniversaryMapper.selectList(new QueryWrapper<BlogAnniversary>()
                        .orderByAsc("sort").orderByAsc("id"))
                .stream().map(this::toView).toList();
    }

    public AnniversaryView createAnniversary(AnniversaryRequest request) {
        validate(request);
        BlogAnniversary anniversary = new BlogAnniversary();
        anniversary.setLabel(request.getLabel().trim());
        anniversary.setMemorialDate(request.getDate().trim());
        anniversary.setNote(StringUtils.hasText(request.getNote()) ? request.getNote().trim() : "");
        anniversary.setSort(request.getSort() == null ? 99 : request.getSort());
        anniversary.setCreatedAt(LocalDateTime.now());
        anniversaryMapper.insert(anniversary);
        return toView(anniversary);
    }

    public AnniversaryView updateAnniversary(Long id, AnniversaryRequest request) {
        validate(request);
        BlogAnniversary anniversary = anniversaryMapper.selectById(id);
        if (anniversary == null) {
            throw BizException.notFound("纪念日不存在");
        }
        anniversary.setLabel(request.getLabel().trim());
        anniversary.setMemorialDate(request.getDate().trim());
        anniversary.setNote(StringUtils.hasText(request.getNote()) ? request.getNote().trim() : "");
        if (request.getSort() != null) {
            anniversary.setSort(request.getSort());
        }
        anniversaryMapper.updateById(anniversary);
        return toView(anniversary);
    }

    public void deleteAnniversary(Long id) {
        if (anniversaryMapper.deleteById(id) == 0) {
            throw BizException.notFound("纪念日不存在");
        }
    }

    private void validate(AnniversaryRequest request) {
        if (request == null || !StringUtils.hasText(request.getLabel())) {
            throw new BizException("纪念日名称不能为空");
        }
        String date = request.getDate();
        if (date == null || !date.trim().matches("^(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$")) {
            throw new BizException("纪念日日期格式应为 MM-DD");
        }
    }

    private AnniversaryView toView(BlogAnniversary anniversary) {
        return new AnniversaryView(anniversary.getId(), anniversary.getLabel(),
                anniversary.getMemorialDate(), anniversary.getNote(), anniversary.getSort());
    }
}
