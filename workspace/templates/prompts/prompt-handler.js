// 提示词处理器 - 实现半自动化的交互式提示词处理

const AutoCollector = require('./auto-collector');

class PromptHandler {
    constructor(projectPath) {
        this.collector = new AutoCollector(projectPath);
        this.projectInfo = null;
        this.context = {};
        this.userAnswers = {};
    }

    // 处理用户输入
    async handleUserInput(userInput) {
        // 第一步：收集项目信息
        if (!this.projectInfo) {
            this.projectInfo = this.collector.collectBasicInfo();
        }

        // 第二步：分析用户意图
        const intent = this.analyzeIntent(userInput);

        // 第三步：生成上下文
        this.context = this.generateContext(intent);

        // 第四步：确定需要询问的问题
        const questions = this.generateQuestions(intent, this.context);

        // 第五步：生成回复
        const response = this.generateResponse(intent, questions);

        return {
            response: response,
            intent: intent,
            context: this.context,
            pendingQuestions: questions,
            collectedInfo: this.getUserAnswers()
        };
    }

    // 分析用户意图
    analyzeIntent(input) {
        const inputLower = input.toLowerCase();

        // 开发相关
        if (inputLower.includes('添加') || inputLower.includes('新建') || inputLower.includes('实现') || inputLower.includes('开发')) {
            return {
                type: 'development',
                task: this.extractTask(input),
                priority: 'normal'
            };
        }

        // 调试相关
        if (inputLower.includes('错误') || inputLower.includes('失败') || inputLower.includes('报错') ||
            inputLower.includes('不工作') || inputLower.includes('修复') || inputLower.includes('debug')) {
            return {
                type: 'debugging',
                task: this.extractTask(input),
                priority: 'high'
            };
        }

        // 性能相关
        if (inputLower.includes('慢') || inputLower.includes('性能') || inputLower.includes('优化') ||
            inputLower.includes('加速')) {
            return {
                type: 'optimization',
                task: this.extractTask(input),
                priority: 'medium'
            };
        }

        // 部署相关
        if (inputLower.includes('部署') || inputLower.includes('发布') || inputLower.includes('上线') ||
            inputLower.includes('vercel') || inputLower.includes('publish')) {
            return {
                type: 'deployment',
                task: this.extractTask(input),
                priority: 'high'
            };
        }

        // 默认
        return {
            type: 'general',
            task: input,
            priority: 'normal'
        };
    }

    // 提取任务描述
    extractTask(input) {
        // 简单的任务提取，可以根据需要扩展
        const patterns = {
            development: /添加|新建|实现|开发/g,
            debugging: /修复|解决|调试|错误/g,
            optimization: /优化|改进|提升/g,
            deployment: /部署|发布|上线/g
        };

        return input.trim();
    }

    // 生成上下文
    generateContext(intent) {
        return {
            project: this.projectInfo,
            intent: intent,
            environment: this.projectInfo.environment,
            available: {
                scripts: this.collector.getAvailableScripts(),
                files: this.collector.getRelatedFiles(intent.type),
                constraints: this.collector.getConstraints()
            },
            history: this.userAnswers
        };
    }

    // 生成问题
    generateQuestions(intent, context) {
        const questions = [];

        switch (intent.type) {
            case 'development':
                questions.push(...this.getDevelopmentQuestions(context));
                break;
            case 'debugging':
                questions.push(...this.getDebuggingQuestions(context));
                break;
            case 'optimization':
                questions.push(...this.getOptimizationQuestions(context));
                break;
            case 'deployment':
                questions.push(...this.getDeploymentQuestions(context));
                break;
            default:
                questions.push(...this.getGeneralQuestions(context));
        }

        return questions;
    }

    // 开发相关的问题
    getDevelopmentQuestions(context) {
        const questions = [];

        // 检查是否有相关技术栈
        if (!context.project.techStack.includes('VuePress')) {
            questions.push({
                id: 'tech_confirm',
                question: '你想用什么技术栈来实现？',
                type: 'choice',
                options: ['VuePress', 'Next.js', 'React', '其他'],
                required: true
            });
        }

        // 功能范围
        questions.push({
            id: 'scope',
            question: '这个功能的范围是什么？',
            type: 'text',
            required: true,
            default: '基本功能实现'
        });

        // 特殊要求
        questions.push({
            id: 'requirements',
            question: '有什么特殊要求或限制吗？',
            type: 'text',
            required: false
        });

        return questions;
    }

    // 调试相关的问题
    getDebuggingQuestions(context) {
        const questions = [];

        // 错误信息
        questions.push({
            id: 'error_message',
            question: '具体的错误信息是什么？',
            type: 'text',
            required: true,
            hint: '请提供完整的错误信息或提示'
        });

        // 出现环境
        questions.push({
            id: 'environment',
            question: '问题在哪个环境出现？',
            type: 'choice',
            options: ['本地开发', '线上预览', '生产环境', '多个环境'],
            required: true
        });

        // 复现步骤
        questions.push({
            id: 'reproduce',
            question: '如何复现这个问题？',
            type: 'text',
            required: true,
            hint: '请提供详细的复现步骤'
        });

        return questions;
    }

    // 优化相关的问题
    getOptimizationQuestions(context) {
        const questions = [];

        // 优化目标
        questions.push({
            id: 'target',
            question: '你想优化哪个方面？',
            type: 'choice',
            options: ['加载速度', 'SEO', '用户体验', '代码质量', '其他'],
            required: true
        });

        // 当前性能
        questions.push({
            id: 'current_performance',
            question: '当前的性能指标如何？',
            type: 'text',
            required: false,
            hint: '例如：加载时间、分数等'
        });

        // 期望目标
        questions.push({
            id: 'expected',
            question: '期望达到什么效果？',
            type: 'text',
            required: true
        });

        return questions;
    }

    // 部署相关的问题
    getDeploymentQuestions(context) {
        const questions = [];

        // 部署目标
        questions.push({
            id: 'target_env',
            question: '部署到哪个环境？',
            type: 'choice',
            options: ['Vercel', 'GitHub Pages', 'Netlify', '自建服务器', '其他'],
            required: true
        });

        // 环境变量
        questions.push({
            id: 'env_vars',
            question: '需要配置哪些环境变量？',
            type: 'text',
            required: false,
            hint: '例如 API 密钥、数据库连接等'
        });

        // 域名配置
        questions.push({
            id: 'domain',
            question: '是否需要自定义域名？',
            type: 'choice',
            options: ['是', '否', '不确定'],
            required: false
        });

        return questions;
    }

    // 通用问题
    getGeneralQuestions(context) {
        return [
            {
                id: 'clarification',
                question: '能详细描述一下你的需求吗？',
                type: 'text',
                required: true
            }
        ];
    }

    // 生成回复
    generateResponse(intent, questions) {
        const responses = [];

        // 1. 确认理解
        responses.push(`我理解你想${this.getIntentDescription(intent)}。`);

        // 2. 展示已了解的信息
        responses.push('\n根据你的项目情况，我了解到：');
        responses.push(`- 项目类型：${this.projectInfo.techStack.join('、')}`);
        responses.push(`- 环境：${this.getProjectEnvironment()}`);
        responses.push(`- 可用脚本：${Object.keys(this.collector.getAvailableScripts()).join(', ')}`);

        // 3. 询问问题
        if (questions.length > 0) {
            responses.push('\n为了更好地帮助你，请提供以下信息：');
            questions.forEach((q, index) => {
                responses.push(`${index + 1}. ${q.question}`);
                if (q.options) {
                    responses.push(`   选项：${q.options.join('、')}`);
                }
                if (q.hint) {
                    responses.push(`   提示：${q.hint}`);
                }
            });
        }

        // 4. 后续步骤
        responses.push('\n有了这些信息后，我会为你提供具体的解决方案。');

        return responses.join('\n');
    }

    // 获取意图描述
    getIntentDescription(intent) {
        const descriptions = {
            development: '开发新功能',
            debugging: '修复问题',
            optimization: '优化性能',
            deployment: '部署项目',
            general: '完成某项任务'
        };
        return descriptions[intent.type] || '完成某项任务';
    }

    // 获取项目环境描述
    getProjectEnvironment() {
        const env = this.projectInfo.environment;
        let desc = [];

        if (env.hasVercel) desc.push('Vercel');
        if (env.hasGit) desc.push('Git');
        if (env.hasNodeModules) desc.push('依赖已安装');

        return desc.length > 0 ? desc.join('、') : '基础环境';
    }

    // 记录用户回答
    recordAnswer(questionId, answer) {
        this.userAnswers[questionId] = answer;
    }

    // 获取用户回答
    getUserAnswers() {
        return this.userAnswers;
    }

    // 检查是否需要更多信息
    needsMoreInfo() {
        return Object.keys(this.userAnswers).length < 3; // 简单判断
    }
}

// 使用示例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptHandler;

    // 测试
    if (require.main === module) {
        const handler = new PromptHandler(process.cwd());

        // 模拟用户输入
        const testInputs = [
            '添加一个搜索功能',
            '登录页面报错',
            '网站加载很慢',
            '部署到生产'
        ];

        testInputs.forEach(async (input) => {
            console.log(`\n=== 测试输入: ${input} ===`);
            const result = await handler.handleUserInput(input);
            console.log(result.response);
            console.log(`意图: ${result.intent.type}`);
            console.log(`待解决问题: ${result.pendingQuestions.length}`);
        });
    }
}