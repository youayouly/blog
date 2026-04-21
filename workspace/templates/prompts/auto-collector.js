// 自动信息收集器 - 用于AI助手自动获取项目信息

const fs = require('fs');
const path = require('path');

class AutoCollector {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.projectInfo = {};
    }

    // 收集项目基本信息
    collectBasicInfo() {
        try {
            // 读取 package.json
            const packageJsonPath = path.join(this.projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                this.projectInfo.package = {
                    name: packageJson.name,
                    version: packageJson.version,
                    scripts: packageJson.scripts || {},
                    dependencies: packageJson.dependencies || {},
                    devDependencies: packageJson.devDependencies || {}
                };
            }

            // 检测技术栈
            this.detectTechStack();

            // 收集文件结构
            this.collectFileStructure();

            // 收集环境信息
            this.collectEnvironmentInfo();

        } catch (error) {
            console.warn('收集基本信息时出错:', error.message);
        }

        return this.projectInfo;
    }

    // 检测技术栈
    detectTechStack() {
        this.projectInfo.techStack = [];

        // 检查是否是 VuePress 项目
        if (fs.existsSync(path.join(this.projectPath, 'docs')) &&
            fs.existsSync(path.join(this.projectPath, 'docs/.vuepress'))) {
            this.projectInfo.techStack.push('VuePress 2.x');
            this.projectInfo.framework = 'vuepress';

            // 检查主题
            const configPath = path.join(this.projectPath, 'docs/.vuepress/config.js');
            if (fs.existsSync(configPath)) {
                const configContent = fs.readFileSync(configPath, 'utf8');
                if (configContent.includes('theme-hope')) {
                    this.projectInfo.techStack.push('theme-hope');
                }
            }
        }

        // 检查其他框架
        if (fs.existsSync(path.join(this.projectPath, 'next.config.js'))) {
            this.projectInfo.techStack.push('Next.js');
        }
        if (fs.existsSync(path.join(this.projectPath, 'nuxt.config.js'))) {
            this.projectInfo.techStack.push('Nuxt.js');
        }

        // 检查构建工具
        if (fs.existsSync(path.join(this.projectPath, 'vite.config.js'))) {
            this.projectInfo.techStack.push('Vite');
        }
        if (fs.existsSync(path.join(this.projectPath, 'webpack.config.js'))) {
            this.projectInfo.techStack.push('Webpack');
        }
    }

    // 收集文件结构
    collectFileStructure() {
        this.projectInfo.structure = {
            api: [],
            scripts: [],
            docs: [],
            config: [],
            public: []
        };

        // API 路由
        const apiPath = path.join(this.projectPath, 'api');
        if (fs.existsSync(apiPath)) {
            this.listFiles(apiPath, this.projectInfo.structure.api);
        }

        // 脚本文件
        const scriptsPath = path.join(this.projectPath, 'scripts');
        if (fs.existsSync(scriptsPath)) {
            this.listFiles(scriptsPath, this.projectInfo.structure.scripts);
        }

        // 文档
        const docsPath = path.join(this.projectPath, 'docs');
        if (fs.existsSync(docsPath)) {
            this.listFiles(docsPath, this.projectInfo.structure.docs, 2); // 最多2层
        }

        // 配置文件
        const configFiles = ['vercel.json', '.env*', 'config.js', '.vuepress/config.js'];
        configFiles.forEach(file => {
            const fullPath = path.join(this.projectPath, file);
            if (fs.existsSync(fullPath)) {
                this.projectInfo.structure.config.push(file);
            }
        });
    }

    // 列出文件
    listFiles(dir, array, maxDepth = 1, currentDepth = 0) {
        if (currentDepth > maxDepth) return;

        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                array.push(file + '/');
                this.listFiles(fullPath, array, maxDepth, currentDepth + 1);
            } else {
                array.push(file);
            }
        });
    }

    // 收集环境信息
    collectEnvironmentInfo() {
        this.projectInfo.environment = {
            platform: process.platform,
            nodeVersion: process.version,
            cwd: process.cwd(),
            hasNodeModules: fs.existsSync(path.join(this.projectPath, 'node_modules')),
            hasGit: fs.existsSync(path.join(this.projectPath, '.git')),
            hasVercel: fs.existsSync(path.join(this.projectPath, '.vercel'))
        };
    }

    // 获取任务相关信息
    getTaskContext(taskType) {
        const context = {
            project: this.projectInfo,
            availableScripts: this.getAvailableScripts(),
            relatedFiles: this.getRelatedFiles(taskType),
            constraints: this.getConstraints()
        };

        return context;
    }

    // 获取可用的脚本
    getAvailableScripts() {
        const scripts = this.projectInfo.package?.scripts || {};
        const usefulScripts = {};

        // 过滤出有用的脚本
        Object.keys(scripts).forEach(key => {
            if (['dev', 'build', 'start', 'test', 'lint', 'deploy'].includes(key) ||
                key.includes('build') || key.includes('publish') || key.includes('deploy')) {
                usefulScripts[key] = scripts[key];
            }
        });

        return usefulScripts;
    }

    // 获取相关文件
    getRelatedFiles(taskType) {
        const related = {
            development: ['docs/.vuepress/config.js', 'scripts/', 'api/'],
            deployment: ['vercel.json', '.env', 'docs/.vuepress/config.js'],
            debugging: ['api/', 'docs/.vuepress/', 'logs/'],
            optimization: ['docs/.vuepress/styles/', 'docs/.vuepress/public/']
        };

        return related[taskType] || [];
    }

    // 获取约束条件
    getConstraints() {
        const constraints = [];

        if (this.projectInfo.framework === 'vuepress') {
            constraints.push('VuePress 静态网站限制');
            constraints.push('不能使用服务端渲染');
        }

        if (this.projectInfo.environment.hasVercel) {
            constraints.push('Vercel 部署环境限制');
            constraints.push('无服务器函数限制');
        }

        if (!this.projectInfo.environment.hasNodeModules) {
            constraints.push('需要安装依赖');
        }

        return constraints;
    }
}

// 使用示例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoCollector;

    // 如果直接运行，收集当前项目信息
    if (require.main === module) {
        const collector = new AutoCollector(process.cwd());
        const info = collector.collectBasicInfo();
        console.log(JSON.stringify(info, null, 2));
    }
}