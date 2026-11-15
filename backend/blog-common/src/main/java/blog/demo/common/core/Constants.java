package blog.demo.common.core;

/** 站点级常量：默认素材路径、默认文案等 */
public final class Constants {

    private Constants() {
    }

    /**
     * 综集未设置封面时的默认图。
     * 由后端在保存时写入数据库（而不是前端各自兜底），这样任何调用方拿到的数据都是完整的。
     * 路径相对于前端 public 目录，前端用 resolveAsset 解析。
     */
    public static final String DEFAULT_COLLECTION_COVER = "assets/megumin/castle-banner.webp";
}
