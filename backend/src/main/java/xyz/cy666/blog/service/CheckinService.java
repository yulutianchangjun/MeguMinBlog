package xyz.cy666.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import xyz.cy666.blog.dto.CheckinView;
import xyz.cy666.blog.entity.BlogCheckin;
import xyz.cy666.blog.mapper.BlogCheckinMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.TreeSet;

@Service
@RequiredArgsConstructor
public class CheckinService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private final BlogCheckinMapper checkinMapper;

    public CheckinView summary() {
        LocalDate today = LocalDate.now(ZONE);
        TreeSet<LocalDate> dates = new TreeSet<>();
        for (BlogCheckin item : checkinMapper.selectList(new QueryWrapper<BlogCheckin>()
                .orderByDesc("checkin_date"))) {
            dates.add(item.getCheckinDate());
        }
        boolean checkedToday = dates.contains(today);
        LocalDate cursor = checkedToday ? today : today.minusDays(1);
        int streak = 0;
        while (dates.contains(cursor)) {
            streak += 1;
            cursor = cursor.minusDays(1);
        }
        List<String> list = dates.stream().map(LocalDate::toString).toList();
        return new CheckinView(dates.size(), streak, checkedToday, list);
    }

    public CheckinView checkin() {
        LocalDate today = LocalDate.now(ZONE);
        Long exists = checkinMapper.selectCount(new QueryWrapper<BlogCheckin>().eq("checkin_date", today));
        if (exists == null || exists == 0) {
            BlogCheckin checkin = new BlogCheckin();
            checkin.setCheckinDate(today);
            checkin.setCreatedAt(LocalDateTime.now());
            try {
                checkinMapper.insert(checkin);
            } catch (DuplicateKeyException ignored) {
                // 并发下重复签到，忽略即可
            }
        }
        return summary();
    }
}
