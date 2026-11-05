package xyz.cy666.blog.config;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import xyz.cy666.blog.entity.SysUser;
import xyz.cy666.blog.mapper.SysUserMapper;

import java.time.LocalDateTime;

/**
 * 首次启动时按配置创建博主账号（密码用 BCrypt 存储）。
 * 生产环境请通过 ADMIN_USERNAME / ADMIN_PASSWORD 环境变量覆盖默认值。
 */
@Component
@RequiredArgsConstructor
public class AdminInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final SysUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties props;

    @Override
    public void run(ApplicationArguments args) {
        String username = props.getAdmin().getUsername();
        Long count = userMapper.selectCount(new QueryWrapper<SysUser>().eq("username", username));
        if (count != null && count > 0) {
            return;
        }
        SysUser user = new SysUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(props.getAdmin().getPassword()));
        user.setNickname(props.getAdmin().getNickname());
        user.setAvatar("");
        user.setStatus(1);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.insert(user);
        log.info("已创建博主账号 [{}]，请尽快在环境变量中修改默认密码", username);
    }
}
