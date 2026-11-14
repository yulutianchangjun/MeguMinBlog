# 多阶段构建：Maven 编译（多模块）→ JRE 运行
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# 先只拷贝各模块 pom，利用镜像层缓存预热依赖
COPY pom.xml .
COPY blog-common/pom.xml blog-common/
COPY blog-framework/pom.xml blog-framework/
COPY blog-system/pom.xml blog-system/
COPY blog-admin/pom.xml blog-admin/
RUN mvn -B -q dependency:go-offline -pl blog-admin -am || true

# 再拷贝源码并构建，产物在 blog-admin/target/app.jar
COPY blog-common/src blog-common/src
COPY blog-framework/src blog-framework/src
COPY blog-system/src blog-system/src
COPY blog-admin/src blog-admin/src
RUN mvn -B -q clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S blog && adduser -S blog -G blog \
    && mkdir -p /app/uploads && chown -R blog:blog /app

COPY --from=builder /build/blog-admin/target/app.jar /app/app.jar
RUN chown blog:blog /app/app.jar

USER blog
EXPOSE 8080
ENV TZ=Asia/Shanghai JAVA_OPTS="-XX:MaxRAMPercentage=70 -Duser.timezone=Asia/Shanghai"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
