package xyz.cy666.blog.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.common.UserContext;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtService jwtService;
    private final TokenStore tokenStore;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 放行 CORS 预检，否则浏览器拿不到 Access-Control-* 响应头
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String token = TokenStoreSupport.bearer(request);
        if (token == null) {
            throw BizException.unauthorized("请先登录博主账号");
        }
        if (!tokenStore.exists(token)) {
            throw BizException.unauthorized("登录已失效，请重新登录");
        }
        try {
            Claims claims = jwtService.parse(token);
            UserContext.set(Long.parseLong(claims.getSubject()));
            return true;
        } catch (Exception ex) {
            throw BizException.unauthorized("登录已失效，请重新登录");
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
