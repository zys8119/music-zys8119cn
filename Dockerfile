FROM node:26-alpine
COPY . /app
WORKDIR /app
RUN npm i pnpm -g
RUN pnpm i
EXPOSE 5173
EXPOSE 4444
CMD ["pnpm", "dev"]
