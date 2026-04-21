# Daily 日志系统

## 概述
这是一个每日日志记录系统，用于记录日常工作、学习、会议等活动。支持多种日志类型和自动生成。

## 文件结构

```
workspace/daily/
├── README.md              # 本说明文档
├── daily-logger.js        # 日志系统核心
├── 2026-04-21-work-summary.md  # 工作总结示例
└── ...                   # 其他日志文件
```

## 功能特性

### 1. 多种日志类型
- **工作总结** - 记录每日工作完成情况
- **开发日志** - 记录开发过程中的技术细节
- **学习笔记** - 记录学习和知识总结
- **会议记录** - 记录会议内容和决策
- **晚安总结** - 睡前记录和祝福

### 2. 自动生成
- 按日期自动生成文件名
- 自动添加文件头信息
- 支持时间戳和格式化

### 3. 灵活记录
- 可自定义内容模板
- 支持多种文件格式
- 可读取和列出历史日志

## 使用方法

### 基本使用

```javascript
const DailyLogger = require('./daily-logger');

// 创建日志实例
const logger = new DailyLogger();

// 记录工作总结
logger.logWorkSummary({
    completed: '完成了项目文件整理',
    issues: '无重大问题',
    plans: '继续完善文档',
    notes: '工作进展顺利'
});

// 记录开发日志
logger.logDevLog({
    task: '实现提示词处理系统',
    technical: '使用 Node.js 开发',
    changes: '新增了多个功能模块',
    tests: '所有测试通过',
    deployment: '已部署到测试环境',
    issues: '无'
});

// 记录学习笔记
logger.logStudyNote({
    topic: 'VuePress 2.x 新特性',
    content: '学习了新的 API 和配置选项',
    keyPoints: '组件、路由、插件系统',
    application: '应用到项目中',
    references: '官方文档'
});

// 记录会议记录
logger.logMeeting({
    topic: '项目进度评审',
    attendees: '开发团队全体成员',
    discussion: '讨论了当前进度和下一步计划',
    decisions: '决定加快开发进度',
    actions: '本周完成核心功能',
    followUp: '下周评审'
});

// 睡前记录
logger.goodNightSummary({
    completed: '完成了今日所有任务',
    mood: '满足和充实',
    learnings: '学到了很多新知识',
    tomorrow: '继续优化项目',
    wishes: '晚安，好梦'
});
```

### 命令行使用

```bash
# 运行日志系统测试
node workspace/daily/daily-logger.js
```

## 日志文件命名规则

### 自动生成格式
```
YYYY-MM-DD-[类型]-[时间戳].[扩展名]
```

### 示例
- `2026-04-21-work-142300.md` - 工作总结
- `2026-04-21-dev-142300.md` - 开发日志
- `2026-04-21-study-142300.md` - 学习笔记
- `2026-04-21-meeting-142300.md` - 会议记录
- `2026-04-21-goodnight-142300.md` - 晚安总结

### 手动指定文件名
```javascript
logger.writeLog('自定义内容', 'custom-log.md');
```

## 内容模板

### 工作总结模板
```markdown
# 工作总结 - YYYY-MM-DD

## 今日完成的工作

## 遇到的问题

## 明日计划

## 其他记录
```

### 开发日志模板
```markdown
# 开发日志 - YYYY-MM-DD

## 开发任务

## 技术细节

## 代码变更

## 测试结果

## 部署状态

## 问题记录
```

### 晚安总结模板
```markdown
# 晚安总结 - YYYY-MM-DD

## 今日完成 ✅

## 心情记录 😊

## 今日收获 🎯

## 明日计划 📅

## 祝福语 🌙
```

## 高级功能

### 1. 列出日志文件
```javascript
const logger = new DailyLogger();
const recentLogs = logger.listLogs(10); // 最近10个日志
```

### 2. 读取日志文件
```javascript
const content = logger.readLog('2026-04-21-work-summary.md');
```

### 3. 生成工作报告
```javascript
const report = logger.generateDailyReport();
logger.writeLog(report, 'daily-report.md');
```

## 集成到项目

### 1. 在项目中引入
```javascript
const DailyLogger = require('./workspace/daily/daily-logger');

// 创建实例
const logger = new DailyLogger();
```

### 2. 在脚本中使用
```javascript
// 在发布脚本中添加日志记录
async function publishArticles() {
    logger.logDevLog({
        task: '批量发布文章',
        technical: '使用 publish-batch API',
        changes: '成功发布3篇文章',
        tests: '所有文章正常显示',
        deployment: '已发布到线上'
    });
}
```

### 3. 在每日结束时使用
```javascript
// 每日工作结束
function endOfWorkDay() {
    logger.goodNightSummary({
        completed: '完成了今日任务',
        mood: '满足',
        learnings: '学到了新知识',
        tomorrow: '继续开发',
        wishes: '晚安'
    });
}
```

## 最佳实践

### 1. 及时记录
- 完成任务后及时记录
- 遇到问题立即记录
- 学习新知识时记录要点

### 2. 保持结构
- 使用提供的模板
- 内容清晰明了
- 包含关键信息

### 3. 定期回顾
- 每周回顾日志
- 总结经验教训
- 制定改进计划

### 4. 多人协作
- 统一日志格式
- 避免重复记录
- 分享重要信息

## 扩展功能

### 1. 添加新的日志类型
```javascript
// 在 DailyLogger 类中添加新方法
logCustomLog(customData) {
    const template = `# 自定义日志 - ${this.formatDate(new Date())}
...
`;
    return this.writeLog(template, `custom-${this.formatDate(new Date())}.md`);
}
```

### 2. 搜索功能
```javascript
// 可以添加搜索功能
searchLogs(keyword) {
    // 实现搜索逻辑
}
```

### 3. 自动备份
```javascript
// 可以添加自动备份功能
autoBackup() {
    // 将日志备份到其他位置
}
```

## 故障排除

### 常见问题
1. **目录不存在**：确保 `workspace/daily` 目录存在
2. **权限问题**：确保有写入权限
3. **路径问题**：使用正确的绝对路径

### 解决方案
1. 检查目录结构
2. 验证文件权限
3. 使用正确的路径

---
*最后更新：2026年4月21日*
*维护者：Claude Code*