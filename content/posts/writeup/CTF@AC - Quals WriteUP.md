+++
date = '2025-09-24T10:09:00+08:00'
lastmod = '2025-09-24T10:09:00+08:00'
draft = false
title = 'CTF@AC - Quals WriteUP'
categories = ['WriteUP']
tags = ['WriteUP', 'CTF@AC', '2025']

+++

## Misc

### onions1

给了一个 Tor 浏览器才能访问的地址，我们访问即可得 flag。

```plaintext
2ujjzkrfk4ls4r6vbvvkpn5nyouimcw5hjarezbznvsowfjzup7otdad.onion
```

### octojail

题目源码如下。

```python
#!/usr/bin/env python3

import io, os, re, sys, tarfile, importlib.util, signal

OCTAL_RE = re.compile(r'^[0-7]+$')

def to_bytes_from_octal_triplets(s: str) -> bytes:
    if not OCTAL_RE.fullmatch(s):
        sys.exit("invalid: only octal digits 0-7")
    if len(s) % 3 != 0:
        sys.exit("invalid: length must be multiple of 3")
    if len(s) > 300000:
        sys.exit("too long")
    return bytes(int(s[i:i+3], 8) for i in range(0, len(s), 3))

def safe_extract(tf: tarfile.TarFile, path: str):
    def ok(m: tarfile.TarInfo):
        name = m.name
        return not (name.startswith("/") or ".." in name)
    for m in tf.getmembers():
        if ok(m):
            tf.extract(m, path)

def load_and_run_plugin():
    for candidate in ("uploads/plugin.py", "plugin.py"):
        if os.path.isfile(candidate):
            spec = importlib.util.spec_from_file_location("plugin", candidate)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            if hasattr(mod, "run"):
                return mod.run()
            break
    print("No plugin found.")

def timeout(*_): sys.exit("timeout")
signal.signal(signal.SIGALRM, timeout)
signal.alarm(6)

print("Send octal")
data = sys.stdin.readline().strip()
blob = to_bytes_from_octal_triplets(data)

bio = io.BytesIO(blob)
try:
    with tarfile.open(fileobj=bio, mode="r:*") as tf:
        os.makedirs("uploads", exist_ok=True)
        safe_extract(tf, "uploads")
except Exception as e:
    sys.exit(f"bad archive: {e}")

load_and_run_plugin()
```

这里的代码将每三位数字进行八进制转换成 bytes，然后传入的八进制数据其实是由一个包含 `plugin.py` 的 tar 文件去生成的，服务会解压这个 tar 文件，并且加载解压出来的 `plugin.py` 同时运行 py 文件中的 `run()` 方法，那么我们就可以构造 `plugin.py` 的 `run()` 方法去命令执行，以下是 tar 文件转成特定要求八进制数据的脚本。

```python
import sys

def tar_to_octal(path: str) -> str:
    with open(path, "rb") as f:
        data = f.read()
    # 每个字节转换成 3 位八进制，不足补 0
    return "".join(format(b, "03o") for b in data)

def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} file.tar")
        sys.exit(1)
    
    tar_path = sys.argv[1]
    octal_str = tar_to_octal(tar_path)
    # 输出到 stdout
    print(octal_str)

if __name__ == "__main__":
    main()
```

## Web

### money

![](../assets/24f90f1121bf96271661806bc338b401.png)

题目源码如下。

```python
from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
import os, uuid, zipfile, subprocess, json, time, html
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
app = Flask(__name__)
BASE_DIR = "/opt/app"
PLUGINS_DIR = os.path.join(BASE_DIR, "plugins")
REGISTRY_PATH = os.path.join(BASE_DIR, "plugins.json")
LOG_PATH = os.path.join(BASE_DIR, "app.log")
STORE_DIR = os.path.join(BASE_DIR, "store")
os.makedirs(PLUGINS_DIR, exist_ok=True)
os.makedirs(STORE_DIR, exist_ok=True)
FLAG_ID = ""
if not os.path.exists(REGISTRY_PATH):
    with open(REGISTRY_PATH, "w") as f:
        json.dump([], f)

def log(msg):
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(LOG_PATH, "a") as f:
        f.write(f"{ts} {msg}\n")

def load_registry():
    with open(REGISTRY_PATH) as f:
        return json.load(f)

def save_registry(data):
    with open(REGISTRY_PATH, "w") as f:
        json.dump(data, f)

@app.get("/health")
def health():
    return jsonify({"status":"ok"})

@app.get("/api/products")
def products():
    data = [
        {"id": 1, "name": "Alpha Phone", "category": "Electronics", "price": 699.0},
        {"id": 2, "name": "Beta Tablet", "category": "Electronics", "price": 499.0},
        {"id": 3, "name": "Gamma Laptop", "category": "Electronics", "price": 1299.0},
        {"id": 4, "name": "Delta Headphones", "category": "Accessories", "price": 199.0},
        {"id": 5, "name": "Epsilon Mouse", "category": "Accessories", "price": 49.0},
        {"id": 6, "name": "Zeta Keyboard", "category": "Accessories", "price": 89.0},
        {"id": 7, "name": "Eta Coffee Maker", "category": "Home Appliances", "price": 149.0},
        {"id": 8, "name": "Theta Blender", "category": "Home Appliances", "price": 99.0},
        {"id": 9, "name": "Iota Desk Chair", "category": "Furniture", "price": 259.0},
        {"id": 10, "name": "Kappa Desk", "category": "Furniture", "price": 399.0},
        {"id": 11, "name": "Lambda Sofa", "category": "Furniture", "price": 899.0},
        {"id": 12, "name": "Mu Jacket", "category": "Clothing", "price": 129.0},
        {"id": 13, "name": "Nu Sneakers", "category": "Clothing", "price": 89.0},
        {"id": 14, "name": "Xi Jeans", "category": "Clothing", "price": 59.0},
        {"id": 15, "name": "Omicron Watch", "category": "Luxury", "price": 2499.0}
    ]
    return jsonify({"items": data})

@app.get("/widget/<uid>/<path:filename>")
def widget_file(uid, filename):
    plugin_dir = os.path.join(PLUGINS_DIR, uid)
    return send_from_directory(plugin_dir, filename)

@app.get("/")
def dashboard():
    items = load_registry()
    log(items)
    cards = []
    for it in items:
        uid = it.get("uid")
        name = html.escape(it.get("name", "unknown"))
        version = html.escape(it.get("version", ""))
        author = html.escape(it.get("author", ""))
        icon = html.escape(it.get("icon", ""))
        icon_html = f'<img src="/widget/{uid}/{icon}" alt="{name}" class="card-icon">' if icon else ""
        cards.append(f"""
        <div class="card">
            {icon_html}
            <h3 class="card-title"><a class="link" href="{url_for('widget_page', uid=uid)}">{name}</a></h3>
            <p class="meta"><span class="label">Version</span><span class="value">{version}</span></p>
            <p class="meta"><span class="label">Author</span><span class="value">{author}</span></p>
        </div>
        """)
    cards_html = "\n".join(cards) if cards else "<p class='empty'>No widgets yet. Upload one or unlock the store.</p>"
    has_plugins = len(items) > 2
    store_entries = []
    if has_plugins:
        try:
            for fname in sorted(os.listdir(STORE_DIR)):
                if fname.endswith(".plugin"):
                    safe_name = html.escape(fname)
                    store_entries.append(f"""
                    <div class="card store-card">
                        <h3 class="card-title">{safe_name}</h3>
                        <a class="btn" href="{url_for('store_download', filename=fname)}">Download</a>
                    </div>
                    """)
        except Exception as e:
            log(f"store_list_error err={e}")
    store_html = ""
    if has_plugins:
        store_block = "\n".join(store_entries) if store_entries else "<p class='empty'>Refresh. Something's off.</p>"
    store_html = f"""
        <h2 class="section">Store</h2>
        <div class="cards">{store_block if has_plugins else "<p class='locked'>Sharing is caring. Upload at least one plugin to access the community vault.</p>"}</div>
    """
    return f"""<!doctype html>
    <html>
        <head>
            <meta charset="utf-8">
            <title>VC Portal</title>
            <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
            :root {{
                --bg:#070311;
                --grid1:#1a0f3b;
                --grid2:#0c0520;
                --neon1:#00f0ff;
                --neon2:#ff00e6;
                --neon3:#39ff14;
                --panel:#0e0726;
                --text:#e8e8ff;
                --muted:#9aa0ff;
                --border:rgba(255,255,255,0.12);
            }}
            * {{ box-sizing:border-box }}
            html,body {{ height:100% }}
            body {{
                margin:0;
                font-family:"Press Start 2P", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
                color:var(--text);
                background:
                  radial-gradient(1200px 600px at 50% -200px, rgba(255,0,204,0.15), transparent 60%),
                  linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
                  repeating-linear-gradient(0deg, var(--grid2), var(--grid2) 2px, var(--grid1) 2px, var(--grid1) 4px),
                  radial-gradient(circle at 50% 120%, #120634, #070311 60%);
                overflow-x:hidden;
            }}
            .crt {{
                position:fixed; inset:0; pointer-events:none; mix-blend-mode:overlay;
                background: repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 4px);
                animation: flicker 3s infinite;
            }}
            @keyframes flicker {{
                0% {{ opacity:.15 }}
                50% {{ opacity:.2 }}
                100% {{ opacity:.15 }}
            }}
            .container {{ max-width:1200px; margin:0 auto; padding:24px }}
            .title {{
                font-size:28px; line-height:1.2; letter-spacing:2px; text-transform:uppercase; margin:0 0 8px;
                text-shadow:0 0 8px var(--neon1), 0 0 16px var(--neon2);
            }}
            .subtitle {{ margin:0 0 20px; font-size:12px; color:var(--muted) }}
            .panel {{
                background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                border:1px solid var(--border);
                border-radius:14px;
                padding:16px;
                box-shadow: 0 0 20px rgba(0,255,255,0.08), inset 0 0 30px rgba(255,0,255,0.05);
                backdrop-filter: blur(4px);
            }}
            form.upload {{ display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:18px }}
            input[type="file"] {{
                appearance:none;
                background:var(--panel);
                border:1px dashed rgba(255,255,255,0.25);
                border-radius:10px;
                padding:10px 12px;
                color:var(--text);
                max-width:100%;
            }}
            .btn {{
                display:inline-block; padding:10px 16px; border-radius:12px; text-decoration:none; font-size:12px;
                border:1px solid rgba(255,255,255,0.25);
                background: radial-gradient(120% 120% at 0% 0%, rgba(0,240,255,0.25), rgba(255,0,230,0.25));
                box-shadow: 0 0 12px rgba(0,240,255,0.35), inset 0 0 10px rgba(255,0,230,0.25);
                color:var(--text);
                transition: transform .08s ease, box-shadow .2s ease, filter .2s ease;
            }}
            .btn:hover {{ transform: translateY(-2px); box-shadow: 0 8px 18px rgba(0,240,255,0.45) }}
            .btn:active {{ transform: translateY(0) scale(.99) }}
            .section {{ margin:24px 0 12px; text-shadow:0 0 6px var(--neon3) }}
            .cards {{ display:flex; flex-wrap:wrap; gap:14px }}
            .card {{
                width:220px;
                background: linear-gradient(180deg, rgba(10,4,32,0.9), rgba(6,3,20,0.9));
                border:1px solid rgba(0,240,255,0.25);
                border-radius:16px;
                padding:14px;
                box-shadow: 0 0 12px rgba(0,240,255,0.15), inset 0 0 20px rgba(255,0,230,0.05);
                transition: transform .12s ease, box-shadow .2s ease, filter .2s ease;
                text-align:center;
            }}
            .card:hover {{ transform: translateY(-4px); box-shadow: 0 10px 24px rgba(255,0,230,0.25), 0 0 24px rgba(0,240,255,0.25) }}
            .card-icon {{ width:64px; height:64px; object-fit:contain; display:block; margin:4px auto 8px; image-rendering: pixelated }}
            .card-title {{ margin:6px 0 8px; font-size:12px; min-height:28px }}
            .meta {{ display:flex; justify-content:space-between; font-size:10px; color:var(--muted); margin:4px 0 }}
            .label {{ opacity:.8 }}
            .value {{ color:var(--text) }}
            .link {{ color:var(--neon1); text-decoration:none }}
            .link:hover {{ text-shadow:0 0 8px var(--neon1) }}
            .empty, .locked {{ color:var(--muted); font-size:12px }}
            .grid {{
                position:fixed; inset:0; z-index:-1; perspective:600px; opacity:.6;
                background:
                    linear-gradient(transparent 0 70%, rgba(0,0,0,0.6)),
                    repeating-linear-gradient(0deg, transparent, transparent 38px, rgba(0,240,255,0.12) 39px, rgba(0,240,255,0.12) 40px),
                    repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(255,0,230,0.12) 39px, rgba(255,0,230,0.12) 40px);
                transform: rotateX(60deg) translateY(25vh) scale(1.2);
                filter: drop-shadow(0 0 10px rgba(0,240,255,0.35));
            }}
            .topbar {{
                display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px
            }}
            .tagline {{ font-size:10px; color:var(--muted) }}
            .mono {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:10px; color:var(--muted) }}
            @media (max-width:560px) {{
                .card {{ width:100% }}
                .title {{ font-size:22px }}
                .subtitle {{ font-size:11px }}
            }}
            </style>
        </head>
        <body>
            <div class="grid"></div>
            <div class="crt"></div>
            <div class="container">
                <div class="topbar">
                    <div>
                        <h1 class="title">VC Portal</h1>
                        <p class="tagline">Upload arcade-grade analytics widgets. Feed them with <span class="mono">/api/products</span>.</p>
                    </div>
                </div>
                <div class="panel">
                    <form class="upload" action="/upload" method="post" enctype="multipart/form-data">
                        <input type="file" name="file" accept=".zip,.plugin">
                        <button class="btn" type="submit">Insert Coin</button>
                    </form>
                </div>
                <h2 class="section">Widgets</h2>
                <div class="cards">{cards_html}</div>
                {store_html}
            </div>
        </body>
    </html>"""

KEY = b"SECRET_KEY!123456XXXXXXXXXXXXXXX"

def decrypt_file(input_path, output_path, key):
    with open(input_path, "rb") as f:
        data = f.read()
    iv = data[:16]
    ciphertext = data[16:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    plaintext = unpad(cipher.decrypt(ciphertext), AES.block_size)
    with open(output_path, "wb") as f:
        f.write(plaintext)

@app.get("/store/download/<path:filename>")
def store_download(filename):
    items = load_registry()
    return send_from_directory(STORE_DIR, filename, as_attachment=True) if len(items)>2 else "try harder"

@app.get("/widget/<uid>")
def widget_page(uid):
    plugin_dir = os.path.join(PLUGINS_DIR, uid)
    index_html = os.path.join(plugin_dir, "index.html")
    if not os.path.exists(index_html):
        message = "missing index.html"
        return jsonify({"error":message}), 404
    return send_from_directory(plugin_dir, "index.html")

@app.post("/upload")
def upload():
    if "file" not in request.files:
        return jsonify({"error":"missing file"}), 400
    f = request.files["file"]
    if not f.filename.endswith(".plugin"):
        return jsonify({"error":".plugin file required"}), 400
    uid = str(uuid.uuid4())
    plugin_dir = os.path.join(PLUGINS_DIR, uid)
    os.makedirs(plugin_dir, exist_ok=True)
    enc_path = os.path.join(plugin_dir, f.filename)
    f.save(enc_path)
    dec_zip_path = os.path.join(plugin_dir, "plugin.zip")
    try:
        decrypt_file(enc_path, dec_zip_path, KEY)
    except Exception as e:
        log(f"decrypt_error uid={uid} err={e}")
        return jsonify({"error":"decryption failed"}), 400
    try:
        with zipfile.ZipFile(dec_zip_path, "r") as z:
            z.extractall(plugin_dir)
    except Exception as e:
        log(f"extract_error uid={uid} err={e}")
        return jsonify({"error":"bad zip"}), 400
    manifest_path = os.path.join(plugin_dir, "plugin_manifest.json")
    init_py = os.path.join(plugin_dir, "init.py")
    manifest = {}
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as mf:
            manifest = json.load(mf)
    try:
        name = manifest.get("name")
        version = manifest.get("version")
        author = manifest.get("author")
        icon = manifest["icon"]
    except Exception as e:
        log(f"extract_error uid={uid} err={e}")
        return jsonify({"error":"bad manifest"}), 400
    reg = load_registry()
    reg.append({
        "uid": uid,
        "name": name,
        "version": version,
        "author": author,
        "icon": icon
    })
    save_registry(reg)
    log(f"plugin_registered uid={uid} name={name} version={version} author={author} icon={icon}")
    try:
        log(f"executing_plugin uid={uid} path={init_py}")
        r = subprocess.run(["python","init.py"], cwd=plugin_dir, capture_output=True, text=True, timeout=30)
        global FLAG_ID
        FLAG_ID = uid
        log(f"plugin_stdout uid={uid} out={r.stdout.strip()}")
        log(f"plugin_stderr uid={uid} err={r.stderr.strip()}")
    except Exception as e:
        log(f"exec_error uid={uid} err={e}")
    return redirect(url_for("dashboard"))
    
if __name__ == "__main__":
    import threading
    import time
    import requests
    def delayed_upload(plugin):
        time.sleep(5)
        try:
            files = {'file': (f'{plugin}.plugin', open(f'{STORE_DIR}/{plugin}.plugin', 'rb'))}
            response = requests.post("http://localhost:8080/upload", files=files)
        except Exception as e:
            print("Upload failed:", e)
    threading.Thread(target=delayed_upload, args=("graph",)).start()
    threading.Thread(target=delayed_upload, args=("flag",)).start()
    app.run(host="0.0.0.0", port=8080)
```

代码有点长，我们需要审计一下，总体上看这个项目初始加载了两个 plugin，我们可以通过访问相应得 `/widget/<uid>`，去浏览到一些信息。

我们先按顺序来看看各个功能点，了解它们的作用，首先，我们看到有个明显的 download 路由，但是我们发现，这里要 `items` 大于 2 才可以被触发，`items` 即使安装的 plugin，目前我们这里只有两个 plugin 是不满足条件的。

```python
@app.get("/store/download/<path:filename>")
def store_download(filename):
    items = load_registry()
    return send_from_directory(STORE_DIR, filename, as_attachment=True) if len(items)>2 else "try harder"
```

那么，还有其他类似的地方可以利用吗？诶，还真有，我们发现还有另一处出现了 `send_from_directory` 这个方法，路由后面的 `<path:filename>` 我们是可以进行控制的，也就是说，我们在这里可以下载 `plugin_dir` 路径下的文件了。

```python
@app.get("/widget/<uid>/<path:filename>")
def widget_file(uid, filename):
    plugin_dir = os.path.join(PLUGINS_DIR, uid)
    return send_from_directory(plugin_dir, filename)
```

由于每个 `item` 应该都有相应的 `plugin.zip`，我们尝试去下载这个文件，构造 URL 路径如 `http://url/widget/<uid>/plugin.zip`。

```python
@app.post("/upload")
def upload():
    if "file" not in request.files:
        return jsonify({"error":"missing file"}), 400
    f = request.files["file"]
    if not f.filename.endswith(".plugin"):
        return jsonify({"error":".plugin file required"}), 400
    uid = str(uuid.uuid4())
    plugin_dir = os.path.join(PLUGINS_DIR, uid)
    os.makedirs(plugin_dir, exist_ok=True)
    enc_path = os.path.join(plugin_dir, f.filename)
    f.save(enc_path)
    dec_zip_path = os.path.join(plugin_dir, "plugin.zip")
    # 略
```

我们下载下来的压缩包中有以下内容。

![](../assets/ca5e43f77c118d8690470c18c9d8ef71.png)

打开 `init.py`，发现有以下内容。

```python
import json, sqlite3, pathlib, time, uuid
import os
plugin_dir = pathlib.Path(__file__).resolve().parent
manifest_path = plugin_dir / "plugin_manifest.json"
name, version = "Widget", "1.0.0"
if manifest_path.exists():
    try:
        m = json.loads(manifest_path.read_text())
        name = m.get("name", name)
        version = m.get("version", version)
    except Exception:
        pass


thumb = thumb = f'''<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
<rect x="0" y="0" width="320" height="180" fill="#eef"/>
<text x="50%" y="50" dominant-baseline="middle" text-anchor="middle"
      font-size="48" font-family="sans-serif">🚩</text>
<text x="50%" y="110" dominant-baseline="middle" text-anchor="middle"
      font-size="16" font-family="sans-serif" fill="#444">v{version}</text>
</svg>'''
(plugin_dir / "thumbnail.svg").write_text(thumb)

flag = os.getenv("FLAG","You ran this locally and did not set a dummy flag, dummy.")
print("You cannot see this MUHAHAHAHA:" + flag)

```

一开始，由于存在下面的代码逻辑，我还以为要构造 `xxx.plugin` 文件，去改写里面的 `init.py` 从而 RCE，然后我还想办法去找到 AES 加密真正的 key，于是尝试路径穿越去读文件，但是我们知道 `<path:filename>` 会规范化路径，是没有办法去路径穿越的，所以我们要另寻他法去读到 `server.py`。（其实不用这么麻烦的，看后面就知道了）

```python
	# 略
	try:
        log(f"executing_plugin uid={uid} path={init_py}")
        r = subprocess.run(["python","init.py"], cwd=plugin_dir, capture_output=True, text=True, timeout=30)
        global FLAG_ID
        FLAG_ID = uid
        log(f"plugin_stdout uid={uid} out={r.stdout.strip()}")
        log(f"plugin_stderr uid={uid} err={r.stderr.strip()}")
    except Exception as e:
        log(f"exec_error uid={uid} err={e}")
    return redirect(url_for("dashboard"))
```

确实 `plugin.zip` 中的 `init.py` 会被运行，但是我们更应留意到 `log()`，具体代码如下，他会捕捉 `init.py` 的输出，并且保存到 `LOG_PATH` 中，也就是日志文件中去，也就意味这我们只要能读到这个日志文件，我们就能获取到 `print("You cannot see this MUHAHAHAHA:" + flag)` 中 flag 的值了，我们还是需要去找能够路径穿越的点。

```python
def log(msg):
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(LOG_PATH, "a") as f:
        f.write(f"{ts} {msg}\n")

        # 略

		log(f"executing_plugin uid={uid} path={init_py}")
		r = subprocess.run(["python","init.py"], cwd=plugin_dir, capture_output=True, text=True, timeout=30)
		# 略
		log(f"plugin_stdout uid={uid} out={r.stdout.strip()}")
		log(f"plugin_stderr uid={uid} err={r.stderr.strip()}")
```

此时，我们就留意到 `<uid>`，我们去审计相关路由，发现 `<uid>` 能被我们控制的同时，还没有路径规范化，再结合之前的 `/widget/<uid>/<path:filename>`，我们就能完美地穿越到了上级路径了，而 `LOG_PATH` 正好是 `/opt/app/app.log`，也就是 `PLUGINS_DIR` 即 `/opt/app/plugins/` 路径的上一级。

```python
@app.get("/widget/<uid>")
def widget_page(uid):
    plugin_dir = os.path.join(PLUGINS_DIR, uid)
    index_html = os.path.join(plugin_dir, "index.html")
    if not os.path.exists(index_html):
        message = "missing index.html"
        return jsonify({"error":message}), 404
    return send_from_directory(plugin_dir, "index.html")
```

我们进行如下构造即可读取到 flag，下面的路径相当于真实访问路径 `/opt/app/plugins/../app.log`。

```plaintext
/widget/../app.log
```

![](../assets/16e10e86de8a91daa55d17446ac4fdcb.png)

### random-gallery

用 dirsearch 去扫目录，我们发现存在目录 `/gallery`。

```plaintext
[21:17:32] 308 -  255B  - /gallery  ->  http://ctf.ac.upt.ro:9596/gallery/
[21:17:55] 200 -   1KB - /login
```

然后我们发现有一个 `logged_in` 的 cookie，我猜测是直接将这个值改成 `True` 就可以访问 `/gallery/` 了，结果果然是的。

![](../assets/c3e8340abeb7fee6632fd0bafa945449.png)

进入 gallery 我们发现有几张图片什么的，点进去发现又存在 download 的链接，访问再构造路径穿越，果然能够任意读文件。

```plaintext
/images/animal/../../../../proc/1/environ
```

![](../assets/a84407fb8e338b989fb41fe0ba4e4a62.png)

题目源码如下。

```python
from flask import (
    Flask,
    abort,
    redirect,
    request,
    make_response,
    render_template,
    send_file,
)
from pathlib import Path
from PIL import Image
import re
import io
import os

from config import image_exts, video_exts, all_exts, images_path
from thumbnails import get_thumbnail_path

app = Flask(__name__)


@app.route("/")
def hello():
    if request.cookies.get("logged_in") != "True":
        return redirect("/login")
    return redirect("/gallery")


@app.get("/login")
def login():
    return render_template("login.html")


@app.post("/login")
def do_login():
    username = request.form.get("username")
    password = request.form.get("password")
    if username == os.getenv("WEBGALLERY_USERNAME") and password == os.getenv(
        "WEBGALLERY_PASSWORD"
    ):
        res = make_response(redirect("/gallery"))
        res.set_cookie("logged_in", "True")
        return res
    else:
        res = make_response(render_template("login.html", error="Invalid credentials"))
        res.set_cookie("logged_in", "False")
        return res


@app.route("/images/<path:image_path>")
def serve_image(image_path):
    image_file = images_path / image_path
    if not image_file.exists() or not image_file.is_file():
        abort(404)

    ua = request.headers.get("User-Agent", "").lower()
    accept = request.headers.get("Accept", "").lower()

    supports_webp = "image/webp" in accept

    # Rough detection for old browsers
    if (
        re.search(r"msie|trident", ua)
        or re.search(r"safari/[0-9]{1,2}\\.", ua)
        and "chrome" not in ua
    ):
        supports_webp = False

    # --- Case 1: Convert WebP if not supported ---
    if image_file.suffix.lower() == ".webp" and not supports_webp:
        print("Converting WebP to JPEG on-the-fly:", image_file)
        with Image.open(image_file) as img:
            img = img.convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            buf.seek(0)
            return send_file(buf, mimetype="image/jpeg")

    # --- Case 2: Convert progressive JPEGs to baseline ---
    if image_file.suffix.lower() in [".jpg", ".jpeg"]:
        with Image.open(image_file) as img:
            if img.info.get("progressive"):
                print(
                    "Converting progressive JPEG to baseline JPEG on-the-fly:",
                    image_file,
                )
                buf = io.BytesIO()
                img.convert("RGB").save(
                    buf, format="JPEG", quality=85, progressive=False
                )
                buf.seek(0)
                return send_file(buf, mimetype="image/jpeg")

    # Default: serve original
    return send_file(image_file)


@app.route("/thumbs/<path:image_path>")
def thumbnails(image_path):
    # try:
    image_path = images_path / image_path
    size = request.args.get("s", default=100, type=int)
    thumb_path = get_thumbnail_path(image_path, size)
    return send_file(thumb_path)
    # except FileNotFoundError:
    #     abort(404)
    # except Exception as e:
    #     abort(500)


@app.route("/gallery/", defaults={"folder_path": ""})
@app.route("/gallery/<path:folder_path>")
def gallery(folder_path=""):
    folder_path = Path(folder_path or "")
    folder_abs_path = images_path / folder_path
    if not folder_abs_path.exists() or not folder_abs_path.is_dir():
        abort(404)

    folder_name = folder_path.name or ""
    parent_path = str(folder_path.parent) or ""
    parent_name = folder_path.parent.name or "Root"

    folders = []
    images = []
    for entry in folder_abs_path.iterdir():
        if entry.name.startswith("."):
            continue

        if entry.is_dir():
            folders.append(
                {
                    "path": str(entry.relative_to(images_path)),
                    "name": entry.name,
                    "mtime": entry.stat().st_mtime,
                }
            )
        elif entry.is_file() and entry.suffix.lower() in all_exts:
            images.append(
                {
                    "path": str(entry.relative_to(images_path)),
                    "name": entry.name,
                    "mtime": entry.stat().st_mtime,
                    "type": (
                        "image"
                        if entry.suffix.lower() in image_exts
                        else "video" if entry.suffix.lower() in video_exts else "other"
                    ),
                }
            )

    # Sort by modification time (descending)
    folders.sort(key=lambda f: f["name"], reverse=False)
    images.sort(key=lambda i: i["mtime"], reverse=True)

    return render_template(
        "gallery.html",
        folder_name=folder_name,
        parent_path=parent_path,
        parent_name=parent_name,
        folders=folders,
        images=images,
    )


@app.route("/view/<path:image_path>")
def view_image(image_path):
    image_path_rel = Path(image_path)
    image_path = images_path / image_path_rel
    if (
        not image_path.exists()
        or not image_path.is_file()
        or not image_path.suffix.lower() in all_exts
    ):
        abort(404)

    parent_path = str(image_path.parent.relative_to(images_path)) or ""
    parent_name = image_path_rel.parent.name or "Root"
    image_name = image_path.stem
    is_video = image_path.suffix.lower() in video_exts

    return render_template(
        "view.html",
        parent_path=parent_path,
        parent_name=parent_name,
        image_name=image_name,
        image_path=str(image_path.relative_to(images_path)),
        is_video=is_video,
    )
```

我们分析，发现 `/gallery/` 有列出文件目录的功能，我们尝试构造利用。

```python
@app.route("/gallery/", defaults={"folder_path": ""})
@app.route("/gallery/<path:folder_path>")
def gallery(folder_path=""):
    folder_path = Path(folder_path or "")
    folder_abs_path = images_path / folder_path
    if not folder_abs_path.exists() or not folder_abs_path.is_dir():
        abort(404)

    folder_name = folder_path.name or ""
    parent_path = str(folder_path.parent) or ""
    parent_name = folder_path.parent.name or "Root"

    folders = []
    images = []
    for entry in folder_abs_path.iterdir():
        if entry.name.startswith("."):
            continue

        if entry.is_dir():
            folders.append(
                {
                    "path": str(entry.relative_to(images_path)),
                    "name": entry.name,
                    "mtime": entry.stat().st_mtime,
                }
            )
        elif entry.is_file() and entry.suffix.lower() in all_exts:
            images.append(
                {
                    "path": str(entry.relative_to(images_path)),
                    "name": entry.name,
                    "mtime": entry.stat().st_mtime,
                    "type": (
                        "image"
                        if entry.suffix.lower() in image_exts
                        else "video" if entry.suffix.lower() in video_exts else "other"
                    ),
                }
            )

    # Sort by modification time (descending)
    folders.sort(key=lambda f: f["name"], reverse=False)
    images.sort(key=lambda i: i["mtime"], reverse=True)
```

![](../assets/4e4bf29f235a5fa97db3f9aea8869a8d.png)

我一开始怎么也找不到 flag，后来在一张图片下发现端倪，原来根本不需要这么多漏洞挖掘，原来我才是小丑。

![](../assets/ed01d30c834a9d55e3f9b551ee6e32c1.png)

扫码就有 flag 了。

![](../assets/f601ac8095d4078e2471e07f4514313d.png)

### theme-generator

题目源码如下，首先是 `app.js` 的源码。

```javascript
import express from 'express';
import path from 'path';
import cookieSession from 'cookie-session';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { authMiddleware, requireAuth, requireAdmin, seedAdmin } from './auth.js';
import { deepMerge } from './merge.js';
import { bodyKeyGuard, queryParser } from './waf.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
name: 'sess',
secret: 'not-a-secret',
httpOnly: true,
sameSite: 'lax'
}));

app.set('query parser', str => queryParser(str));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ strict: true }));
app.use(bodyKeyGuard);

app.use(authMiddleware);
seedAdmin(app);

const db = {
    users: new Map(),
    presets: new Map(),
};
app.locals.db = db;

if (!db.users.size) {
    db.users.set('guest', { username: 'guest', password: 'guest', isAdmin: false });
    const crypto = await import('crypto');
    const adminPassword = crypto.randomBytes(12).toString('base64url');
    db.users.set('admin', { username: 'admin', password: adminPassword, isAdmin: true });
    console.log(`[INFO] Admin password: ${adminPassword}`);
}

const DEFAULT_PRESET = Object.freeze({
    theme: { name: 'light', colors: { bg: '#fff', fg: '#111' } },
    options: { compact: false }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 } });

app.get('/', (req, res) => {
    const user = req.user || null;
    res.render('index', { user });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});


app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const u = app.locals.db.users.get(username);
    if (u && u.password === password) {
        req.session.username = u.username;
        return res.redirect('/');
    }
    return res.status(401).render('login', { error: 'Invalid credentials' });
});


app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.get('/dashboard', requireAuth, (req, res) => {
    const preset = app.locals.db.presets.get(req.user.username) || DEFAULT_PRESET;
    res.render('admin', { user: req.user, preset });
});


app.post('/api/preset/upload', requireAuth, upload.single('preset'), (req, res) => {
    try {
        const text = req.file?.buffer?.toString('utf8') ?? '{}';
        let data = {};
        try { data = JSON.parse(text); } catch {
            return res.status(400).send('Invalid JSON');
        }

    for (const k of Object.keys(data)) {
        if (["__proto__", "prototype", "constructor"].includes(k)) {
            return res.status(400).send('blocked');
        }
    }


    const merged = deepMerge({}, DEFAULT_PRESET);
    deepMerge(merged, data);


    app.locals.db.presets.set(req.user.username, merged);
    return res.json({ ok: true, merged });
    } catch (e) {
        return res.status(500).send('error');
    }
});

app.post('/admin/preview', requireAdmin, (req, res) => {
    const payload = req.body || {};
    const widget = typeof payload.widget === 'string' ? payload.widget : '';
    res.render('preview', { user: req.user, widget });
});


app.get('/admin/flag', requireAdmin, (req, res) => {
    const flag = process.env.FLAG || 'Congrats! Contact admin for the flag!';
    res.type('text/plain').send(flag);
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Theme Forge on :${port}`));
```

以及 `merge.js` 的源码。

```javascript
export function deepMerge(target, source) {
    for (const k in source) {
        const val = source[k];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            if (!target[k]) target[k] = {};
            deepMerge(target[k], val);
        } else {
            target[k] = val;
        }
    }
    return target;
}
```

很明显，这里我们要进行原型链污染，来实现获得 admin 权限，访问 `/admin/flag` 路由去获取 flag，我们首先用 `guest/guest` 账号登录进去，但是我们发现源码中是有两处地方存在 WAF 的。

一个是 `waf.js`，一个是在 `app.js` 中，源码如下。

```javascript
// waf.js
import qs from 'qs';

export function bodyKeyGuard(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        const bad = ['__proto__', 'prototype', 'constructor'];
        for (const k of Object.keys(req.body)) {
            if (bad.includes(k)) return res.status(400).send('blocked');
        }
    }
    next();
}

export function queryParser(str) {
    return qs.parse(str, {
        allowPrototypes: true,
        depth: 10,
        allowDots: true,
        parameterLimit: 1000
    });
}

// app.js
app.post('/api/preset/upload', requireAuth, upload.single('preset'), (req, res) => {
    try {
        const text = req.file?.buffer?.toString('utf8') ?? '{}';
        let data = {};
        try { data = JSON.parse(text); } catch {
            return res.status(400).send('Invalid JSON');
        }

    for (const k of Object.keys(data)) {
        if (["__proto__", "prototype", "constructor"].includes(k)) {
            return res.status(400).send('blocked');
        }
    }


    const merged = deepMerge({}, DEFAULT_PRESET);
    deepMerge(merged, data);


    app.locals.db.presets.set(req.user.username, merged);
    return res.json({ ok: true, merged });
    } catch (e) {
        return res.status(500).send('error');
    }
});
```

但是，无一例外，这两处 WAF 都存在漏洞，它们都之间检查了 `Object` 的键值，并没有继续检查深层的键值对，所以我们只要不在首层出现 WAF 关键字，我们就能绕过检测，例如下面这样。

```json
{"exploit": {"__proto__": {...}}}
```

所以，这里完全可以去进行原型链污染，我们再来看看他的鉴权逻辑。

```javascript
export function requireAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) return res.status(403).send('admins only');
    next();
}
```

也就是说，我们只要污染了 `req.user.isAdmin` 属性就可以了，也就是说，只要在 `Object.prototype` 中存在 `isAdmin=True` 我们就可以通过判断了。

```json
{"exploit": {"__proto__": {"isAdmin": true}}}
```

在 `/api/preset/upload` 上传 json 文件即可，然后访问 `/admin/flag` 就可以得到 flag。

### dot-private-key

#### 非预期解

> 竟然还有非预期，我也是服了.......

直接访问下列网址，即可泄露所有信息，包括 flag。

```plaintext
http://ctf.ac.upt.ro:9239/dump
```

#### 预期解

预期解法是在进行 key 查询的时候，我们可以进行 NoSQL 注入，即可查出 flag。

```json
{"key":{"$regex":"ctf{","$options":"i"},"type":{"$regex":".*"}}
```
