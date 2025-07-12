<template>
  <div class="skills">
    <!-- Header Section -->
    <div class="skills-header">
      <h1>Browse Skills</h1>
      <p>Discover amazing skills offered by our community</p>
    </div>

    <!-- Search and Filter Section -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search skills..."
            class="search-input"
            @input="handleSearch"
          />
          <div class="search-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div class="filter-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="['tab-button', { 'active': activeTab === tab.key }]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading skills...</p>
    </div>

    <!-- Skills Content -->
    <div v-else class="skills-content">
      <!-- Skills Categories -->
      <div v-if="activeTab === 'categories'" class="skills-categories">
        <div v-for="(skills, category) in skillsCategories" :key="category" class="category-card">
          <h3 class="category-title">{{ category }}</h3>
          <div class="skills-grid">
            <div v-for="skill in skills.slice(0, 6)" :key="skill.name" class="skill-item clickable">
              <div class="skill-content" @click="browseSkillUsers(skill.name)">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-count">{{ skill.count }} users</span>
              </div>
              <div class="skill-actions">
                <button @click.stop="addSkillToProfile(skill.name, 'offered')" class="add-skill-btn offered" title="Add to offered skills">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                </button>
                <button @click.stop="addSkillToProfile(skill.name, 'wanted')" class="add-skill-btn wanted" title="Add to wanted skills">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <button v-if="skills.length > 6" @click="expandCategory(category)" class="view-more-btn">
            View {{ skills.length - 6 }} more
          </button>
        </div>
      </div>

      <!-- Popular Skills -->
      <div v-if="activeTab === 'popular'" class="popular-skills">
        <div class="skills-grid">
          <div v-for="skill in popularSkills" :key="skill.name" class="skill-card">
            <div class="skill-info">
              <h4 class="skill-name">{{ skill.name }}</h4>
              <p class="skill-users">{{ skill.count }} users offering this skill</p>
              <div class="skill-levels">
                <span v-for="(count, level) in skill.popularLevel" :key="level" class="level-badge">
                  {{ level }}: {{ count }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trending Skills -->
      <div v-if="activeTab === 'trending'" class="trending-skills">
        <div class="trending-header">
          <h3>🔥 Trending Skills</h3>
          <p>Popular skills from the last 30 days</p>
        </div>
        <div class="skills-grid">
          <div v-for="skill in trendingSkills" :key="skill.name" class="skill-card trending">
            <div class="skill-info">
              <h4 class="skill-name">{{ skill.name }}</h4>
              <p class="skill-users">{{ skill.recentUsers }} new users</p>
              <div class="trending-badge">Trending</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="activeTab === 'search' && searchResults.length > 0" class="search-results">
        <h3>Search Results for "{{ searchQuery }}"</h3>
        <div class="skills-grid">
          <div v-for="skill in searchResults" :key="skill.name" class="skill-card">
            <div class="skill-info">
              <h4 class="skill-name">{{ skill.name }}</h4>
              <p class="skill-users">{{ skill.count }} users</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="activeTab === 'search' && searchQuery && searchResults.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No skills found</h3>
        <p>Try searching with different keywords</p>
      </div>

      <!-- Platform Stats -->
      <div class="platform-stats">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ platformStats.totalUsers || 0 }}</div>
            <div class="stat-label">Active Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ platformStats.uniqueSkills || 0 }}</div>
            <div class="stat-label">Unique Skills</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ platformStats.totalOfferedSkills || 0 }}</div>
            <div class="stat-label">Skills Offered</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ Math.round(platformStats.avgOfferedSkills || 0) }}</div>
            <div class="stat-label">Avg. Skills per User</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()

// Reactive data
const loading = ref(true)
const searchQuery = ref('')
const activeTab = ref('categories')
const skillsCategories = ref({})
const popularSkills = ref([])
const trendingSkills = ref([])
const searchResults = ref([])
const platformStats = ref({})

const tabs = [
  { key: 'categories', label: 'Categories' },
  { key: 'popular', label: 'Popular' },
  { key: 'trending', label: 'Trending' },
]

// Fetch skills data
const fetchSkillsData = async () => {
  try {
    loading.value = true
    
    // Fetch all data in parallel
    const [categoriesRes, popularRes, trendingRes, statsRes] = await Promise.all([
      api.get('/skills/categories'),
      api.get('/skills/popular?limit=12'),
      api.get('/skills/trending?limit=12'),
      api.get('/skills/stats')
    ])
    
    skillsCategories.value = categoriesRes.data
    popularSkills.value = popularRes.data.skills
    trendingSkills.value = trendingRes.data.skills
    platformStats.value = statsRes.data
    
  } catch (error) {
    console.error('Error fetching skills data:', error)
    toast.error('Failed to load skills data')
  } finally {
    loading.value = false
  }
}

// Handle search
let searchTimeout
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    if (searchQuery.value.trim()) {
      activeTab.value = 'search'
      try {
        const response = await api.get(`/skills/search?q=${encodeURIComponent(searchQuery.value)}`)
        searchResults.value = response.data.skills
      } catch (error) {
        console.error('Search error:', error)
        searchResults.value = []
      }
    } else {
      activeTab.value = 'categories'
      searchResults.value = []
    }
  }, 300)
}

// Watch for search query changes
watch(searchQuery, (newValue) => {
  if (!newValue.trim()) {
    activeTab.value = 'categories'
    searchResults.value = []
  }
})

// Browse users with specific skill
const browseSkillUsers = async (skillName) => {
  try {
    const response = await api.get(`/users/search?skill=${encodeURIComponent(skillName)}`)
    if (response.data.users?.length > 0) {
      // Navigate to a new view that shows users with this skill
      // For now, we'll show a toast with the count
      toast.info(`Found ${response.data.users.length} users offering ${skillName}`)
      // TODO: Navigate to user search results page
      // router.push(`/skills/${encodeURIComponent(skillName)}/users`)
    } else {
      toast.info(`No users currently offering ${skillName}`)
    }
  } catch (error) {
    console.error('Error browsing skill users:', error)
    toast.error('Failed to load users for this skill')
  }
}

// Add skill to user profile
const addSkillToProfile = async (skillName, skillType) => {
  try {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to add skills to your profile')
      router.push('/login')
      return
    }

    const endpoint = skillType === 'offered' ? '/users/skills/offered' : '/users/skills/wanted'
    const defaultLevel = skillType === 'offered' ? 'Intermediate' : undefined
    const defaultPriority = skillType === 'wanted' ? 'Medium' : undefined

    const payload = {
      name: skillName,
      description: '',
      ...(skillType === 'offered' && { level: defaultLevel }),
      ...(skillType === 'wanted' && { priority: defaultPriority })
    }

    await api.post(endpoint, payload)
    
    const skillTypeLabel = skillType === 'offered' ? 'offered' : 'wanted'
    toast.success(`Successfully added "${skillName}" to your ${skillTypeLabel} skills!`)
    
    // Optionally redirect to profile page
    // router.push('/profile')
  } catch (error) {
    console.error('Error adding skill:', error)
    
    if (error.response?.data?.message) {
      toast.error(error.response.data.message)
    } else {
      toast.error('Failed to add skill to your profile')
    }
  }
}

// Expand category to show all skills
const expandCategory = (category) => {
  toast.info(`Expanding ${category} category - feature coming soon!`)
  // TODO: Show expanded view of category
}

// Initialize component
onMounted(() => {
  fetchSkillsData()
})
</script>

<style scoped>
.skills {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.skills-header {
  text-align: center;
  margin-bottom: 3rem;
}

.skills-header h1 {
  font-size: 3rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.skills-header p {
  color: #6b7280;
  font-size: 1.25rem;
}

.search-section {
  margin-bottom: 3rem;
}

.search-container {
  max-width: 600px;
  margin: 0 auto;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1.125rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.filter-tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 0.5rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.tab-button.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.loading-state {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.skills-categories {
  display: grid;
  gap: 2rem;
}

.category-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.category-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.skill-item.clickable {
  cursor: pointer;
}

.skill-item.clickable:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.skill-name {
  font-weight: 500;
  color: #1f2937;
}

.skill-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.skill-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.skill-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.add-skill-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.add-skill-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.add-skill-btn.offered {
  background: #10b981;
  color: white;
}

.add-skill-btn.offered:hover {
  background: #059669;
}

.add-skill-btn.wanted {
  background: #f59e0b;
  color: white;
}

.add-skill-btn.wanted:hover {
  background: #d97706;
}

.skill-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
}

.skill-card.trending {
  border-color: #f59e0b;
  position: relative;
}

.skill-info h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.skill-users {
  color: #6b7280;
  margin-bottom: 1rem;
}

.skill-levels {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.level-badge {
  padding: 0.25rem 0.5rem;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.trending-badge {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.trending-header {
  text-align: center;
  margin-bottom: 2rem;
}

.trending-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.view-more-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.view-more-btn:hover {
  background: #2563eb;
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.platform-stats {
  margin-top: 4rem;
  padding-top: 3rem;
  border-top: 1px solid #e5e7eb;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  text-align: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  color: white;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .skills-header h1 {
    font-size: 2rem;
  }
  
  .skills-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .filter-tabs {
    gap: 0.25rem;
  }
  
  .tab-button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}
</style>
