+++
date = '2025-07-27T23:20:00+08:00'
draft = false
title = 'CTFHub之HTTP协议'
categories = ['WriteUP']
tags = ['WriteUP', 'CTFHub']

+++

## 1、请求方式
- 将请求方式由 GET 改为 CTFHUB 即得到 Flag。



<!--more-->



## 2、302 跳转
- 301 和 302 都有重定向的作用，而 301 是永久性重定向（旧的内容已失效），302 是暂时性重定向（旧的内容还在，临时跳转到新的内容上）。
- 向旧的内容发起 GET 请求，能得到旧的内容的 Response 从而得到 Flag。

## 3、Cookie 欺骗、伪造、认证
- 打开控制台，查看网络请求，发现存在 cookie，将 admin 的值设置为 1，即得到 Flag。

## 4、基础认证
- 打开控制台发现是 GET 请求，下载附件（字典）。
- 使用 hydra 进行暴力破解，用户名大概率为 admin 所以先试 admin。
- 在终端输入 `hydra -L user_name.txt -P dir.txt http-get://xxx/flag.html`，经过比对之后即得 Flag。

## 5、响应包源代码
- 打开控制台，查看 Response 代码，即得 Flag。