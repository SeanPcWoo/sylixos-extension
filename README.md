# vscode-sylixos


这是一款 vscode 环境下的 SylixOS 开发插件，它开发于个人爱好者，并非 ACOINFO (翼辉信息) 官方。希望这款插件可以给你带来不一样的嵌入式开发体验!
# 支持功能


- 支持工程导入与移除操作；
- 支持与 RealEvoIDE workspace 下的工程 upload 属性无缝配置；
- 支持工程 upload 操作；
- 支持工程 build、clean、clean&build 操作；
- 支持工程 build、clean 的命令自定义配置；
- 支持 C/C++ 代码的智能分析；
- 支持工程 Makefile、.mk 文件的简易解析，且 Makefile 等内容修改同步到智能分析引擎；
- 左侧资源管理器默认设置为双击打开，符合 RealEvoIDE 的使用习惯；
- 支持获取当前工作机器上 RealEvoIDE 之前使用过的部分 'WORKSPACE_XXX' 环境变量；
- VsCode workspace 下的工程也支持类似 RealEvoIDE 的 'WORKSPACE_XXX' 环境变量；


# 使用说明


sylixos 开发插件相对于 **RealEvo-IDE**(_ACOINFO 的专业 SylixOS 开发 IDE_) 而言，保留了开发过程中必备常用的功能，大量不常用的内容被精简了，这些功能开发者可以在插件市场中选择自己需要的优秀插件实现。sylixos 插件的目的是为了借助 vscode 强大的生态环境，来优化您编码和阅读代码的体验，让您即使是开发嵌入式 SylixOS 代码，也能拥有跟开发 js、python 等一样的美的感受。若借助 sylixos 插件，在 vscode 环境下还能相对于 **RealEvo-IDE**，提升您的开发效率，那我将非常开心 ：）


> **郑重说明：vscode sylixos 插件是一款免费开源的开发编码插件，其不提供 SylixOS 开发过程中的任何编译工具链等商业内容的支持！**

# 使用方法
## 准备工作


如上所说 ，使用此插件需确保您已正确安装 ACOINFO 提供的编译工具链, 且正确配置好系统环境变量！
一个可以检测是否能正常使用的方法是在一个 **RealEvo-IDE**的工程录下，直接使用 **cmd.exe**输入 make 进行编译。，如下图，如果可以正常启动 make 进行编译，则说明该插件可以使用：![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1631676435407-b62d21bf-12ce-4ded-b147-5a1e12a8848d.png#align=left&display=inline&height=260&margin=%5Bobject%20Object%5D&name=image.png&originHeight=519&originWidth=993&size=32559&status=done&style=none&width=496.5#id=CiBv8&originHeight=519&originWidth=993&originalType=binary&ratio=1&status=done&style=none)
## 导入/移除工程
导入/移除 SylixOS 工程在 vscode 下就是将文件夹放入/移除 vscode 的工作环境，vscode 与 **RealEvo-IDE**的整体布局结构存在一些差异，具体内容请参考 vscode 官方。因此这里建议在 vscode 的工作区环境(workspace)中使用 vscode sylixos 插件，类似于 **RealEvo-IDE**的workspace 使用逻辑。


当导入工程到 vscode 的 workspace 下后，sylixos 插件会开始对导入的工程自动进行分析，并生成相关的配置内容，其主要分析的内容如下：

- 解析出当前工程是否已经配置了 upload 相关属性，如果解析成功，则会无缝衔接 vscode 下的配置内容；
- 解析当前工程的 Makefile 等文件，生成对应的智能代码分析引擎的配置文件，并存放在工程目录下的 .vscode/c_cpp_properties.json 中；
- 生成当前工程的 build、 clean 等 task 任务；



## build、clean、clean&build 工程


使用 vscode-sylixos 插件编译 SylixOS工程时，可以直接在 vscode 资源管理器里工程的任何地方，或者当前正在编辑的工程文件，使用快捷键[ ctrl + B] 或者右击，即可找到编译选项。


用户也可以针对工程单独设置编译的命令，具体方式如下：

- 右击对应工程目录，选择“打开文件夹设置”；
- 确保配置的“文件夹”属性是对应的工程目录；
- 左侧选择扩展，找到“sylixos”；
- 在“sylixos 编译命令”中，设置对应内容；

![image.png](https://cdn.nlark.com/yuque/0/2021/png/12582765/1636439036768-ddc0b876-64e1-4a01-bb26-537276c2904d.png#clientId=uaa41c0d3-29f9-4&from=paste&height=363&id=u38e7d034&margin=%5Bobject%20Object%5D&name=image.png&originHeight=725&originWidth=1411&originalType=binary&ratio=1&size=79433&status=done&style=none&taskId=u836bb0ab-60ed-454e-b531-77f863d71d0&width=705.5)
## upload 工程
当工程导入成功后，会自动解析出当前工程的 upload 相关属性，如果之前在 **RealEvo-IDE** 中已经设置过，那么此时可以直接右击工程进行一键部署；如果没有设置过，那么也可以向上述设置自定义编译命令一样，进行 upload 的属性配置；
如果当前导入进 vscode 的工程文件夹是  RealEvoIDE 的 workspace 环境下的，那么当前工程的 upload 配置内容可以做到 vscode 与  **RealEvo-IDE** 无缝衔接，也就是在 vscode 里配置了的 upload 内容，下次在  **RealEvo-IDE** 里再次打开这个工程时，同样适用，此时可以在  **RealEvo-IDE** 直接一键部署，不需要二次设置。
​

