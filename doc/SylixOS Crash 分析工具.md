# 概述	
**SylixOS Crash 分析工具** 是 vscode 下 **SylixOS 开发插件**中提供的工具集中的一个小工具。它可以协助开发者去分析可执行文件产生 crash 行为的原因。


# 工作原理	
**SylixOS Crash 分析工具** 借助 SylixOS 编译器中的 addr2line 命令行对地址进行分析。因此，此工具最终工作原理即调用 addr2line 对可执行文件执行类似下述命令：
```c
xxxx-addr2line.exe -f -e xxx.ko -a 0x1000
```


# 使用方法
**SylixOS Crash 分析工具** 在安装激活了 SylixOS 插件后，就可以正常工作，其操作界面位于 vscode “资源管理器”下，如果所示：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638772695889-c1200b31-5eec-4053-ac83-6c5dcd28697b.png#clientId=ubb562f8f-1bb6-4&from=paste&height=522&id=u67c650ee&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1044&originWidth=1917&originalType=binary&ratio=1&size=164234&status=done&style=none&taskId=ue8447ac1-55c5-4318-b664-3ebbb46e0bf&width=958.5)


## 添加待分析的可执行文件
当可执行文件执行时，发生了崩溃行为，可以采用如下两种方式将可执行文件添加到 **SylixOS Crash 分析工具** 中：
### 自动添加：
如果可执行文件就在当前的 vscode workspace 下，那么可以直接右击可执行文件，选择“SylixOS 可执行文件分析”，如下所示：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638772986253-da1fa3bd-467f-4814-8915-a460bb2371e2.png#clientId=ubb562f8f-1bb6-4&from=paste&height=545&id=u1759e1ae&margin=%5Bobject%20Object%5D&name=image.png&originHeight=887&originWidth=524&originalType=binary&ratio=1&size=62160&status=done&style=none&taskId=u99aa978a-c8d0-4bd0-9db5-999b75c5e35&width=322)
### 手动添加：
如果可执行文件没有办法直接在 vsocde 的 workspace 下添加，则可以通过 **SylixOS Crash 分析工具** 右边的“添加文件”按钮，手动添加，如下所示：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638773863468-7eb8eaac-05d1-4acd-8726-2fd1165f8941.png#clientId=ubb562f8f-1bb6-4&from=paste&height=525&id=ua50a10b2&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&size=181303&status=done&style=none&taskId=u13e06e17-1559-438c-a40a-2e4ae055558&width=960)
#### 

### 注意：

1. 架构获取失败：

如果 **SylixOS Crash 分析工具** 添加可执行文件时，会去自动分析当前可执行文件应该选择哪种架构的 addr2line 工具去执行。如果 **SylixOS Crash 分析工具** 获取架构信息失败时，会弹出如下界面，此时需要用户手动选择对应的架构信息：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638773894320-cd4deb55-f8bc-45d4-89ef-ae9d79e04dc8.png#clientId=ubb562f8f-1bb6-4&from=paste&height=525&id=u2d7a5405&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&size=181618&status=done&style=none&taskId=u30a39651-b7ca-4cf1-844b-cad562214cb&width=960)

2. 可执行文件要求：

添加的 SylixOS 可执行文件不应该选择“strip”目录下的可执行文件，否则会导致无法正确分析地址。


添加成功后，**SylixOS Crash 分析工具** 中会显示添加成功的可执行文件，如下所示：
    ![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638773921718-0547da50-a211-4dda-8919-750b2cfb2c3f.png#clientId=ubb562f8f-1bb6-4&from=paste&height=525&id=ub7b6e3d0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&size=159009&status=done&style=none&taskId=uc8756feb-9e88-4b23-88d1-ce2f1194a2b&width=960)
## 设置运行基地址
在可执行文件添加完成后，默认运行基地址是没有设置的，此时，可以添加对应可执行文件后边的“基地址”进行设置，如下所示：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638773777628-139b6038-5a5a-4679-b09f-456c32fb160a.png#clientId=ubb562f8f-1bb6-4&from=paste&height=525&id=u7d7def7d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&size=166004&status=done&style=none&taskId=u25c7eea0-022e-4a31-a665-9ae29a135d8&width=960)

### 注意：

1. 运行基地址的获取，参考 SylixOS 相关命令和用法，这里提供一些参考：
   - 一般 BSP elf 文件：运行基地址一般设置为：0x0；
   - 一般内核模块的 ko 文件：通过“lsmod”命令可以查看运行基地址；
   - 一般的应用库或者 APP 可执行文件：可以先通过“VPROC_MODULE_SHOW=1”设置 SylixOS 的环境变量，然后再运行可执行文件，进而获取到基地址。
2. 运行基地址设置时，应该是 16 进制的，“0x”包不包含均可，即设置“1000” 和 “0x1000”效果一致；
2. 运行基地址是可以重复更新的，如果运行基地址发生变化，则按照上述方式重新设置即可。

​

设置成功后，会在对应的文件右边显示出当前的基地址设置的值，如下所示：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638774447553-3eb51dd5-7236-4213-9cfa-4bb2daf3d2b1.png#clientId=ubb562f8f-1bb6-4&from=paste&height=525&id=u130c957b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&size=170916&status=done&style=none&taskId=u4dafc8a9-6c67-4dfc-ba9c-2fbc928caad&width=960)
## crash 地址分析
完成上述两步设置后，就可以对需要分析的 crash 地址进行分析，分析的方法很简单：在对应的可执行文件右侧点击“分析”按钮，然后输入 crash 地址，如下所示：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638774587663-df54e0db-22ed-4bfe-afc4-e9bcbae2e844.png#clientId=ubb562f8f-1bb6-4&from=paste&height=525&id=u440ca58b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&size=178234&status=done&style=none&taskId=ufc1a336b-c0e8-4f31-80ca-2b25891d8a5&width=960)
​

分析成功后，会在对应的文件下显示出分析的内容：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638774702686-44b70bee-376d-4854-be8d-277b58f1f2cd.png#clientId=ubb562f8f-1bb6-4&from=paste&height=525&id=ud36697d5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&size=176806&status=done&style=none&taskId=ue0bebb1b-ad3d-4a93-9905-f494fd4ac36&width=960)
其中分析结果格式从左到右分别是：
```c
[crash 地址] crash 函数:crash 代码的行数
```
 同时，当鼠标停留在上面时，会显示对应的文件位置。点击此结果时，会自动打开出错文件，并跳转到出错行附近。

### 注意：

1. 分析的地址应该是 16 进制地址，包不包含“0x”均可；
1. 如果分析失败时，不会在左侧列出分析结果，而是直接将 addr2line 的信息在 vscode 的右侧展示出来，如下:

![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638775096262-9acccdcb-584b-4a03-a085-5b2b1fbb6909.png#clientId=ubb562f8f-1bb6-4&from=paste&height=525&id=u6ad1a1b4&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&size=179653&status=done&style=none&taskId=u2dd702f4-461d-4778-b33b-8c1a0a2f862&width=960)

## 清空分析文件
当需要清空当前所有的分析文件时，可以点击 **SylixOS Crash 分析工具** 右侧的“清空”按钮：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1638775397461-6cb695b3-ec1b-4237-8a48-2c0a8286a161.png#clientId=ubb562f8f-1bb6-4&from=paste&height=525&id=u10c6a1ce&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&size=180976&status=done&style=none&taskId=uce8fd932-32a1-4492-91f6-d6ea0bca058&width=960)


## 其他
当前工具已经支持 crash 分析信息记录功能。用户使用工具分析的所有结果都会同步保存在 workspace 的存储空间中，当 vscode 下次打开时，仍然可以看到之前的分析结果 :)
