// 每日日志系统
const fs = require('fs');
const path = require('path');

class DailyLogger {
    constructor(workspacePath = 'E:\\network\\page\\workspace') {
        this.workspacePath = workspacePath;
        this.dailyPath = path.join(workspacePath, 'daily');
        this.ensureDailyDirectory();
    }

    // 确保日志目录存在
    ensureDailyDirectory() {
        if (!fs.existsSync(this.dailyPath)) {
            fs.mkdirSync(this.dailyPath, { recursive: true });
        }
    }

    // 生成日志文件名
    generateLogFileName(prefix = 'work', suffix = 'md') {
        const date = new Date();
        const dateStr = this.formatDate(date);
        const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${dateStr}-${prefix}-${timestamp}.${suffix}`;
    }

    // 格式化日期
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 写入日志
    writeLog(content, filename = null) {
        const fileName = filename || this.generateLogFileName();
        const filePath = path.join(this.dailyPath, fileName);

        // 添加文件头信息
        const header = `---
title: ${this.formatDate(new Date())} 日志
created: ${new Date().toISOString()}
---

`;

        const fullContent = header + content;

        fs.writeFileSync(filePath, fullContent, 'utf8');
        console.log(`日志已写入: ${filePath}`);
        return filePath;
    }

    // 记录工作总结
    logWorkSummary(summary) {
        const template = `# 工作总结 - ${this.formatDate(new Date())}

## 今日完成的工作

${summary.completed || '无'}

## 遇到的问题

${summary.issues || '无'}

## 明日计划

${summary.plans || '无'}

## 其他记录

${summary.notes || '无'}

---
*自动生成于 ${new Date().toLocaleString('zh-CN')}*
`;
        return this.writeLog(template, `work-summary-${this.formatDate(new Date())}.md`);
    }

    // 记录开发日志
    logDevLog(devInfo) {
        const template = `# 开发日志 - ${this.formatDate(new Date())}

## 开发任务

${devInfo.task || '无'}

## 技术细节

${devInfo.technical || '无'}

## 代码变更

${devInfo.changes || '无'}

## 测试结果

${devInfo.tests || '无'}

## 部署状态

${devInfo.deployment || '无'}

## 问题记录

${devInfo.issues || '无'}

---
*自动生成于 ${new Date().toLocaleString('zh-CN')}*
`;
        return this.writeLog(template, `dev-log-${this.formatDate(new Date())}.md`);
    }

    // 记录学习笔记
    logStudyNote(note) {
        const template = `# 学习笔记 - ${this.formatDate(new Date())}

## 主题

${note.topic || '无'}

## 学习内容

${note.content || '无'}

## 关键要点

${note.keyPoints || '无'}

## 实践应用

${note.application || '无'}

## 参考资料

${note.references || '无'}

---
*自动生成于 ${new Date().toLocaleString('zh-CN')}*
`;
        return this.writeLog(template, `study-note-${this.formatDate(new Date())}.md`);
    }

    // 记录会议记录
    logMeeting(meeting) {
        const template = `# 会议记录 - ${this.formatDate(new Date())}

## 会议主题

${meeting.topic || '无'}

## 参与人员

${meeting.attendees || '无'}

## 讨论内容

${meeting.discussion || '无'}

## 决事项

${meeting.decisions || '无'}

## 行动计划

${meeting.actions || '无'}

## 后续跟进

${meeting.followUp || '无'}

---
*自动生成于 ${new Date().toLocaleString('zh-CN')}*
`;
        return this.writeLog(template, `meeting-${this.formatDate(new Date())}.md`);
    }

    // 列出所有日志文件
    listLogs(limit = 10) {
        const files = fs.readdirSync(this.dailyPath)
            .filter(file => file.endsWith('.md'))
            .sort()
            .reverse();

        return files.slice(0, limit);
    }

    // 读取日志文件
    readLog(filename) {
        const filePath = path.join(this.dailyPath, filename);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
        return null;
    }

    // 生成今日工作报告
    generateDailyReport() {
        const today = this.formatDate(new Date());
        const todayFiles = this.listLogs(100).filter(file => file.startsWith(today));

        let report = `# 今日工作报告 - ${today}\n\n`;
        report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
        report += `相关日志文件: ${todayFiles.length} 个\n\n`;

        todayFiles.forEach(file => {
            const content = this.readLog(file);
            if (content) {
                const titleMatch = content.match(/^# (.+)$/m);
                const title = titleMatch ? titleMatch[1] : file;
                report += `- [${title}](${file})\n`;
            }
        });

        return report;
    }

    // 睡前记录（晚安总结）
    goodNightSummary(daySummary) {
        const template = `# 晚安总结 - ${this.formatDate(new Date())}

## 今日完成 ✅

${daySummary.completed || '今日完成了重要工作'}

## 心情记录 😊

${daySummary.mood || '心情愉快'}

## 今日收获 🎯

${daySummary.learnings || '学到了新知识'}

## 明日计划 📅

${daySummary.tomorrow || '期待新的一天'}

## 祝福语 🌙

${daySummary.wishes || '晚安，祝好梦'}

---

*记录于 ${new Date().toLocaleString('zh-CN')}*
*Good night and have a sweet dream! 🌙*
`;
        return this.writeLog(template, `goodnight-${this.formatDate(new Date())}.md`);
    }
}

// 使用示例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailyLogger;

    // 如果直接运行，测试日志功能
    if (require.main === module) {
        const logger = new DailyLogger();

        // 测试工作总结
        const summary = {
            completed: '完成了项目文件整理和提示词系统开发',
            issues: '无重大问题',
            plans: '继续完善文档和测试',
            notes: '文件整理大大提高了项目结构清晰度'
        };

        logger.logWorkSummary(summary);

        // 测试晚安记录
        const nightSummary = {
            completed: '完成了所有计划工作',
            mood: '满足和充实',
            learnings: '半自动化提示词系统的实现',
            tomorrow: '继续优化和完善',
            wishes: '晚安，明天继续加油！'
        };

        logger.goodNightSummary(nightSummary);

        console.log('日志测试完成！');
    }
}