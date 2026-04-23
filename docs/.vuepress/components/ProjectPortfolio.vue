<script setup>
import { computed, ref } from 'vue'

const activeRole = ref(null)

// Project data - categorized by role
const projectsByRole = computed(() => [
  {
    role: 'Product Manager',
    roleEn: 'Product Manager',
    description: 'Focus on product design and delivery for AI tools, creator workflows, and educational technology',
    projects: [
      {
        id: 'pm-blog-publishing',
        title: 'Blog Publishing Workflow',
        subtitle: 'Creator Tools',
        category: 'Product Management',
        cover: '/gallery/article-cover-git-release-map.png',
        description: 'Transform article publishing and maintenance from manual operations to automated workflows',
        highlights: ['Batch Publishing', 'Delete Queue', 'Local Persistence', 'AI Cover Generation'],
        technologies: ['VuePress', 'AI Generation', 'Git Workflow'],
        link: '/article/git-release-map.html',
        featured: true
      },
      {
        id: 'pm-ai-cover',
        title: 'AI Cover Generation Workflow',
        subtitle: 'AI Content Operations',
        category: 'Product Management',
        description: 'Establish reliable AI image generation system to ensure cover quality and consistency',
        highlights: ['SiliconFlow Integration', 'Strict Testing', 'Local Storage', 'Failure Visibility'],
        technologies: ['AI API', 'Image Generation', 'Error Handling'],
        link: '/article/ai-key-router-one-api-zcode-ccswitch.html',
        featured: true
      },
      {
        id: 'pm-study-planner',
        title: 'Study Abroad Information Planner',
        subtitle: 'Educational Decision Support',
        category: 'Product Management',
        description: 'Transform personal study abroad research into reusable decision support system',
        highlights: ['Information Architecture', 'Comparison Dimensions', 'Trust and Clarity'],
        technologies: ['Information Design', 'Content Organization', 'User Experience'],
        link: '/study/',
        featured: true
      }
    ]
  },
  {
    role: 'Frontend Development',
    roleEn: 'Frontend Development',
    description: 'Build modern user interfaces and interactive experiences',
    projects: [
      {
        id: 'fe-vuepress-blog',
        title: 'VuePress Technical Blog',
        subtitle: 'Static Website System',
        category: 'Frontend Development',
        description: 'Modern technical blog system based on VuePress, supporting Markdown and code highlighting',
        highlights: ['VuePress 2.x', 'Code Highlighting', 'Responsive Design', 'Dark Theme'],
        technologies: ['VuePress', 'Vite', 'SCSS', 'JavaScript'],
        link: '/article/vuepress-stack-notes.html',
        featured: false
      },
      {
        id: 'fe-ai-tools',
        title: 'AI Tools Integration',
        subtitle: 'Intelligent Workflow',
        category: 'Frontend Development',
        description: 'Integrate multiple AI services to provide intelligent content creation and editing experience',
        highlights: ['Multi-AI Service Support', 'Smart Suggestions', 'Content Optimization'],
        technologies: ['Vue.js', 'AI API', 'Asynchronous Programming'],
        link: '/article/ai-key-router-one-api-zcode-ccswitch.html',
        featured: false
      }
    ]
  },
  {
    role: 'AI Engineer',
    roleEn: 'AI Engineer',
    description: 'Explore practical applications and engineering implementation of AI technology',
    projects: [
      {
        id: 'ai-langchain',
        title: 'LangChain Application Practice',
        subtitle: 'AI Application Framework',
        category: 'AI Engineering',
        description: 'Practice LangChain framework to build complex AI application workflows',
        highlights: ['Chain Calling', 'Memory Management', 'Tool Integration'],
        technologies: ['LangChain', 'OpenAI API', 'Python'],
        link: '/article/langchain.html',
        featured: false
      },
      {
        id: 'ai-infra',
        title: 'AI Infrastructure',
        subtitle: 'Distributed AI System',
        category: 'AI Engineering',
        description: 'Build scalable AI infrastructure supporting large-scale inference and deployment',
        highlights: ['Distributed Inference', 'Load Balancing', 'Performance Optimization'],
        technologies: ['Docker', 'Kubernetes', 'TensorFlow'],
        link: '/article/langchain.html',
        featured: false
      }
    ]
  }
])

// Compute featured projects
const featuredProjects = computed(() =>
  projectsByRole.value.flatMap(role =>
    role.projects.filter(project => project.featured)
  )
)

// Compute all technologies
const allTechnologies = computed(() => {
  const techSet = new Set()
  projectsByRole.value.forEach(role => {
    role.projects.forEach(project => {
      project.technologies.forEach(tech => techSet.add(tech))
    })
  })
  return Array.from(techSet).sort()
})
</script>

<template>
  <main class="lk-projects">
    <!-- Hero Section -->
    <section class="lk-projects__hero">
      <div class="lk-projects__hero-content">
        <h1 class="lk-projects__title">Project Portfolio</h1>
        <p class="lk-projects__subtitle">
          Showcase technical capabilities and product thinking through diverse role-based projects
        </p>
        <div class="lk-projects__hero-meta">
          <span class="lk-projects__role-count">
            {{ projectsByRole.length }} Specializations
          </span>
          <span class="lk-projects__project-count">
            {{ projectsByRole.reduce((total, role) => total + role.projects.length, 0) }} Projects
          </span>
        </div>
      </div>
    </section>

    <!-- Three Column Layout -->
    <section class="lk-projects__content">
      <!-- Left Column: Role Navigation -->
      <div class="lk-projects__left-nav">
        <div class="lk-projects__nav-header">
          <h3>Role Navigation</h3>
          <p class="lk-projects__nav-subtitle">Browse by professional direction</p>
        </div>
        <nav class="lk-projects__nav-list">
          <button
            v-for="role in projectsByRole"
            :key="role.role"
            class="lk-projects__nav-item"
            :class="{ 'lk-projects__nav-item--active': activeRole === role.role }"
            type="button"
            @click="activeRole = activeRole === role.role ? null : role.role"
          >
            <span class="lk-projects__nav-role">{{ role.role }}</span>
            <span class="lk-projects__nav-count">{{ role.projects.length }} projects</span>
          </button>
        </nav>

        <div class="lk-projects__quick-stats">
          <h4>Quick Stats</h4>
          <div class="lk-projects__stat-row">
            <span>Total Projects</span>
            <strong>{{ projectsByRole.reduce((total, role) => total + role.projects.length, 0) }}</strong>
          </div>
          <div class="lk-projects__stat-row">
            <span>Featured Projects</span>
            <strong>{{ featuredProjects.length }}</strong>
          </div>
          <div class="lk-projects__stat-row">
            <span>Specializations</span>
            <strong>{{ projectsByRole.length }}</strong>
          </div>
        </div>

        <div class="lk-projects__tech-skills">
          <h4>Technologies</h4>
          <div class="lk-projects__skill-tags">
            <span v-for="skill in allTechnologies" :key="skill" class="lk-projects__skill-tag">
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- Featured Projects moved to left column -->
        <div class="lk-projects__section-header" style="margin-top: 20px;">
          <h2 class="lk-projects__section-title" style="font-size: 1.1rem;">Featured</h2>
        </div>
        <div class="lk-projects__featured-list">
          <div
            v-for="project in featuredProjects"
            :key="project.id"
            class="lk-projects__featured-card"
            style="padding: 14px;"
          >
            <div class="lk-projects__featured-header" style="margin-bottom: 8px;">
              <span class="lk-projects__project-category">{{ project.category }}</span>
              <a :href="project.link" class="lk-projects__project-link" style="font-size: 0.75rem;">View</a>
            </div>
            <h3 class="lk-projects__project-title" style="font-size: 1rem;">{{ project.title }}</h3>
            <p class="lk-projects__project-subtitle" style="font-size: 0.75rem; margin-bottom: 6px;">{{ project.subtitle }}</p>
          </div>
        </div>

        <div class="lk-projects__info-card">
          <h3>Quick Links</h3>
          <div class="lk-projects__quick-links">
            <a href="/article/" class="lk-projects__quick-link">
              <span class="lk-projects__quick-icon">📝</span>
              <span>Tech Articles</span>
            </a>
            <a href="/tech/" class="lk-projects__quick-link">
              <span class="lk-projects__quick-icon">💻</span>
              <span>Documentation</span>
            </a>
            <a href="/study/" class="lk-projects__quick-link">
              <span class="lk-projects__quick-icon">🎓</span>
              <span>Study Abroad</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Right Column: All Projects Grid -->
      <div class="lk-projects__middle">
        <div class="lk-projects__section-header">
          <h2 class="lk-projects__section-title">Projects Overview</h2>
          <p class="lk-projects__section-subtitle">All projects categorized by role</p>
        </div>

        <div
          v-for="role in projectsByRole"
          :key="role.role"
          class="lk-projects__role-section"
          :class="{ 'lk-projects__role-section--active': activeRole === role.role || !activeRole }"
        >
          <div class="lk-projects__role-header">
            <h2 class="lk-projects__role-title">{{ role.role }}</h2>
            <p class="lk-projects__role-subtitle">{{ role.roleEn }}</p>
            <p class="lk-projects__role-description">{{ role.description }}</p>
          </div>

          <div class="lk-projects__role-projects">
            <div
              v-for="project in role.projects"
              :key="project.id"
              class="lk-projects__project-card"
            >
              <div class="lk-projects__project-card-content">
                <div class="lk-projects__project-card-header">
                  <span class="lk-projects__project-card-category">{{ project.category }}</span>
                  <a :href="project.link" class="lk-projects__project-card-link">View</a>
                </div>
                <h3 class="lk-projects__project-card-title">{{ project.title }}</h3>
                <p class="lk-projects__project-card-subtitle">{{ project.subtitle }}</p>
                <p class="lk-projects__project-card-description">{{ project.description }}</p>

                <div class="lk-projects__project-card-tech">
                  <div class="lk-projects__tech-tags">
                    <span
                      v-for="tech in project.technologies"
                      :key="tech"
                      class="lk-projects__tech-tag"
                    >
                      {{ tech }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.lk-projects {
  width: min(1600px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 40px 0 60px;
  color: var(--vp-c-text-1, #172033);
  position: relative;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* Hero Section */
.lk-projects__hero {
  text-align: center;
  margin-bottom: 60px;
  padding: 40px 20px;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border-radius: 16px;
  border: 1px solid rgba(15, 118, 110, 0.2);
}

.lk-projects__hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.lk-projects__title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 16px;
  background: linear-gradient(135deg, #0f766e 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lk-projects__subtitle {
  font-size: 1.25rem;
  color: var(--vp-c-text-2, #536171);
  margin: 0 0 24px;
  line-height: 1.6;
}

.lk-projects__hero-meta {
  display: flex;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
}

.lk-projects__role-count,
.lk-projects__project-count {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 118, 110, 0.3);
  border-radius: 20px;
  font-weight: 600;
  color: #0f766e;
}

/* Two Column Grid Layout */
.lk-projects__content {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
  margin-top: 40px;
  position: relative;
  width: 100%;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  overflow: visible;
}

/* Left Column: Role Navigation */
.lk-projects__left-nav {
  grid-column: 1;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  margin: 0;
  padding: 12px;
  height: fit-content;
}

.lk-projects__nav-header {
  background: rgba(248, 250, 252, 0.9);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 118, 110, 0.1);
}

.lk-projects__nav-header h3 {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f766e;
}

.lk-projects__nav-subtitle {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.lk-projects__nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lk-projects__nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: rgba(248, 250, 252, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 0.85rem;
  color: #172033;
}

.lk-projects__nav-item:hover {
  background: rgba(15, 118, 110, 0.08);
  border-color: rgba(15, 118, 110, 0.2);
}

.lk-projects__nav-item--active {
  background: rgba(15, 118, 110, 0.1);
  border-color: rgba(15, 118, 110, 0.3);
  font-weight: 600;
  color: #0f766e;
}

.lk-projects__nav-role {
  font-weight: 500;
}

.lk-projects__nav-count {
  font-size: 0.75rem;
  color: #64748b;
  background: rgba(15, 118, 110, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.lk-projects__quick-stats,
.lk-projects__tech-skills {
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(15, 118, 110, 0.1);
  border-radius: 12px;
  padding: 14px;
}

.lk-projects__quick-stats h4,
.lk-projects__tech-skills h4 {
  margin: 0 0 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f766e;
}

.lk-projects__stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(15, 118, 110, 0.1);
  font-size: 0.8rem;
}

.lk-projects__stat-row:last-child {
  border-bottom: none;
}

.lk-projects__stat-row span {
  color: #64748b;
}

.lk-projects__stat-row strong {
  font-weight: 600;
  color: #0f766e;
}

.lk-projects__skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lk-projects__skill-tag {
  font-size: 0.7rem;
  padding: 3px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* Middle Column: Projects Grid */
.lk-projects__middle {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: visible;
}

.lk-projects__role-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
  transition: all 0.3s ease;
}

.lk-projects__role-section:not(.lk-projects__role-section--active) {
  opacity: 0.3;
  pointer-events: none;
}

.lk-projects__role-header {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(15, 118, 110, 0.1);
}

.lk-projects__role-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 6px;
  color: #0f766e;
}

.lk-projects__role-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.lk-projects__role-description {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--vp-c-text-2, #536171);
  max-width: 100%;
  margin: 0;
}

.lk-projects__role-projects {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Right Column: Featured Projects */
.lk-projects__right-sidebar {
  grid-column: 3;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  width: 100%;
  margin: 0;
  padding: 12px;
}

.lk-projects__sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lk-projects__section-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 0 16px;
}

.lk-projects__section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: #0f766e;
}

.lk-projects__section-subtitle {
  font-size: 0.9rem;
  color: var(--vp-c-text-2, #536171);
  margin: 0;
}

.lk-projects__featured-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lk-projects__featured-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(15, 118, 110, 0.2);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 8px 32px rgba(15, 118, 110, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lk-projects__featured-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(15, 118, 110, 0.2);
}

.lk-projects__featured-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.lk-projects__project-category {
  font-size: 0.7rem;
  font-weight: 600;
  color: #0f766e;
  background: rgba(15, 118, 110, 0.1);
  padding: 3px 8px;
  border-radius: 8px;
  text-transform: uppercase;
}

.lk-projects__project-link {
  font-size: 0.8rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.lk-projects__project-link:hover {
  text-decoration: underline;
}

.lk-projects__project-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 6px;
  color: #172033;
}

.lk-projects__project-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 10px;
  font-weight: 500;
}

.lk-projects__project-description {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--vp-c-text-2, #536171);
  margin: 0 0 14px;
}

.lk-projects__project-highlights h4,
.lk-projects__project-tech h4 {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0f766e;
  margin: 0 0 6px;
}

.lk-projects__project-highlights ul {
  margin: 0;
  padding-left: 14px;
}

.lk-projects__project-highlights li {
  font-size: 0.75rem;
  color: var(--vp-c-text-2, #536171);
  margin-bottom: 3px;
  line-height: 1.4;
}

.lk-projects__tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lk-projects__tech-tag {
  font-size: 0.7rem;
  padding: 3px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 8px;
  font-weight: 500;
}

.lk-projects__info-card {
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(15, 118, 110, 0.15);
  border-radius: 12px;
  padding: 16px;
}

.lk-projects__info-card h3 {
  margin: 0 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f766e;
}

.lk-projects__quick-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lk-projects__quick-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(15, 118, 110, 0.1);
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  color: #172033;
}

.lk-projects__quick-link:hover {
  background: rgba(15, 118, 110, 0.05);
  transform: translateY(-1px);
  border-color: rgba(15, 118, 110, 0.2);
}

.lk-projects__quick-icon {
  font-size: 1rem;
}

/* Project Cards */
.lk-projects__project-card {
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(15, 118, 110, 0.15);
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lk-projects__project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 118, 110, 0.15);
}

.lk-projects__project-card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lk-projects__project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.lk-projects__project-card-category {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0f766e;
  background: rgba(15, 118, 110, 0.1);
  padding: 3px 10px;
  border-radius: 10px;
  text-transform: uppercase;
}

.lk-projects__project-card-link {
  font-size: 0.85rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.lk-projects__project-card-link:hover {
  text-decoration: underline;
}

.lk-projects__project-card-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 6px;
  color: #172033;
}

.lk-projects__project-card-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 10px;
  font-weight: 500;
}

.lk-projects__project-card-description {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--vp-c-text-2, #536171);
  margin: 0 0 16px;
}

.lk-projects__project-card-tech {
  margin-top: 12px;
}

/* Dark Theme */
[data-theme='dark'] .lk-projects {
  color: #edf4f2;
}

[data-theme='dark'] .lk-projects__hero {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
  border-color: rgba(94, 234, 212, 0.3);
}

[data-theme='dark'] .lk-projects__title {
  background: linear-gradient(135deg, #6ee7df 0%, #93c5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

[data-theme='dark'] .lk-projects__role-count,
[data-theme='dark'] .lk-projects__project-count {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(94, 234, 212, 0.3);
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__nav-header {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(94, 234, 212, 0.2);
}

[data-theme='dark'] .lk-projects__nav-header h3 {
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__nav-subtitle {
  color: var(--vp-c-text-2, rgba(226, 232, 240, 0.7));
}

[data-theme='dark'] .lk-projects__nav-item {
  background: rgba(15, 23, 42, 0.9);
  color: #edf4f2;
}

[data-theme='dark'] .lk-projects__nav-item:hover {
  background: rgba(15, 118, 110, 0.15);
  border-color: rgba(94, 234, 212, 0.3);
}

[data-theme='dark'] .lk-projects__nav-item--active {
  background: rgba(15, 118, 110, 0.2);
  border-color: rgba(94, 234, 212, 0.4);
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__nav-count {
  background: rgba(15, 118, 110, 0.2);
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__quick-stats,
[data-theme='dark'] .lk-projects__tech-skills {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(94, 234, 212, 0.2);
}

[data-theme='dark'] .lk-projects__quick-stats h4,
[data-theme='dark'] .lk-projects__tech-skills h4 {
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__stat-row {
  border-color: rgba(94, 234, 212, 0.15);
}

[data-theme='dark'] .lk-projects__stat-row span {
  color: var(--vp-c-text-2, rgba(226, 232, 240, 0.7));
}

[data-theme='dark'] .lk-projects__stat-row strong {
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__skill-tag {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.3);
}

[data-theme='dark'] .lk-projects__role-header {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border-color: rgba(94, 234, 212, 0.2);
}

[data-theme='dark'] .lk-projects__role-title {
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__project-card {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(94, 234, 212, 0.2);
}

[data-theme='dark'] .lk-projects__project-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] .lk-projects__project-card-category,
[data-theme='dark'] .lk-projects__project-card-category {
  background: rgba(15, 118, 110, 0.2);
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__project-card-title {
  color: #edf4f2;
}

[data-theme='dark'] .lk-projects__section-title {
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__featured-card {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(94, 234, 212, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

[data-theme='dark'] .lk-projects__featured-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] .lk-projects__project-category {
  background: rgba(15, 118, 110, 0.2);
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__project-title {
  color: #edf4f2;
}

[data-theme='dark'] .lk-projects__tech-tag {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
}

[data-theme='dark'] .lk-projects__info-card {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(94, 234, 212, 0.2);
}

[data-theme='dark'] .lk-projects__info-card h3 {
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__quick-link {
  background: rgba(15, 23, 42, 0.7);
  border-color: rgba(94, 234, 212, 0.15);
  color: #edf4f2;
}

[data-theme='dark'] .lk-projects__quick-link:hover {
  background: rgba(15, 118, 110, 0.1);
  border-color: rgba(94, 234, 212, 0.3);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .lk-projects {
    width: min(1200px, calc(100vw - 40px));
  }

  .lk-projects__content {
    grid-template-columns: 200px 1fr;
    gap: 16px;
  }

  .lk-projects__left-nav {
    padding: 10px;
  }

  .lk-projects__middle {
    padding: 0;
  }

  .lk-projects__title {
    font-size: 2.5rem;
  }

  .lk-projects__section-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 768px) {
  .lk-projects {
    padding: 20px 0 40px;
  }

  .lk-projects__content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .lk-projects__left-nav {
    display: none;
  }

  .lk-projects__middle {
    padding: 0;
  }

  .lk-projects__title {
    font-size: 2rem;
  }

  .lk-projects__hero-meta {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .lk-projects__role-section:not(.lk-projects__role-section--active) {
    opacity: 1;
    pointer-events: auto;
  }

  .lk-projects__section-header {
    padding: 0 12px;
  }

  .lk-projects__role-header {
    padding: 16px;
  }

  .lk-projects__role-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .lk-projects__hero {
    padding: 24px 16px;
  }

  .lk-projects__featured-card,
  .lk-projects__project-card {
    padding: 16px;
  }

  .lk-projects__role-header {
    padding: 14px;
  }

  .lk-projects__role-title {
    font-size: 1.15rem;
  }

  .lk-projects__section-title {
    font-size: 1.15rem;
  }

  .lk-projects__info-card {
    padding: 12px;
  }
}

.lk-projects__project-card {
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(15, 118, 110, 0.1);
  border-radius: 8px;
  padding: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lk-projects__project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 118, 110, 0.15);
}

.lk-projects__project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.lk-projects__project-card-category {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0f766e;
  background: rgba(15, 118, 110, 0.1);
  padding: 3px 10px;
  border-radius: 10px;
  text-transform: uppercase;
}

.lk-projects__project-card-link {
  font-size: 0.85rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.lk-projects__project-card-link:hover {
  text-decoration: underline;
}

.lk-projects__project-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 6px;
  color: #172033;
}

.lk-projects__project-card-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 12px;
  font-weight: 500;
}

.lk-projects__project-card-description {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--vp-c-text-2, #536171);
  margin: 0 0 16px;
}

.lk-projects__project-card-tech {
  margin-top: 16px;
}

/* Dark Theme */
[data-theme='dark'] .lk-projects {
  color: #edf4f2;
}

[data-theme='dark'] .lk-projects__hero {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
  border-color: rgba(94, 234, 212, 0.3);
}

[data-theme='dark'] .lk-projects__title {
  background: linear-gradient(135deg, #6ee7df 0%, #93c5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

[data-theme='dark'] .lk-projects__role-count,
[data-theme='dark'] .lk-projects__project-count {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(94, 234, 212, 0.3);
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__featured-card {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(94, 234, 212, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] .lk-projects__role-header {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border-color: rgba(94, 234, 212, 0.2);
}

[data-theme='dark'] .lk-projects__project-card {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(94, 234, 212, 0.2);
}

[data-theme='dark'] .lk-projects__project-category,
[data-theme='dark'] .lk-projects__project-card-category {
  background: rgba(15, 118, 110, 0.2);
  color: #6ee7df;
}

[data-theme='dark'] .lk-projects__tech-tag {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

/* Responsive Design */
@media (max-width: 768px) {
  .lk-projects {
    width: calc(100vw - 20px);
    padding: 20px 0 40px;
  }

  .lk-projects__title {
    font-size: 2rem;
  }

  .lk-projects__section-title {
    font-size: 1.5rem;
  }

  .lk-projects__hero-meta {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .lk-projects__content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .lk-projects__left {
    position: static;
    max-height: none;
    overflow: visible;
  }

  .lk-projects__role-projects {
    flex-direction: column;
  }

  .lk-projects__project-highlights ul {
    padding-left: 16px;
  }
}

@media (max-width: 480px) {
  .lk-projects__hero {
    padding: 24px 16px;
  }

  .lk-projects__featured-card,
  .lk-projects__project-card {
    padding: 16px;
  }

  .lk-projects__role-header {
    padding: 16px;
  }

  .lk-projects__role-title {
    font-size: 1.25rem;
  }

  .lk-projects__section-title {
    font-size: 1.25rem;
  }

  .lk-projects__featured-list {
    gap: 12px;
  }
}
</style>
