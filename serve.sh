cd /project

zip_dir=$(pwd)/dist.zip
output_dir=$(pwd)/music
rm -rf $output_dir
unzip -o $zip_dir -d $output_dir
# 保存当前路径
BASE_DIR=$(pwd)
count=$(ls -A $output_dir | wc -l)
# 文件夹只有一个文件及目录的时候代表前端资源被压缩到同一个目录
if [ $count -eq 1 ]; then
    # 遍历所有子目录
    for dir in $output_dir/*/; do
        # 判断是否为目录
        [ -d "$dir" ] || continue
        cd "$dir" || continue
        # 这里是你要执行的一系列命令，可以添加多条
        mv ./* ..
        rm -rf $dir
        # 返回到初始目录
        cd "$BASE_DIR"
    done;
fi;
echo 'publish done'