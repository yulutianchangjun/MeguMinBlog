package xyz.cy666.blog.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import xyz.cy666.blog.common.BizException;
import xyz.cy666.blog.dto.LoginRequest;
import xyz.cy666.blog.dto.LoginResponse;
import xyz.cy666.blog.dto.UserView;
import xyz.cy666.blog.entity.SysUser;
import xyz.cy666.blog.mapper.SysUserMapper;
import xyz.cy666.blog.security.JwtService;
import xyz.cy666.blog.security.TokenStore;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenStore tokenStore;

    public LoginResponse login(LoginRequest request) {
        SysUser user = userMapper.selectOne(
                new QueryWrapper<SysUser>().eq("username", request.username().trim()).last("LIMIT 1"));
        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw BizException.unauthorized("账号或密码不正确");
        }
        if (user.getStatus() == null || user.getStatus() != 1) {
            throw BizException.forbidden("该账号已被禁用");
        }
        String token = jwtService.issue(user.getId(), user.getUsername());
        tokenStore.save(token, user.getId());
        return new LoginResponse(token, toView(user));
    }

    public UserView me(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw BizException.unauthorized("账号不存在");
        }
        return toView(user);
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw BizException.unauthorized("账号不存在");
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BizException("当前密码不正确");
        }
        if (oldPassword.equals(newPassword)) {
            throw new BizException("新密码不能与旧密码相同");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userMapper.updateById(user);
    }

    public void logout(String token) {
        if (token != null) {
            tokenStore.remove(token);
        }
    }

    private UserView toView(SysUser user) {
        return new UserView(user.getId(), user.getUsername(), user.getNickname(), user.getAvatar());
    }
}
