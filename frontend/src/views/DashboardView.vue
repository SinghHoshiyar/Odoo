<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome back, {{ authStore.user?.name }}!</p>
    </div>
    
    <div class="dashboard-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
      
      <!-- Dashboard Grid -->
      <div v-else class="dashboard-grid">
        <!-- Stats Cards -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>{{ dashboardData.stats?.totalSwaps || 0 }}</h3>
              <p>Total Swaps</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
              <h3>{{ dashboardData.stats?.pendingSwaps || 0 }}</h3>
              <p>Pending Swaps</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <h3>{{ dashboardData.stats?.acceptedSwaps || 0 }}</h3>
              <p>Accepted Swaps</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <h3>{{ dashboardData.stats?.completedSwaps || 0 }}</h3>
              <p>Completed Swaps</p>
            </div>
          </div>
        </div>
        
        <!-- Recent Swaps -->
        <div class="recent-swaps-section">
          <div class="card">
            <h2>Recent Swaps</h2>
            <div v-if="recentSwaps.length === 0" class="empty-state">
              <p>No recent swaps found</p>
              <RouterLink to="/skills" class="btn btn-primary">Find Skills to Swap</RouterLink>
            </div>
            <div v-else class="swaps-list">
              <div v-for="swap in recentSwaps" :key="swap._id" class="swap-item">
                <div class="swap-info">
                  <h4>{{ swap.skillRequested.name }} ↔ {{ swap.skillOffered.name }}</h4>
                  <p class="swap-with">with {{ getSwapPartnerName(swap) }}</p>
                  <span :class="['status-badge', swap.status]">{{ swap.status }}</span>
                </div>
                <div class="swap-actions">
                  <button @click="viewSwap(swap._id)" class="btn btn-secondary btn-sm">View</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Skills Overview -->
        <div class="skills-section">
          <div class="card">
            <h2>Your Skills</h2>
            <div class="skills-summary">
              <div class="skill-type">
                <h3>Skills Offered ({{ authStore.user?.skillsOffered?.length || 0 }})</h3>
                <div class="skills-list">
                  <span v-for="skill in authStore.user?.skillsOffered?.slice(0, 3)" :key="skill.name" class="skill-tag">
                    {{ skill.name }}
                  </span>
                  <span v-if="(authStore.user?.skillsOffered?.length || 0) > 3" class="skill-tag more">
                    +{{ (authStore.user?.skillsOffered?.length || 0) - 3 }} more
                  </span>
                </div>
              </div>
              
              <div class="skill-type">
                <h3>Skills Wanted ({{ authStore.user?.skillsWanted?.length || 0 }})</h3>
                <div class="skills-list">
                  <span v-for="skill in authStore.user?.skillsWanted?.slice(0, 3)" :key="skill.name" class="skill-tag wanted">
                    {{ skill.name }}
                  </span>
                  <span v-if="(authStore.user?.skillsWanted?.length || 0) > 3" class="skill-tag more">
                    +{{ (authStore.user?.skillsWanted?.length || 0) - 3 }} more
                  </span>
                </div>
              </div>
            </div>
            
            <div class="skills-actions">
              <RouterLink to="/profile" class="btn btn-primary">Manage Skills</RouterLink>
              <RouterLink to="/skills" class="btn btn-secondary">Browse Skills</RouterLink>
            </div>
          </div>
        </div>
        
        <!-- Notifications -->
        <div class="notifications-section">
          <div class="card">
            <h2>Recent Notifications</h2>
            <div v-if="notifications.length === 0" class="empty-state">
              <p>No recent notifications</p>
            </div>
            <div v-else class="notifications-list">
              <div v-for="notification in notifications.slice(0, 5)" :key="notification._id" class="notification-item">
                <div class="notification-icon">📢</div>
                <div class="notification-content">
                  <h4>{{ notification.title }}</h4>
                  <p>{{ notification.message }}</p>
                  <span class="notification-time">{{ formatDate(notification.createdAt) }}</span>
                </div>
                <div v-if="!notification.isRead" class="notification-unread"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <div class="card">
            <h2>Quick Actions</h2>
            <div class="actions-grid">
              <RouterLink to="/skills" class="action-card">
                <div class="action-icon">🔍</div>
                <h3>Find Skills</h3>
                <p>Browse available skills</p>
              </RouterLink>
              
              <RouterLink to="/swaps" class="action-card">
                <div class="action-icon">🤝</div>
                <h3>My Swaps</h3>
                <p>Manage your swaps</p>
              </RouterLink>
              
              <RouterLink to="/profile" class="action-card">
                <div class="action-icon">👤</div>
                <h3>Profile</h3>
                <p>Edit your profile</p>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const dashboardData = ref({})
const recentSwaps = ref([])
const notifications = ref([])

const fetchDashboardData = async () => {
  try {
    loading.value = true
    
    const [profileRes, swapsRes, notificationsRes] = await Promise.all([
      api.get('/users/profile'),
      api.get('/swaps?limit=5'),
      api.get('/notifications?limit=5')
    ])
    
    dashboardData.value = profileRes.data
    recentSwaps.value = swapsRes.data.swaps || []
    notifications.value = notificationsRes.data.notifications || []
    
    // Update user data in store
    authStore.updateUser(profileRes.data.user)
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    toast.error('Failed to load dashboard data')
  } finally {
    loading.value = false
  }
}

const getSwapPartnerName = (swap) => {
  const currentUserId = authStore.user?._id
  if (swap.requester._id === currentUserId) {
    return swap.provider.name
  } else {
    return swap.requester.name
  }
}

const viewSwap = (swapId) => {
  router.push(`/swaps/${swapId}`)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #6b7280;
  font-size: 1.125rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dashboard-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.stats-section {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 0.5rem;
}

.stat-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.stat-content p {
  color: #6b7280;
  font-size: 0.875rem;
}

.swaps-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.swap-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.swap-info h4 {
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.swap-with {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.accepted {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.completed {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.skills-summary {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.skill-type h3 {
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  padding: 0.25rem 0.75rem;
  background: #e5e7eb;
  color: #374151;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.skill-tag.wanted {
  background: #fef3c7;
  color: #92400e;
}

.skill-tag.more {
  background: #f3f4f6;
  color: #6b7280;
}

.skills-actions {
  display: flex;
  gap: 1rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  position: relative;
}

.notification-icon {
  font-size: 1.25rem;
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.notification-content h4 {
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.notification-content p {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.notification-time {
  color: #9ca3af;
  font-size: 0.75rem;
}

.notification-unread {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.action-card:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.action-card h3 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.action-card p {
  color: #6b7280;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-state p {
  margin-bottom: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .skills-actions {
    flex-direction: column;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
