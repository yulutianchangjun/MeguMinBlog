package xyz.cy666.blog.controller;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.cy666.blog.common.ApiResponse;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.dto.LoginRequest;
import xyz.cy666.blog.dto.LoginResponse;
import xyz.cy666.blog.dto.PasswordRequest;
import xyz.cy666.blog.dto.UserView;
import xyz.cy666.blog.security.JwtService;
import xyz.cy666.blog.security.TokenStore;
import xyz.cy666.blog.security.TokenStoreSupport;
import xyz.cy666.blog.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final TokenStore tokenStore;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        authService.logout(TokenStoreSupport.bearer(request));
        return ApiResponse.ok();
    }

    @PostMapping("/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody PasswordRequest request,
                                            HttpServletRequest servletRequest) {
        String token = TokenStoreSupport.bearer(servletRequest);
        if (token == null || !tokenStore.exists(token)) {
            throw BizException.unauthorized("登录已失效，请重新登录");
        }
        Claims claims = jwtService.parse(token);
        authService.changePassword(Long.parseLong(claims.getSubject()),
                request.oldPassword(), request.newPassword());
        return ApiResponse.ok();
    }

    @GetMapping("/me")
    public ApiResponse<UserView> me(HttpServletRequest request) {
        String token = TokenStoreSupport.bearer(request);
        if (token == null || !tokenStore.exists(token)) {
            throw BizException.unauthorized("登录已失效，请重新登录");
        }
        try {
            Claims claims = jwtService.parse(token);
            return ApiResponse.ok(authService.me(Long.parseLong(claims.getSubject())));
        } catch (Exception ex) {
            throw BizException.unauthorized("登录已失效，请重新登录");
        }
    }
}
