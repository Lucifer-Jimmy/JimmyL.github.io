+++
date = '2025-07-27T17:02:00+08:00'
draft = false
title = '攻防世界新手模式'
categories = ['WriteUP']
tags = ['WriteUP', '攻防世界']

+++

## 1、get_post
- **GET 方法传递参数**
	- 主要通过查询来传递，在 url 后接 `/?a=1`，即可用 GET 方法发送名称为 a，值为 1 的变量。

<!--more-->

- **POST 方法传递参数**
	- 主要在请求主体中直接填写。

## 2、simple_php
- 首先，我们可以看到提示是关于 php 的代码。
```php
<?php  
show_source(__FILE__);  
include("config.php");  
//使用GET方法获取
$a=@$_GET['a'];  
$b=@$_GET['b'];  
if($a==0 and $a){  
    echo $flag1;  
}  
// 判断变量b是否为数字或数字类型的字符串，返回布尔值
// 是，则返回TRUE；否，则返回FALSE
if(is_numeric($b)){  
    exit();  
}  
if($b>1234){  
    echo $flag2;  
}  
?>
```
- 由上可以知道，该网站可以运行上述代码。
- PHP 是一种**弱类型**的语言，当 php 中的变量需要进行比较时，包含松散比较和严格比较。

- **松散比较**：只比较值，不比较类型。
- **严格比较**：既比较值，也比较类型。

- 所以，`a==0` 进行比较时，a 的数据类型与 0 不相同，但只要 `$a` 的最后结果是 0 即可。
- 假如 `$a` 是字符串 `"hello"`，那么在比较前会先将字符串转化成数字 0 所相同的数据类型，而所有的字符串类型转换成数字类型后都为数字 0。在这里，**a 可以是 0**，**也可以是任意字符串**。
- 但我们还注意到条件 `$a`，如果该条件为真，那么 **a 不能是 0**，所以 **a 要为除 “1” 外的任意字符串**。
- `$b` 要求见上代码注释，`$b` 不能是数字类型（数字和数字字符串），所以需要使得 `$b` 的值大于 1234 再在数字的后面加上任意字符串。
- 最后，将两个值拼接到 url 中一起提交，即得 Flag。

## 3、PHP2
- phps 即为 PHP Source。PHP Source 由 The PHP Group 发布，是最通用的关联应用程序。
- phps 文件实际上是 php 的源代码文件，通常用于提供给用户（访问者）查看 php 代码，因为用户无法直接通过浏览器看到 php 的内容，所以需要使用 phps 文件替代。
```php
<?php
if("admin"===$_GET[id]) {
  echo("<p>not allowed!</p>");
  exit();
}

$_GET[id] = urldecode($_GET[id]);
if($_GET[id] == "admin")
{
  echo "<p>Access granted!</p>";
  echo "<p>Key: xxxxxxx </p>";
}
?>
```
- 这里的 urldecode，自然就要有 urlencode，理解了 urlencode 的原理这道题就解决了。
- urlencode 主要是将字符串转换成带“%”的十六进制字符。
- 浏览器会自动识别并修正一次转换，所以要双重编码才能传递给网页的 php，才能获得 Flag。

## 4、simple_js
- 题目源码
```javascript
function dechiffre(pass_enc){
	// 定义密钥，格式为 ASCII 码值的十进制数，以逗号分隔
    var pass = "70,65,85,88,32,80,65,83,83,87,79,82,68,32,72,65,72,65";
    var tab  = pass_enc.split(',');
    var tab2 = pass.split(',');
    var i,j,k,l=0,m,n,o,p = "";
    i = 0;
    j = tab.length;
    k = j + (l) + (n=0);
    n = tab2.length;

    for(i = (o=0); i < (k = j = n); i++ ){
        o = tab[i-l]; // 这行代码完全没用，下面又重新定义了变量o
        // 所以，无论 pass_enc 是什么，都对返回的结果毫无影响
        p += String.fromCharCode((o = tab2[i]));
        if(i == 5)break;
        }

    for(i = (o=0); i < (k = j = n); i++ ){
        o = tab[i-l];
        if(i > 5 && i < k-1)
            p += String.fromCharCode((o = tab2[i]));
        }

    p += String.fromCharCode(tab2[17]);
    pass = p;
    return pass;
}

String["fromCharCode"](dechiffre("\x35\x35\x2c\x35\x36\x2c\x35\x34\x2c\x37\x39\x2c\x31\x31\x35\x2c\x36\x39\x2c\x31\x31\x34\x2c\x31\x31\x36\x2c\x31\x30\x37\x2c\x34\x39\x2c\x35\x30"));

h = window.prompt('Enter password');
alert(dechiffre(h));
```
- 关键在于倒数第三行，将其转换成 url 编码或者其他常见编码解码即可。

## 5、xff_referer
- 本题要求发出访问的 IP 地址必须为 123.123.123.123，那么我们就需要修改发出请求的内容来实现这一效果。

- xff（X-Forwarded-For）是一个 HTTP 拓展头部，它最开始是由 Squid 这个缓存代理软件引入，用来表示 HTTP 请求端真实 IP。
```
X-Forwarded-For: 123.123.123.123
```

- 而后又出现提示发出请求必须来自 `https://www.google.com`，继续修改请求内容。
- referer 是指来自某网页的推荐。
```
Referer: https://www.google.com
```
- 即得 Flag。

## 6、command execution
- 这个应用没有配置 waf（防火墙），可以注入其他命令。
- 可以使用“`|`”来连接命令，从而操作服务端系统。
```bash
| env   # 查看服务端的环境
| ls /   # 查看服务端根目录，一般出题人会把flag放在home中
| ls /home   # 发现flag.txt
| cat /home/flag.txt   # 即得flag
```
