package xyz.cy666.blog.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import xyz.cy666.blog.config.AppProperties;

import java.time.Duration;

/**
 * JWT + Redis 白名单：即使令牌未过期，只要 Redis 里的会话被删除（退出登录/封禁），
 * 后续请求也会立即失效。
 */
@Service
@RequiredArgsConstructor
public class TokenStore {

    private static final String PREFIX = "blog:session:";

    private final StringRedisTemplate redis;
    private final AppProperties props;

    public void save(String token, Long userId) {
        redis.opsForValue().set(PREFIX + token, String.valueOf(userId),
                Duration.ofDays(props.getJwt().getTtlDays()));
    }

    public boolean exists(String token) {
        Boolean has = redis.hasKey(PREFIX + token);
        return Boolean.TRUE.equals(has);
    }

    public void remove(String token) {
        redis.delete(PREFIX + token);
    }
}
