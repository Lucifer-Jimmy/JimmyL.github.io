+++
date = '2025-07-28T00:26:00+08:00'
draft = false
title = 'CTFHub之信息泄露'
categories = ['WriteUP']
tags = ['WriteUP', 'CTFHub']

+++

## 1、目录遍历
- 说实话，第一次看见这道题有点懵，没想到真就那么简单......
- 看了下别人的 WriteUP ，竟然还可以用 Python 跑程序来解，nb！



<!--more-->



```python
import requests

url = "试题地址/flag_in_here/"

for i in range(0,5):
	for j in range(0,5):
		#字符串拼接
		url_test = url + "/" + str(i) + "/" + str(j)
		#获取页面响应内容（请求方式看实际情况）
		resp = requests.get(url_test)
		#设置编码方式（编码方式看实际情况）
		resp.encoding = 'utf-8'
		#查找是否存在 flag.txt
		get_file = resp.txt
		if "flag.txt" in get_file:
			print(url_test)
```

## 2、PHPINFO

- 一道简单题，关键是留意其中反应的主机的一些信息。（如下）

| System                    | Linux challenge-77f6aefa21c9ba38-5db7468b6-4zk6b 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.76-1 (2024-02-01) x86_64 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Build Date**            | **Feb 1 2020 20:09:30**                                                                                                    |
| **extension_dir**         | **/usr/local/lib/php/extensions/no-debug-non-zts-20180731**                                                                |
| **CONTEXT_DOCUMENT_ROOT** | **/var/www/html/**                                                                                                         |
| **SERVER_ADDR（服务器地址）**    | **10.233.65.45**                                                                                                           |
| **SERVER_PORT（服务器端口）**    | **10800**                                                                                                                  |
| **REMOTE_ADDR（发起远程连接地址）** | **30.0.231.20**                                                                                                            |
| **allow_url_fopen**       | **On**                                                                                                                     |
| **allow_url_include**     | **Off**                                                                                                                    |
- 以及观察支持的协议和封装！

## 3、备份文件下载

### 3.1  网站源码
- 惊心动魄，差点不够时间解了！
- 首先，我以为 Flag 就在网站的备份文件中，所以第一步先要找到相应文件，但是一个个手动输入太麻烦了，再加上如果没有相应的文件网站会返回 **404** 的状态码，又联想到了上面的 python 代码，所以解法如下：
```python
import requests

#试题地址
url = "http://challenge-c4b3f303d52c0407.sandbox.ctfhub.com:10800/"

#网站备份文件名
l1 = ['web','website','backup','back','www','wwwroot','temp']
#网站备份文件名后缀
l2 = ['tar','tar.gz','zip','rar']

for i in range(0,6):
	for j in range(0,3):
		url_test = url + l1[i] + "." + l2[j]
		
		r = requests.get(url_test)
		r.encoding = 'utf-8'
		
		#检查状态码，返回结果
		if r.status_code != 404:
			print(r.status_code)
			print(url_test)
```
- 我以为到这里就结束了，结果发现文件中并没有 Flag。
- 所以，我看了看 50x.html 文件后又想到了这个是离线端，跟在线端应该是不一样的！我应该在网站去访问这些文件，最后找到了 Flag。
>还可以用 dirsearch 工具对网站进行扫描。如： `python3 dirsearch.py -u http://xxx/ -e *`

### 3.2  bak文件
- 这道题也是一道关于备份文件的题，观察过后应该也是要获取它的备份文件。
- 经过搜索，发现 `.bak` 文件是网站源代码的备份文件，于是就可以直接将网站的源代码备份文件直接下载下来，然后修改文件名后缀，将其改为正常的 `.php` 后，打开源代码即可获取 Flag。
>也可以直接用命令 `curl http://xxx/index.php.bak`

### 3.3  vim缓存
- 在使用 vim 时会创建临时缓存文件，关闭 vim 时缓存文件则会被删除。
- 当 vim 异常退出后，因为没有处理缓存文件，导致可以通过缓存文件恢复原始文件内容。
- 以 index.php 为例，第一次会产生 `.index.php.swp`，再次意外退出会产生 `.index.php.swo`，第三次意外退出会产生 `.index.php.swn` 文件。

- 所以，解题第一步，先将 vim 生成的临时文件下载下来。
- 使用命令 `vim -r index.php.swp` 来修复文件，就能看到 Flag 了。

### 3.4  .DS_Store
---
- .DS_Store 是 Mac OS 保存文件夹的自定义属性的隐藏文件，通过这个文件可以知道这个目录里面所有文件的清单。
- 首先，在网站中下载上述文件。
- 直接打开文件发现乱码，搜索“如何打开文件”后，发现打开该文件需要特定工具。
- 再尝试在 Windows 下用记事本打开，留意到了 `Flag is here.`，但没能细心观察到乱码中的“乱中有序”！
- 根据“有序”的内容，在访问网站后，获得 Flag。

## 4、Git 泄露

### 4.1  Log
- 我的评价是全是坑！！！
- 首先，一定不要下载错工具，否则根本做不出来！！！
- 下载的一定要是 **BugScanTeam 的 GitHack**！
- 其次，GitHack 的使用命令有坑！正确的命令是 `python2 GitHack.py http://xxx/.git/`！
>还原后的文件在 `dist/` 目录下
- 根据 `git log` 看到项目的修改，进行回滚即得 Flag。

### 4.2  Stash
- 首先，我们需要了解 Git 中 stash 命令的作用以及使用方法。
- 当你在项目的一部分上工作了一段时间后，所有东西都进入混乱的状态，而你想切换到其他分支去做一点事，且在当前工作空间所做的操作未能提交到版本库时，Git 是不允许这样做的。
- 所以，我们用 `git stash` 命令来将当前工作状态储存起来，然后再切换到其他分支工作，工作完成后再回去取出。
- `git stash` 命令的语法说明如下

|                     命令                      |                              说明                               |
| :-----------------------------------------: | :-----------------------------------------------------------: |
|                 `git stash`                 |                         将当前工作空间的状态保存                          |
|              `git stash list`               |                     查看当前 Git 中“临时”存储的所有状态                     |
|        `git stash apply {stashName}`        |                        根据存储名称读取 Git 存储                        |
|        `git stash drop {stashName}`         |                        根据存储名称删除 Git 存储                        |
|           `git stash save "日志信息"`           |                     将当前工作空间的状态保存并指定一个日志信息                     |
|               `git stash pop`               |             读取 stash 堆栈中的第一个存储，并将该存储从 stash 堆栈中移除             |
|      `git stash show [-p] {stashName}`      |                 查看指定存储与未建立存储时的差异<br>-p：显示详细差异                 |
| `git stash branch {branchName} {stashName}` | 创建并切换到一个新分支来读取指定的存储<br>stashName：存储的名称，默认情况下读取 stash 堆栈中栈顶的存储 |
- 本题，在使用 GitHack 后，进入到相应目录，执行 `git stash list` 命令，查看临时储存的内容，在用 `git stash apply stash@{0}` 将储存的内容提取出来（提交），即可在文件中获得 Flag！

### 4.3  Index
- 额，这个好像直接用 GitHack 将网站克隆下来就好了。
- 或者直接在命令行使用 `git diff` 命令来查看项目的修改，即能得到 Flag。

## 5、SVN 泄露

- 根据题目描述，在 [Github](https://github.com/kost/dvcs-ripper) 下载关于 SVN 泄露的漏洞利用工具 dvcs-ripper。
- 然后，进入相应目录 `cd /home/lucifer/Tools/dvcs-ripper`。
- 安装工具所需要的依赖库。
```bash
sudo apt-get install perl libio-socket-ssl-perl libdbd-sqlite3-perl libclass-dbi-perl libio-all-lwp-perl
```
- 使用 dvcs-ripper 工具将泄露的文件下载到本地目录中
```bash
./rip-svn.pl -u http://xxx/.svn
```
- 查看 .svn 文件夹内容。
- 访问 wc.db 数据来查看是否有这题的 Flag，索引发现有两个文本文件可能存在 Flag。
- 提示说 Flag 在服务器旧版本的源代码上，所以应该检查一下 pristine 文件夹中的文件是否存放 Flag。
- 查看两个文件，发现 Flag。

### 5.1  技术细节（来自腾讯混元 AI）
- .svn 目录下的 pristine 文件夹存放的是工作副本中文件的原始副本。
- 这些原始副本用于 Subversion 客户端在进行版本控制操作时参考，以确保文件的一致性和完整性。
- 下面将详细分析 .svn/pristine 文件夹及相关内容：
1. **原始副本的作用**
   - **存储文件的纯净版本**：当文件被纳入版本控制系统时，Subversion 会在 .svn/pristine 文件夹中保存一份该文件的原始副本。
   - **辅助版本比较和恢复**：这些原始副本有助于 Subversion 在需要时对比文件的不同版本，或在文件损坏时恢复到之前的状态。

2. **原始副本对磁盘空间的影响**
   - **占用额外空间**：虽然原始副本是必要的，但它们会占用额外的磁盘空间，有时甚至与工作副本本身一样大。
   - **管理大型文件的问题**：对于大型项目，尤其是包含大量二进制文件的项目，原始副本的管理成为一个挑战，因为它们可以极大地增加整个工作副本的大小。

3. **管理原始副本**
   - **清理未使用的文件**：可以使用 `svn cleanup` 命令来清理不再需要的文件，这将会移除 .svn/pristine 文件夹中不再使用的文件原始副本。
   - **减少不必要的文件保留**：通过选择性地清理或者使用部分检出的方式，可以减少存储库的大小，从而间接减少 .svn/pristine 文件夹的大小。

4. **自动清理设置**
   - **TortoiseSVN 的清理设置**：在一些 Subversion 客户端，如 TortoiseSVN 中，可以通过设置来自动清理不版本文件及文件夹，帮助优化工作副本的大小。

5. **手动清理方法**
   - **使用终端清理缓存目录**：可以通过终端进入 .svn 缓存目录并查看 pristine 文件夹的大小，然后进行手动清理。

6. **软件工具辅助**
   - **SmartSVN 清理工具**：SmartSVN 提供了便利的清理功能，可以直观地看到清理前后的文件夹大小，并协助进行有效的空间管理。

7. **最佳实践**
   - **定期进行维护**：为保持工作副本的效率和最小化空间占用，应定期进行清理和维护操作。

8. **清理注意事项**
   - **备份重要数据**：在执行任何清理操作之前，确保备份所有重要的工作文件和版本信息，以防意外丢失。

此外，对于版本控制系统的使用和管理，除了上述细节外，还应注意以下几点：
- 避免在版本库中存储不必要的大型文件或二进制文件，这些文件会大大增加版本库的体积，并影响性能。
- 定期审查工作副本的状态，并移除不再需要跟踪的文件和目录，以保持版本库的整洁。
- 考虑使用更高效的版本控制策略，比如使用外部工具管理大型资产，或采取分布式版本控制系统。

综上所述，.svn/pristine 文件夹在 Subversion 版本控制系统中起着关键作用，负责存储工作副本中文件的原始副本。适当管理和清理这些文件可以有效优化工作副本的性能和空间占用。通过理解其工作原理和妥善运用相关工具，可以大幅提高版本控制的效率。

## 6、HG 泄露

- Mercurial 是一种轻量级分布式版本控制系统，采用 Python 语言实现，易于学习和使用，扩展性强。其是基于 GNU General Public License（GPL）授权的开源项目。
- 在 Mercurial 中，本地既可以当做版本库的服务端，也可以当做版本库的客户端。
- 版本库与工作目录不同，版本库存放了所有版本，而工作目录只是因为特定需要存放特定版本。
- 与 SVN 系统不同，SVN 的版本库集中在一台服务器中。这也导致很多初次使用 Mercurial 系统的工作者，因为操作失误导致出现 HG 泄露漏洞的主要原因。

- 还是使用 dvcs-ripper 工具对泄露文件进行下载。
```bash
./rip-hg.pl -u http://xxx/.hg
```
- 但可能会返回 404 和两处完成，可能没有将网站全部文件下载下来。
- 对文件进行一定处理，可以使用正则表达式来查找关键词。
```bash
grep -a -r flag
```
- 打开目标文件或在线访问目标文件位置。