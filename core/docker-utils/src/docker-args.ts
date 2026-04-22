export const whiteDockerArgs: Record<string, string> = {
  // 短参数映射
  '-a': '--attach', // 将标准输入、输出或错误流附加到容器（通常与 -i -t 一起使用）
  '-d': '--detach', // 以后台模式运行容器（分离模式）
  '-e': '--env', // 设置环境变量（例如：-e "VAR=value"）
  '-h': '--hostname', // 设置容器的主机名
  '-i': '--interactive', // 保持 STDIN 为打开状态（与 -t 一起用可进入交互式模式）
  '-it': '-it',
  '-rm': '-rm',
  '-m': '--memory', // 限制容器可使用的内存大小（例如：-m 512m）
  '-p': '--publish', // 将容器的端口映射到主机（例如：-p 8080:80）
  '-P': '--publish-all', // 将容器暴露的所有端口随机映射到主机端口
  '-l': '--label', // 为容器添加自定义元数据标签（例如：-l "key=value"）
  '-n': '--name', // 为容器指定名称，而不是自动分配
  '-q': '--quiet', // 静默模式，不输出日志信息（通常用于 docker build）
  '-x': '--x-registry', // 非标准参数（此处为自定义场景）可用于指定镜像注册表等
  '-t': '--tty', // 分配一个伪 TTY（终端），常与 -i 一起使用
  '-u': '--user', // 指定以哪个用户或 UID 运行容器内的进程
  '-v': '--volume', // 挂载宿主机目录或数据卷到容器中
  '-w': '--workdir', // 设置容器内的工作目录
  '-cgroupns': '--cgroupns', // 设置 cgroup 命名空间的模式（host 或 private）
  '-cpus': '--cpus', // 限制可用给容器的 CPU 数量
  '-g': '--gpus', // 分配 GPU 给容器（需要适配 NVIDIA runtime）
  '-ip6': '--ip6', // 设置容器的 IPv6 地址
  '--read-only': '--read-only', // 将容器的文件系统设置为只读

  // 长参数映射
  '--add-host': '--add-host', // 添加自定义主机名映射到 /etc/hosts 中（格式：host:IP）
  '--attach': '--attach', // 附加到容器的 STDIN/STDOUT/STDERR
  '--blkio-weight': '--blkio-weight', // 设置容器块 IO 相对权重（需要 cgroup 支持）
  '--blkio-weight-device': '--blkio-weight-device', // 针对指定设备设置块 IO 权重
  '--cap-add': '--cap-add', // 向容器添加 Linux 功能（Capabilities）
  '--cap-drop': '--cap-drop', // 从容器中移除特定 Linux 功能
  '--cgroup-parent': '--cgroup-parent', // 指定容器的 cgroup 父组
  '--cidfile': '--cidfile', // 将创建的容器 ID 写入到指定文件中
  '--cpu-period': '--cpu-period', // 限制 CPU CFS 调度周期
  '--cpu-quota': '--cpu-quota', // 限制 CPU CFS 配额，控制 CPU 时间的使用量
  '--cpu-rt-period': '--cpu-rt-period', // 调整 CPU 实时调度周期（需要特定权限）
  '--cpu-rt-runtime': '--cpu-rt-runtime', // 调整 CPU 实时调度运行时间（需要特定权限）
  '--cpu-shares': '--cpu-shares', // 设置 CPU 共享权重（相对值）
  '--cpus': '--cpus', // 限制容器可用 CPU 数量（例如：--cpus 2.5）
  '--cpuset-cpus': '--cpuset-cpus', // 指定容器能使用的 CPU 核心（例如：--cpuset-cpus="0-2,4"）
  '--cpuset-mems': '--cpuset-mems', // 指定容器能使用的内存节点（NUMA 节点）
  '--detach': '--detach', // 后台运行容器
  '--detach-keys': '--detach-keys', // 设置分离容器的键组合
  '--device': '--device', // 将主机设备映射到容器（例如：--device=/dev/sda:/dev/xvda）
  '--device-cgroup-rule': '--device-cgroup-rule', // 为设备访问添加 cgroup 规则
  '--device-read-bps': '--device-read-bps', // 限制设备读取速率（字节/秒）
  '--device-read-iops': '--device-read-iops', // 限制设备读取 IOPS
  '--device-write-bps': '--device-write-bps', // 限制设备写入速率（字节/秒）
  '--device-write-iops': '--device-write-iops', // 限制设备写入 IOPS
  '--disable-content-trust': '--disable-content-trust', // 禁用镜像拉取时的内容信任校验
  '--dns': '--dns', // 设置容器使用的 DNS 服务器
  '--dns-opt': '--dns-opt', // 为 DNS 配置添加选项
  '--dns-search': '--dns-search', // 为 DNS 搜索域配置添加域名
  '--domainname': '--domainname', // 设置容器的域名（FQDN）
  '--entrypoint': '--entrypoint', // 覆盖镜像的默认 ENTRYPOINT
  '--env': '--env', // 设置环境变量
  '--env-file': '--env-file', // 从文件中读取环境变量
  '--expose': '--expose', // 声明容器将会监听的端口（不做主机端口映射，只是元数据声明）
  '--gpus': '--gpus', // 分配 GPU 给容器
  '--group-add': '--group-add', // 向容器添加更多用户组（GID）
  '--health-cmd': '--health-cmd', // 容器健康检查命令
  '--health-interval': '--health-interval', // 健康检查的时间间隔
  '--health-retries': '--health-retries', // 健康检查的重试次数
  '--health-start-period': '--health-start-period', // 健康检查开始前的初始化等待时间
  '--health-timeout': '--health-timeout', // 健康检查的超时时间
  '--help': '--help', // 显示帮助信息
  '--hostname': '--hostname', // 设置容器主机名
  '--init': '--init', // 在容器内使用 init 进程（帮助处理僵尸进程）
  '--interactive': '--interactive', // 保持 STDIN 打开
  '--ip': '--ip', // 指定容器的 IPv4 地址（需自定义网络）
  '--ip6': '--ip6', // 指定容器的 IPv6 地址（需自定义网络）
  '--ipc': '--ipc', // 设置容器的 IPC 命名空间（shareable, container:id, 或 host）
  '--isolation': '--isolation', // 指定容器隔离级别（Windows 环境下使用，如 process 或 hyperv）
  '--kernel-memory': '--kernel-memory', // 限制内核内存使用（已弃用）
  '--label': '--label', // 为容器添加自定义元数据标签
  '--label-file': '--label-file', // 从文件中读取标签
  '--link': '--link', // 连接到另一个容器的网络别名（已弃用，建议用网络替代）
  '--link-local-ip': '--link-local-ip', // 为容器分配一个链接本地地址（IPv4/IPv6）
  '--log-driver': '--log-driver', // 设置容器日志驱动（例如 json-file、syslog 等）
  '--log-opt': '--log-opt', // 为日志驱动添加额外配置选项
  '--mac-address': '--mac-address', // 设置容器的 MAC 地址（需自定义网络）
  '--memory': '--memory', // 限制容器可使用的内存
  '--memory-reservation': '--memory-reservation', // 设置内存软限制（触发内存管理）
  '--memory-swap': '--memory-swap', // 设置内存+swap 的限制值
  '--memory-swappiness': '--memory-swappiness', // 调整内存交换行为（0-100）
  '--mount': '--mount', // 使用高级语法挂载数据卷或绑定宿主机目录
  '--name': '--name', // 指定容器名称
  '--network': '--network', // 指定容器使用的网络（默认 bridge）
  '--network-alias': '--network-alias', // 为容器添加网络别名（在用户定义网络中）
  '--no-healthcheck': '--no-healthcheck', // 禁用继承自镜像的健康检查
  '--oom-kill-disable': '--oom-kill-disable', // 禁用内存不足时对容器进程的杀死操作
  '--oom-score-adj': '--oom-score-adj', // 调整容器的 OOM 分数（影响 OOM 杀死优先级）
  '--pid': '--pid', // 设置 PID 命名空间（容器与主机共享进程视图）
  '--pids-limit': '--pids-limit', // 限制容器内可用的进程数
  '--platform': '--platform', // 指定镜像平台（如 linux/amd64）
  '--privileged': '--privileged', // 提升容器为特权模式（访问更多主机资源）
  '--publish': '--publish', // 映射容器端口到宿主机
  '--publish-all': '--publish-all', // 自动映射容器暴露的所有端口到宿主机随机端口
  '--pull': '--pull', // 指定拉取镜像策略（always, missing, never）
  '--restart': '--restart', // 容器退出后的重启策略（no, on-failure, always, unless-stopped）
  '--rm': '--rm', // 容器停止后自动删除容器
  '--runtime': '--runtime', // 指定运行时（如 runc, nvidia-container-runtime）
  '--security-opt': '--security-opt', // 设置安全选项（如 seccomp, apparmor 配置）
  '--shm-size': '--shm-size', // 设置 /dev/shm 的大小（默认 64M）
  '--stop-signal': '--stop-signal', // 设置停止容器时发送的信号（默认 SIGTERM）
  '--stop-timeout': '--stop-timeout', // 停止容器时等待指定秒数后发送 SIGKILL
  '--storage-opt': '--storage-opt', // 设置存储驱动的选项（如 devicemapper）
  '--sysctl': '--sysctl', // 设置内核参数（sysctl）
  '--tmpfs': '--tmpfs', // 挂载一个 tmpfs 临时文件系统
  '--tty': '--tty', // 分配一个伪终端 TTY
  '--ulimit': '--ulimit', // 设置容器的 ulimit 限制（如打开文件数）
  '--user': '--user', // 指定容器内运行进程的用户/组
  '--userns': '--userns', // 设置用户命名空间模式（host 或 private）
  '--uts': '--uts', // 设置 UTS 命名空间（host 或 container）
  '--volume': '--volume', // 挂载宿主机目录或数据卷到容器中
  '--volume-driver': '--volume-driver', // 指定数据卷驱动
  '--volumes-from': '--volumes-from', // 从另一个容器挂载数据卷
  '--workdir': '--workdir', // 设置容器内的工作目录
};

export const allowDockerArgs: Record<string, boolean> = {
  '--env': true,
  '--publish': true,
  '--volume': true,
  '--attach': true,
  '--quiet': true,
  '--entrypoint': true,
  '--workdir': true,
  '--cidfile': true,
  '--detach-keys': true,
  '--disable-content-trust': true,
  '--domainname': true,
  '--expose': true,
  '--ip': true,
  '--link-local-ip': true,
  '--platform': true,
};

export const autoSetDockerArgs: Record<string, boolean> = {
  '-rm': true,
  '--name': true,
  '--label': true,
  '--network': true,
  '--user': true,
};

export const notAllowUseCustomDockerArgs: Record<string, boolean> = {
  '--volume': true,
  '--publish': true,
};
