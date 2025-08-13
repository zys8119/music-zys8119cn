# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RESET='\033[0m'

# 定义颜色函数
echo_red() {
  printf "${RED}%s${RESET}\n" "$*"
}

echo_green() {
  printf "${GREEN}%s${RESET}\n" "$*"
}

echo_yellow() {
  printf "${YELLOW}%s${RESET}\n" "$*"
}

echo_blue() {
  printf "${BLUE}%s${RESET}\n" "$*"
}

echo_cyan() {
  printf "${CYAN}%s${RESET}\n" "$*"
}
echo_blue 部署的服务器地址:$serve_host_ip
echo_blue 正在提交代码
git add .
commitHash=$(git log -1 --format="%h")
git commit -m "[add] deploy $commitHash"
git push origin main
echo_blue 构建中...
rm -rf dist
pnpm build
echo_blue zip打包中...
zip dist/dist.zip dist -r -X "*.zip"
echo_blue 部署中...
scp ./dist/dist.zip $serve_user@$serve_host_ip:$serve_dir
cat ./serve.sh | ssh $serve_user@$serve_host_ip

