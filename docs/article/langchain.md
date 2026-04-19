---
title: ai infra
date: 2026-04-19 17:36
---

# ai infra



# 自动搭建

## 大模型  

## 客户端（langchain ）

设计 Agent：决定 AI 什么时候该查资料，什么时候该写代码。

管理 Memory：让 AI 记住用户 5 分钟前说过的话。

编排 Chains：第一步翻译，第二步搜索，第三步总结。
主要是mcp包含零件可以组合由ai决定，以前需要固定好每个动作，大模型的容量太小了

### dify

### coze

## mcpserver

### mcp交互  （统一传输）

任何模型都能够使用，以前一般写一个模型只能给一个用
发的是json说明书

### Host（宿主）

1.  它先从企业的 MCP Server 那里读到标准 JSON 说明书。
2.  如果用户当前在用 GPT-4，Host 就把 JSON 翻译成 GPT 喜欢的格式。
3.  如果用户切换到了 Claude，Host 就立刻把同样的 JSON 翻译成 Claude 喜欢的 XML 风格。

### skill

mcp可以包含多种skills

## 外部工具

Midjourney生成绘画

Figma自己设计

墨刀原型设计



#  AI Agent（智能体）

规划（Planning）+ 记忆（Memory）+ 工具使用（Skills）

skills如果能每天执行的话，就不用人类对话了





