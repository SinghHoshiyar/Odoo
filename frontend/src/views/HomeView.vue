<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          Exchange Skills,
          <span class="hero-highlight">Build Community</span>
        </h1>
        <p class="hero-description">
          Connect with others to teach what you know and learn what you need. 
          Our skill-swapping platform makes it easy to share knowledge and grow together.
        </p>
        <div class="hero-actions">
          <RouterLink 
            v-if="!authStore.isAuthenticated" 
            to="/register" 
            class="btn btn-primary btn-large"
          >
            Get Started
          </RouterLink>
          <RouterLink 
            v-else 
            to="/dashboard" 
            class="btn btn-primary btn-large"
          >
            Go to Dashboard
          </RouterLink>
          <RouterLink to="/skills" class="btn btn-secondary btn-large">
            Browse Skills
          </RouterLink>
        </div>
      </div>
      <div class="hero-visual">
        <div class="skill-cards">
          <div class="skill-card" v-for="skill in featuredSkills" :key="skill.name">
            <div class="skill-icon">{{ skill.icon }}</div>
            <div class="skill-name">{{ skill.name }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Users and Skills Section -->
    <section class="users-skills">
      <h2>Users & Their Offered Skills</h2>
      <div class="users-list">
        <div class="user-card" v-for="user in users" :key="user._id">
          <h3>{{ user.name }}</h3>
          <ul>
            <li v-for="skill in user.skillsOffered" :key="skill.name">
              {{ skill.name }} - Level: {{ skill.level }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="features-header">
        <h2>How SkillSwap Works</h2>
        <p>Connect, share, and grow your skills in three simple steps</p>
      </div>
      <div class="features-grid">
        <div class="feature-card" v-for="feature in features" :key="feature.title">
          <div class="feature-icon">
            <component :is="feature.icon" />
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
      <div class="stats-grid">
        <div class="stat-item" v-for="stat in stats" :key="stat.label">
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta" v-if="!authStore.isAuthenticated">
      <div class="cta-content">
        <h2>Ready to Start Swapping Skills?</h2>
        <p>Join our community of learners and teachers today</p>
        <div class="cta-actions">
          <RouterLink to="/register" class="btn btn-primary btn-large">
            Sign Up Now
          </RouterLink>
          <RouterLink to="/login" class="btn btn-secondary btn-large">
            Sign In
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { UserPlusIcon, SearchIcon, HandshakeIcon } from 'lucide-vue-next'
import api from '@/services/api'

const authStore = useAuthStore()

const users = ref([])

onMounted(async () => {
  try {
    // Use public search endpoint to get users with skills
    const response = await api.get('/api/users/search')
    users.value = response.data.users
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
})

const featuredSkills = ref([
  { name: 'Photography', icon: '📸' },
  { name: 'Cooking', icon: '👨‍🍳' },
  { name: 'Programming', icon: '💻' },
  { name: 'Guitar', icon: '🎸' },
  { name: 'Language', icon: '🗣️' },
  { name: 'Design', icon: '🎨' }
])

const features = ref([
  {
    icon: UserPlusIcon,
    title: '1. Create Your Profile',
    description: 'List the skills you can teach and what you want to learn. Set your availability and preferences.'
  },
  {
    icon: SearchIcon,
    title: '2. Find Perfect Matches',
    description: 'Browse through our community and find people who want to learn what you teach and can teach what you need.'
  },
  {
    icon: HandshakeIcon,
    title: '3. Start Swapping',
    description: 'Connect with your matches, schedule sessions, and start exchanging knowledge in a mutually beneficial way.'
  }
])

const stats = ref([
  { number: '1,200+', label: 'Active Users' },
  { number: '500+', label: 'Skills Available' },
  { number: '2,000+', label: 'Successful Swaps' },
  { number: '95%', label: 'Satisfaction Rate' }
])
</script>

<style scoped>
.home {
  max-width: 100%;
}

/* Hero Section */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  padding: 4rem 0;
  min-height: 60vh;
}

.hero-content {
  max-width: 100%;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.hero-highlight {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-description {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1rem;
}

.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.skill-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  perspective: 1000px;
}

.skill-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  animation: float 6s ease-in-out infinite;
}

.skill-card:nth-child(2n) {
  animation-delay: -2s;
}

.skill-card:nth-child(3n) {
  animation-delay: -4s;
}

.skill-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}

.skill-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.skill-name {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Users and Skills Section */
.users-skills {
  padding: 4rem 0;
  background: white;
  margin: 2rem -1rem 0;
}

.users-skills h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
  text-align: center;
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.user-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}

.user-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.user-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-card li {
  padding: 0.5rem 0;
  color: #6b7280;
  border-bottom: 1px solid #f3f4f6;
}

.user-card li:last-child {
  border-bottom: none;
}

/* Features Section */
.features {
  padding: 6rem 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  margin: 4rem -1rem 0;
}

.features-header {
  text-align: center;
  margin-bottom: 4rem;
}

.features-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.features-header p {
  font-size: 1.125rem;
  color: #6b7280;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.feature-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
}

.feature-icon :deep(svg) {
  width: 2rem;
  height: 2rem;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.feature-description {
  color: #6b7280;
  line-height: 1.6;
}

/* Stats Section */
.stats {
  padding: 4rem 0;
  background: #1f2937;
  margin: 0 -1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1.125rem;
  color: #9ca3af;
  font-weight: 500;
}

/* CTA Section */
.cta {
  padding: 6rem 0;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  text-align: center;
  margin: 4rem -1rem 0;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
}

.cta h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.cta p {
  font-size: 1.25rem;
  color: #e0e7ff;
  margin-bottom: 2rem;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta .btn-secondary {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.cta .btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
    padding: 2rem 0;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-description {
    font-size: 1.125rem;
  }

  .skill-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .features {
    padding: 4rem 0;
    margin: 2rem -1rem 0;
  }

  .features-header h2 {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .stats {
    padding: 3rem 0;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-number {
    font-size: 2.5rem;
  }

  .cta {
    padding: 4rem 0;
    margin: 2rem -1rem 0;
  }

  .cta h2 {
    font-size: 2rem;
  }

  .cta-actions {
    flex-direction: column;
    align-items: center;
  }

  .cta-actions .btn {
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .hero-actions {
    flex-direction: column;
  }

  .hero-actions .btn {
    width: 100%;
  }

  .skill-cards {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
