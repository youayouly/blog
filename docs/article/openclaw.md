---
title: openclaw
date: 2026-04-22T04:00:59.216Z
---

#### 🦞 LangChain 环境快速搭建

如果你想在本地玩转大模型，这是最标准的起步流程：

1. **创建虚拟环境**（防止依赖冲突）：

   Bash

   ```
   python -m venv venv
   source venv/bin/activate  # Windows 用 venv\Scripts\activate
   ```

2. **安装核心库**：

   Bash

   ```
   pip install langchain langchain-openai
   ```

3. **配置 API 密钥**（就像你刚才配置 Vercel 一样）： 在项目根目录创建 `.env` 文件：

   代码段

   ```
   OPENAI_API_KEY=你的密钥
   ```
