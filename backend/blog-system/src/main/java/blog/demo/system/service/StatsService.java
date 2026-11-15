package blog.demo.system.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import blog.demo.common.dto.TodayStatsView;
import blog.demo.common.dto.UvDayView;
import blog.demo.common.dto.UvSummaryView;

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
        // UV 只统计可辨识的公网 IP：同一 IP 当天只进一次 Set，内网/本机地址不计入
        if (countableIp(ip)) {
            String uvKey = "blog:uv:" + today;
            redis.opsForSet().add(UV_ALL, ip);
            redis.opsForSet().add(uvKey, ip);
            redis.expire(uvKey, KEEP);
        }

        redis.opsForHash().increment(PAGES_TOP, path, 1);

        if (StringUtils.hasText(slug)) {
            jdbc.update("UPDATE blog_post SET views = views + 1 WHERE slug = ?", slug);
        }
    }

    /**
     * 是否是可计入 UV 的访问来源。
     * 排除空值、unknown、回环地址与内网网段，避免本地调试、容器健康检查、内网探活把 UV 注水。
     */
    private boolean countableIp(String ip) {
        if (!StringUtils.hasText(ip)) {
            return false;
        }
        String value = ip.trim();
        if (value.isEmpty() || "unknown".equalsIgnoreCase(value)) {
            return false;
        }
        if ("127.0.0.1".equals(value) || "0.0.0.0".equals(value) || "::1".equals(value)) {
            return false;
        }
        if (value.startsWith("10.") || value.startsWith("192.168.")) {
            return false;
        }
        if (value.startsWith("172.")) {
            // 172.16.0.0 ~ 172.31.255.255 为内网
            String[] parts = value.split("\\.");
            if (parts.length > 1) {
                try {
                    int second = Integer.parseInt(parts[1]);
                    if (second >= 16 && second <= 31) {
                        return false;
                    }
                } catch (NumberFormatException ignored) {
                    return false;
                }
            }
        }
        return true;
    }

    /** 今日 PV / UV（公开接口用，前台页头展示「今日访客」） */
    public TodayStatsView todayStats() {
        LocalDate today = LocalDate.now(ZONE);
        long pv = parseLong(redis.opsForValue().get("blog:pv:" + today));
        Long uv = redis.opsForSet().size("blog:uv:" + today);
        return new TodayStatsView(today.toString(), pv, uv == null ? 0 : uv);
    }

    public UvSummaryView summary() {        LocalDate today = LocalDate.now(ZONE);
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
