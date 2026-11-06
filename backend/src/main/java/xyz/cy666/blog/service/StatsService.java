package xyz.cy666.blog.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import xyz.cy666.blog.dto.UvDayView;
import xyz.cy666.blog.dto.UvSummaryView;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter LABEL = DateTimeFormatter.ofPattern("MM.dd");
    private static final String PV_ALL = "blog:pv:all";
    private static final String UV_ALL = "blog:uv:all";
    private static final String PAGES_TOP = "blog:pages";
    private static final Duration KEEP = Duration.ofDays(120);

    private final StringRedisTemplate redis;
    private final JdbcTemplate jdbc;

    public void track(String path, String slug, String ip) {
        LocalDate today = LocalDate.now(ZONE);
        String pvKey = "blog:pv:" + today;
        redis.opsForValue().increment(PV_ALL);
        Long pv = redis.opsForValue().increment(pvKey);
        if (pv != null && pv == 1L) {
            redis.expire(pvKey, KEEP);
        }
        String uvKey = "blog:uv:" + today;
        redis.opsForSet().add(UV_ALL, ip);
        redis.opsForSet().add(uvKey, ip);
        redis.expire(uvKey, KEEP);

        redis.opsForHash().increment(PAGES_TOP, path, 1);

        if (StringUtils.hasText(slug)) {
            jdbc.update("UPDATE blog_post SET views = views + 1 WHERE slug = ?", slug);
        }
    }

    public UvSummaryView summary() {
        LocalDate today = LocalDate.now(ZONE);
        List<UvDayView> series = new ArrayList<>();
        int activeDays = 0;
        for (int i = 13; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            long pv = parseLong(redis.opsForValue().get("blog:pv:" + date));
            Long uv = redis.opsForSet().size("blog:uv:" + date);
            long uvValue = uv == null ? 0 : uv;
            if (pv > 0) {
                activeDays += 1;
            }
            series.add(new UvDayView(date.toString(), date.format(LABEL), pv, uvValue));
        }
        long pvTotal = parseLong(redis.opsForValue().get(PV_ALL));
        Long uvTotal = redis.opsForSet().size(UV_ALL);
        List<UvSummaryView.PageCountView> topPages = topPages();
        UvDayView todayView = series.get(series.size() - 1);
        return new UvSummaryView(pvTotal, uvTotal == null ? 0 : uvTotal,
                todayView.pv(), todayView.uv(), activeDays, topPages, series);
    }

    private List<UvSummaryView.PageCountView> topPages() {
        var entries = redis.<String, Object>opsForHash().entries(PAGES_TOP);
        return entries.entrySet().stream()
                .map(entry -> new UvSummaryView.PageCountView(
                        String.valueOf(entry.getKey()),
                        parseLong(String.valueOf(entry.getValue()))))
                .sorted((a, b) -> Long.compare(b.count(), a.count()))
                .limit(5)
                .toList();
    }

    private long parseLong(String value) {
        if (!StringUtils.hasText(value)) {
            return 0;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
