FROM node:26-alpine
COPY . /app
WORKDIR /app
RUN npm i pnpm -g
# 允许所有依赖执行构建脚本
RUN printf "dangerouslyAllowAllBuilds: true\n" > pnpm-workspace.yaml
# RUN pnpm approve-builds
RUN pnpm i
EXPOSE 5173
CMD ["pnpm", "dev"]
