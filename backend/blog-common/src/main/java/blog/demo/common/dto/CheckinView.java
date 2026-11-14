package blog.demo.common.dto;

import java.util.List;

public record CheckinView(int total, int streak, boolean checkedToday, List<String> dates) {
}
