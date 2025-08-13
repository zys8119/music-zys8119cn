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
echo_blue 部署中...
ssh -r ./dist $serve_user@$serve_host_ip:$serve_dir
# ssh $serve_user@$serve_host_ip "cd $serve_dir && git pull"
# echo_green 部署成功
# echo_blue 重启服务...
# ssh $serve_user@$serve_host_ip "cd $serve_dir && pnpm i && docker compose up -d --force-recreate"
# echo_green 重启服务成功
