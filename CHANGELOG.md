# Change Log
## [Released v0.0.14] - 2022-4-7
### Added
- 无;

### Changed
- 修复某些架构识别编译工具链地址错误的情况;

### Removed
- 无

## [Released v0.0.13] - 2022-1-30
### Added
- 无;

### Changed
- 修复 upload 多文件时，失败的情况;

### Removed
- 无

## [Released v0.0.12] - 2021-12-22
### Added
- 增加 TFTP 服务器工具，支持快速开启、关闭、设置工作内容等功能;

### Changed
- 修改启动时相关日志内容

### Removed
- 无

## [Released v0.0.11] - 2021-12-6
### Added
- 增加 crash 分析工具，支持 crash 信息快速查看，保存等功能;

### Changed
- 修改了 SylixOS 插件日志 focus 的逻辑，防止启动时，不断的 focus 到“输出”窗口，影响操作;

### Removed
- 无

---
## [Released v0.0.10] - 2021-12-1
### Added
- 无

### Changed
- 修复某些工程无法被成功识别加载的情况;

### Removed
- 无

---
## [Released v0.0.9] - 2021-11-15
### Added
- 右击增加‘SylixOS 工程设置’快捷方式。

### Changed
- 临时去除 FTP 一键部署终止功能。

### Removed
- 无

---
## [Released v0.0.8] - 2021-11-15
### Added
- 无

### Changed
- 修复在没有选择任何文件情况下，快捷键使用报错问题。

### Removed
- 无

---
## [Released v0.0.7] - 2021-11-15
### Added
- tasks.json 配置文件新增 ‘clear’ 属性，即每次 build 时会删除之前的结果，保持与 RealEvoIDE 效果一致。

### Changed
- 修复 build 和 upload 快捷键无法使用问题;
- 修复 upload 获取地址失败问题;

### Removed
- 无

---
## [Released v0.0.6] - 2021-11-11
### Added
- 支持工程编译失败或者警告等情况下，筛选出错误内容，在 “问题” 标签栏显示，且支持点击直接跳转产生错误的代码处

### Changed
- 修改了 tasks 的内容保存位置，从 workspaces 的 setting 改为每一个工程的 .vscode;

### Removed
- 无
---
## [Released v0.0.5] - 2021-11-11
### Added
- 无；

### Changed
- 修复了日志 upload 乱码问题；
- 修复了 windows 下无法获取编译器地址问题；
- 更改插件对 vscode 的版本要求为 1.60.0，保证 code server 的正常使用。

### Removed
- 无

---
## [Released v0.0.4] - 2021-11-10
### Added
- 增加了对 Linux 下 vscode 的支持，在 Remote Development 环境下调试可用；

### Changed
- 修复了 tasks 配置失败的问题

### Removed
- 无
---
## [Released v0.0.3] - 2021-11-10
### Added
- 添加插件图标；

### Changed
- 只为 SylixOS 工程目录的文件设置 gbk 编码；
- tasks 添加 version 属性

### Removed
- 无
---
## [Released v0.0.2] - 2021-11-10
### Added
- 添加插件图标；

### Changed
- 将 makefiles 的 规则文件生成路径改为 .vscode 文件夹；

### Removed
- 无
---
## [Released v0.0.1] - 2021-11-9
### Added
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

### Changed
- 无

### Removed
- 无





