+++
date = '2025-07-27T22:00:00+08:00'
draft = false
title = 'BaseCTF 2024 新生赛'
categories = ['WriteUP']
tags = ['WriteUP']

+++

# Web
## 1、[Week1] md5 绕过诶



<!--more-->



- 题目源码

```php
<?php   
highlight_file(__FILE__);
error_reporting(0);
require 'flag.php';
if (isset($_GET['name']) && isset($_POST['password']) && isset($_GET['name2']) && isset($_POST['password2']) {
	$name = $_GET['name'];
	$name2 = $_GET['name2'];
	$password = $_POST['password'];
	$password2 = $_POST['password2'];
	if ($name != $password && md5($name) == md5($password)){
		if ($name2 !== $password2 && md5($name2) === md5($password2)){
			echo $flag;
			}
		else {
			echo "再看看啊，马上绕过嘞！";
		}       
	}
	else {
		echo "错啦错啦";
	}
}    
else {
	echo '没看到参数呐';   
}   
?>
```
>本题考察了对 md5 加密的绕过，而 md5 绕过大体上有 **3 种** 绕过的方法，对应不同的情况使用。

- 本题的 `$name != $password && md5($name) == md5($password)` 是 php 的弱类型比较，只要字符串的 md5 值开头是 `0e`，在 php 的弱类型比较中判断为相等。
- **常见的 `0e` 绕过**，也是**第一种 md5 绕过的方法**。
	- QNKCDZO
	- 240610708
	- s878926199a
	- s155964671a
	- s214587387a
	- s214587387a

- 本题中 `$name2 !== $password2 && md5($name2) === md5($password2)` 则是 php 中的强类型判断，上述方法已然不适用，所以我们要用到**第二种绕过的方法**——**数组绕过**。
- 只要分别传入 `name2[]=name2 & password2[]=password`，虽然会报错，但判断为真。
>md5 一个数组会返回 null，所以 null\=\=null。

- 还有就是本题没有考察到**第三种绕过方法**——**强类型绕过**。
```
$Simple1 = "\x4d\xc9\x68\xff\x0e\xe3\x5c\x20\x95\x72\xd4\x77\x7b\x72\x15\x87\xd3\x6f\xa7\xb2\x1b\xdc\x56\xb7\x4a\x3d\xc0\x78\x3e\x7b\x95\x18\xaf\xbf\xa2\x00\xa8\x28\x4b\xf3\x6e\x8e\x4b\x55\xb3\x5f\x42\x75\x93\xd8\x49\x67\x6d\xa0\xd1\x55\x5d\x83\x60\xfb\x5f\x07\xfe\xa2";
$Simple2 = "\x4d\xc9\x68\xff\x0e\xe3\x5c\x20\x95\x72\xd4\x77\x7b\x72\x15\x87\xd3\x6f\xa7\xb2\x1b\xdc\x56\xb7\x4a\x3d\xc0\x78\x3e\x7b\x95\x18\xaf\xbf\xa2\x02\xa8\x28\x4b\xf3\x6e\x8e\x4b\x55\xb3\x5f\x42\x75\x93\xd8\x49\x67\x6d\xa0\xd1\xd5\x5d\x83\x60\xfb\x5f\x07\xfe\xa2";
```
```
$Simple3 = "\xd1\x31\xdd\x02\xc5\xe6\xee\xc4\x69\x3d\x9a\x06\x98\xaf\xf9\x5c\x2f\xca\xb5\x07\x12\x46\x7e\xab\x40\x04\x58\x3e\xb8\xfb\x7f\x89\x55\xad\x34\x06\x09\xf4\xb3\x02\x83\xe4\x88\x83\x25\xf1\x41\x5a\x08\x51\x25\xe8\xf7\xcd\xc9\x9f\xd9\x1d\xbd\x72\x80\x37\x3c\x5b\xd8\x82\x3e\x31\x56\x34\x8f\x5b\xae\x6d\xac\xd4\x36\xc9\x19\xc6\xdd\x53\xe2\x34\x87\xda\x03\xfd\x02\x39\x63\x06\xd2\x48\xcd\xa0\xe9\x9f\x33\x42\x0f\x57\x7e\xe8\xce\x54\xb6\x70\x80\x28\x0d\x1e\xc6\x98\x21\xbc\xb6\xa8\x83\x93\x96\xf9\x65\xab\x6f\xf7\x2a\x70";
$Simple4 = "\xd1\x31\xdd\x02\xc5\xe6\xee\xc4\x69\x3d\x9a\x06\x98\xaf\xf9\x5c\x2f\xca\xb5\x87\x12\x46\x7e\xab\x40\x04\x58\x3e\xb8\xfb\x7f\x89\x55\xad\x34\x06\x09\xf4\xb3\x02\x83\xe4\x88\x83\x25\x71\x41\x5a\x08\x51\x25\xe8\xf7\xcd\xc9\x9f\xd9\x1d\xbd\xf2\x80\x37\x3c\x5b\xd8\x82\x3e\x31\x56\x34\x8f\x5b\xae\x6d\xac\xd4\x36\xc9\x19\xc6\xdd\x53\xe2\xb4\x87\xda\x03\xfd\x02\x39\x63\x06\xd2\x48\xcd\xa0\xe9\x9f\x33\x42\x0f\x57\x7e\xe8\xce\x54\xb6\x70\x80\xa8\x0d\x1e\xc6\x98\x21\xbc\xb6\xa8\x83\x93\x96\xf9\x65\x2b\x6f\xf7\x2a\x70";
```
 - **\$a\=\=md5(\$a)**
	 - `0e215962017` 的 md5 值也是由 **0e** 开头，在 php 的弱类型比较中相等。

# Misc
## 1、[Week1] 你也喜欢圣物吗
- 首先，有一张图片 `sweeeeeet.png`，还有一个加了密的压缩包，那么用 WinHex 打开图片发现文件尾部的数据隐藏着 base64 加密的字符串，解密之后是 `DO_YOU_KNOW_EZ_LSB?`。
- 由此可知，图片还存在 LSB 隐写，所以我们要使用 Stegsolve 工具来查看隐写的内容，选择 Data Extract 进行查看，发现 `key=lud1_lud1`，这既是压缩包的密码。
- 输入密码之后，发现又有一个压缩包 `it is fake.zip`，提示加密，在尝试之后无果；于是便联想到了“伪加密”，于是用 WinHex 打开该文件，修改加密标识 `09` 为 `00`，用 7zip 解压提示 CRC 验证错误，后来于出题人交流，用 Bandizip 解压就可以了。
- 打开解压出来的 `flag.txt`，发现里面又是一串 base64 加密的字符串，解密之后是 `flag{0h_n0_it's_f3ke}`，这又是一个假的 Flag.....
- 我再次想到了隐写，用 WinHex 打开一看果然，文件存在不被识别的数据，还经过两次 base64 加密，而解密之后得到 `BaseCTF{1u0_q1_x1_51k1}` 就是真正的 Flag 了。
>知识点：图片隐写、压缩包伪加密、文件隐写、base64 加密，确实挺“杂”的！

## 2、[Week1] 根本进不去
- 题目中的域名 `flag.basectf.fun` 是没有 A 记录的，而能含有 Flag 的，大概率是 TXT 记录，所以只需查询该域名的 TXT 记录即可获得 Flag。

## 3、[Week1] 正着看还是反着看
- 用 WinHex 打开文件发现文件中的数据全部被“反转”了，于是为了获得一个正常的 `.jfif` 文件，需要写一个 Python 程序来将数据恢复正常顺序。
```python
# 读取flag.jfif图片的byte数据
a = open('E:/xxx/flag.jfif','rb')

# 新建一个名为rp.jfif的图片，写入byte数据
b = open('E:/xxx/rp.jfif','wb')

# 将rp.jfif图片的byte数据，倒着写入rp.jfif图片里
b = b.write(a.read()[::-1])
```
- 然后，用 binwalk 进行分析，发现该图片文件还包含着一个 `flag.txt` 文件，那么我们可以用 binwalk 来进行文件的分离，将目标文件提取出来。
- 最后，处理从文件中得到的内容，就能拿到 Flag 了。

## 4、[Week1] 人生苦短，我用 Python
- 题目源码+做题注释
```Python
# BaseCTF{s1Mpl3_1s_BeTt3r_Th4n_C0mPl3x}
import base64
import hashlib


def abort(id):
    print('You failed test %d. Try again!' % id)
    exit(1)


print('Hello, Python!')
flag = input('Enter your flag: ')
  

if len(flag) != 38:
    abort(1)
  
if not flag.startswith('BaseCTF{'):
    abort(2)

# find()计算所有字符包括空格，返回的值是子字符串在字符串的起始位置，且从0开始计算
if flag.find('Mp') != 10:
    abort(3)
  
if flag[-3:] * 8 != '3x}3x}3x}3x}3x}3x}3x}3x}':
    abort(4)
 
# "}"的ASCII编码的十进制形式是125
if ord(flag[-1]) != 125:
    abort(5)

# "//"只保留结果的整数部分
if flag.count('_') // 2 != 2:
    abort(6)

# 以'_'作为分隔，分割字符串
if list(map(len, flag.split('_'))) != [14, 2, 6, 4, 8]:
    abort(7)

# 从第12位开始，先输出第12位，然后向后数4位，再输出
if flag[12:32:4] != 'lsT_n':
    abort(8)
  
if '😺'.join([c.upper() for c in flag[:9]]) != 'B😺A😺S😺E😺C😺T😺F😺{😺S':
    abort(9)

# isnumeric()如果是数字返回True，不是数字返回False
if not flag[-11].isnumeric() or int(flag[-11]) ** 5 != 1024:
    abort(10)

if base64.b64encode(flag[-7:-3].encode()) != b'MG1QbA==':
    abort(11)

# 从末尾倒着数，先输出末尾，然后向后数7位，再输出
# }Crs1s
if flag[::-7].encode().hex() != '7d4372733173':
    abort(12)

if set(flag[12::11]) != {'l', 'r'}:
    abort(13)

# b't3r_Th'
if flag[21:27].encode() != bytes([116, 51, 114, 95, 84, 104]):
    abort(14)

# 2024_08_15可以看作20240815，enumerate()则是显示(idx,c)，结合题意易知[17:20]为_Be
if sum(ord(c) * 2024_08_15 ** idx for idx, c in enumerate(flag[17:20])) != 41378751114180610:
    abort(15)

# 几个函数分别是检查字母、检查大小写、检查数字
if not all([flag[0].isalpha(), flag[8].islower(), flag[13].isdigit()]):
    abort(16)

# 原本是"3 1"，之后3被bro替换，变成"bro 1"
if '{whats} {up}'.format(whats=flag[13], up=flag[15]).replace('3', 'bro') != 'bro 1':
    abort(17)

# sha1加密
if hashlib.sha1(flag.encode()).hexdigest() != 'e40075055f34f88993f47efb3429bd0e44a7f479':
    abort(18)


print('🎉 You are right!')
import this
```

# Crypto
## 1、[Week1] helloCrypto
- 题目源码
```Python
from Crypto.Util.number import *
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import random

flag=b'BaseCTF{}'

key=random.randbytes(16)
print(bytes_to_long(key))

my_aes=AES.new(key=key,mode=AES.MODE_ECB)
print(my_aes.encrypt(pad(flag,AES.block_size)))
```
- 题目注释
```
key1 = 208797759953288399620324890930572736628

c = b'U\xcd\xf3\xb1 r\xa1\x8e\x88\x92Sf\x8a`Sk],\xa3(i\xcd\x11\xd0D\x1edd\x16[&\x92@^\xfc\xa9(\xee\xfd\xfb\x07\x7f:\x9b\x88\xfe{\xae'
```
- 由题目可得 Flag 的值被加密了，而加密方法是 AES，加密模式是 AES 的 ECB 模式。
- 题解
```Python
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad


# 密钥和密文
key1 = 208797759953288399620324890930572736628
key = long_to_bytes(key1) # 必须是 16 字节（128 位）的密钥

# 加密后的密文
ciphertext = b'U\xcd\xf3\xb1 r\xa1\x8e\x88\x92Sf\x8a`Sk],\xa3(i\xcd\x11\xd0D\x1edd\x16[&\x92@^\xfc\xa9(\xee\xfd\xfb\x07\x7f:\x9b\x88\xfe{\xae'
  

# 创建 AES 解密器
my_aes = AES.new(key=key, mode=AES.MODE_ECB)
# 解密密文
plaintext = my_aes.decrypt(ciphertext)
# 移除填充
plaintext = unpad(plaintext, AES.block_size)
# 输出解密后的明文
print(plaintext.decode('utf-8'))
```

## 2、[Week1] 你会算 md5 吗
- 题目源码
```Python
import hashlib

flag='BaseCTF{}'
output=[]
for i in flag:
	my_md5=hashlib.md5()
	my_md5.update(i.encode())
	output.append(my_md5.hexdigest())
	print("output =",output)
```
- 暴力破解
```Python
import hashlib

dir1 = 'ABCDEFGHYJKLMNOPQRSTUVWXYZ'
dir2 = 'abcdefghyjklmnopqrstuvwxyz'
dir3 = '!@_{}-'

output = ['9d5ed678fe57bcca610140957afab571', '0cc175b9c0f1b6a831c399e269772661', '03c7c0ace395d80182db07ae2c30f034', 'e1671797c52e15f763380b45e841ec32', '0d61f8370cad1d412f80b84d143e1257', 'b9ece18c950afbfa6b0fdbfa4ff731d3', '800618943025315f869e4e1f09471012', 'f95b70fdc3088560732a5ac135644506', '0cc175b9c0f1b6a831c399e269772661', 'a87ff679a2f3e71d9181a67b7542122c', '92eb5ffee6ae2fec3ad71c777531578f', '8fa14cdd754f91cc6554c9e71929cce7', 'a87ff679a2f3e71d9181a67b7542122c', 'eccbc87e4b5ce2fe28308fd9f2a7baf3', '0cc175b9c0f1b6a831c399e269772661', 'e4da3b7fbbce2345d7772b0674a318d5', '336d5ebc5436534e61d16e63ddfca327', 'eccbc87e4b5ce2fe28308fd9f2a7baf3', '8fa14cdd754f91cc6554c9e71929cce7', '8fa14cdd754f91cc6554c9e71929cce7', '45c48cce2e2d7fbdea1afc51c7c6ad26', '336d5ebc5436534e61d16e63ddfca327', 'a87ff679a2f3e71d9181a67b7542122c', '8f14e45fceea167a5a36dedd4bea2543', '1679091c5a880faf6fb5e6087eb1b2dc', 'a87ff679a2f3e71d9181a67b7542122c', '336d5ebc5436534e61d16e63ddfca327', '92eb5ffee6ae2fec3ad71c777531578f', '8277e0910d750195b448797616e091ad', '0cc175b9c0f1b6a831c399e269772661', 'c81e728d9d4c2f636f067f89cc14862c', '336d5ebc5436534e61d16e63ddfca327', '0cc175b9c0f1b6a831c399e269772661', '8fa14cdd754f91cc6554c9e71929cce7', 'c9f0f895fb98ab9159f51fd0297e236d', 'e1671797c52e15f763380b45e841ec32', 'e1671797c52e15f763380b45e841ec32', 'a87ff679a2f3e71d9181a67b7542122c', '8277e0910d750195b448797616e091ad', '92eb5ffee6ae2fec3ad71c777531578f', '45c48cce2e2d7fbdea1afc51c7c6ad26', '0cc175b9c0f1b6a831c399e269772661', 'c9f0f895fb98ab9159f51fd0297e236d', '0cc175b9c0f1b6a831c399e269772661', 'cbb184dd8e05c9709e5dcaedaa0495cf']

ans = []
ansop = ''
  
for i in output:
    sign = 1
    
    if sign == 1:
        for num in range(0,10):
            my_md5 = hashlib.md5()
            my_md5.update(str(num).encode())
            op1 = my_md5.hexdigest()
            if i == op1:
                ans.append(num)
                sign = 0
                break
    if sign == 1:
        for LT in dir1:
            my_md5 = hashlib.md5()
            my_md5.update(LT.encode())
            op2 = my_md5.hexdigest()
            if i == op2:
                ans.append(LT)
                sign = 0
                break        
    if sign == 1:
        for lt in dir2:
            my_md5 = hashlib.md5()
            my_md5.update(lt.encode())
            op3 = my_md5.hexdigest()
            if i == op3:
                ans.append(lt)
                sign = 0
                break
    if sign == 1:
        for fuhao in dir3:
            my_md5 = hashlib.md5()
            my_md5.update(fuhao.encode())
            op4 = my_md5.hexdigest()
            if i == op4:
                ans.append(fuhao)
                sign = 0
                break

for m in ans:
    ansop = ansop + str(m)

print(ansop)
```
