<template>
  <div class="user-detail">
    <div class="user-header">
      <button @click="$router.go(-1)" class="btn btn-secondary">← Back</button>
      <h1>User Profile</h1>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading user profile...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>{{ error }}</h3>
      <RouterLink to="/skills" class="btn btn-primary">Browse Skills</RouterLink>
    </div>
    
    <!-- User Profile -->
    <div v-else-if="user" class="user-profile">
      <!-- Profile Header -->
      <div class="profile-header-card">
        <div class="profile-info">
          <div class="profile-avatar">
            <img v-if="user.profilePhoto" :src="getPhotoUrl(user.profilePhoto)" alt="Profile" class="avatar-image" />
            <div v-else class="avatar-placeholder">
              <span>{{ user.name?.charAt(0) || 'U' }}</span>
            </div>
          </div>
          <div class="profile-details">
            <h2>{{ user.name }}</h2>
            <p v-if="user.location" class="location">📍 {{ user.location }}</p>
            <div class="rating-display">
              <span class="rating-stars">⭐</span>
              <span class="rating-value">{{ user.rating?.average?.toFixed(1) || 'N/A' }}</span>
              <span class="rating-count">({{ user.rating?.count || 0 }} reviews)</span>
            </div>
            <div class="join-date">Joined {{ formatJoinDate(user.joinedAt) }}</div>
          </div>
        </div>
        
        <div class="profile-actions" v-if="!isOwnProfile">
          <button @click="showSwapModal = true" class="btn btn-primary">Request Skill Swap</button>
        </div>
      </div>
      
      <!-- Skills Section -->
      <div class="skills-grid">
        <!-- Skills Offered -->
        <div class="card">
          <h3>Skills Offered ({{ user.skillsOffered?.length || 0 }})</h3>
          <div v-if="user.skillsOffered?.length === 0" class="empty-skills">
            <p>No skills offered yet</p>
          </div>
          <div v-else class="skills-list">
            <div v-for="skill in user.skillsOffered" :key="skill.name" class="skill-card offered">
              <div class="skill-header">
                <h4>{{ skill.name }}</h4>
                <span class="skill-level">{{ skill.level }}</span>
              </div>
              <p v-if="skill.description">{{ skill.description }}</p>
              <button v-if="!isOwnProfile" @click="requestSkill(skill)" class="btn btn-sm btn-primary">Request This Skill</button>
            </div>
          </div>
        </div>
        
        <!-- Skills Wanted -->
        <div class="card">
          <h3>Skills Wanted ({{ user.skillsWanted?.length || 0 }})</h3>
          <div v-if="user.skillsWanted?.length === 0" class="empty-skills">
            <p>No skills wanted yet</p>
          </div>
          <div v-else class="skills-list">
            <div v-for="skill in user.skillsWanted" :key="skill.name" class="skill-card wanted">
              <div class="skill-header">
                <h4>{{ skill.name }}</h4>
                <span :class="['skill-priority', skill.priority.toLowerCase()]">{{ skill.priority }} Priority</span>
              </div>
              <p v-if="skill.description">{{ skill.description }}</p>
              <button v-if="!isOwnProfile && canOfferSkill(skill.name)" @click="offerSkill(skill)" class="btn btn-sm btn-secondary">I Can Teach This</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Availability -->
      <div class="card">
        <h3>Availability</h3>
        <div class="availability-display">
          <div v-if="!hasAvailability" class="no-availability">
            <p>No availability information provided</p>
          </div>
          <div v-else class="availability-tags">
            <span v-if="user.availability?.weekdays" class="availability-tag">Weekdays</span>
            <span v-if="user.availability?.weekends" class="availability-tag">Weekends</span>
            <span v-if="user.availability?.mornings" class="availability-tag">Mornings</span>
            <span v-if="user.availability?.afternoons" class="availability-tag">Afternoons</span>
            <span v-if="user.availability?.evenings" class="availability-tag">Evenings</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Swap Request Modal -->
    <div v-if="showSwapModal" class="modal-overlay" @click="closeSwapModal">
      <div class="modal-content" @click.stop>
        <h3>Request Skill Swap with {{ user?.name }}</h3>
        <form @submit.prevent="submitSwapRequest" class="swap-form">
          <div class="form-group">
            <label class="form-label">I want to learn:</label>
            <select v-model="swapForm.skillRequestedId" class="form-select" required>
              <option value="">Select a skill {{ user?.name }} offers</option>
              <option v-for="skill in user?.skillsOffered" :key="skill.name" :value="skill._id || skill.name">
                {{ skill.name }} ({{ skill.level }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">I can offer in return:</label>
            <select v-model="swapForm.skillOfferedId" class="form-select" required>
              <option value="">Select a skill you offer</option>
              <option v-for="skill in mySkills" :key="skill.name" :value="skill._id || skill.name">
                {{ skill.name }} ({{ skill.level }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Message:</label>
            <textarea 
              v-model="swapForm.message" 
              class="form-textarea" 
              rows="4" 
              placeholder="Introduce yourself and explain why you'd like to swap skills..."
              required
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeSwapModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submittingSwap">{{ submittingSwap ? 'Sending...' : 'Send Request' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const error = ref(null)
const user = ref(null)
const mySkills = ref([])
const showSwapModal = ref(false)
const submittingSwap = ref(false)

const swapForm = reactive({
  skillRequestedId: '',
  skillOfferedId: '',
  message: ''
})

const isOwnProfile = computed(() => {
  return user.value?._id === authStore.user?._id
})

const hasAvailability = computed(() => {
  const availability = user.value?.availability
  if (!availability) return false
  return availability.weekdays || availability.weekends || availability.mornings || availability.afternoons || availability.evenings
})

const fetchUser = async () => {
  try {
    loading.value = true
    error.value = null
    
    const userId = route.params.id
    const response = await api.get(`/users/${userId}`)
    user.value = response.data.user
    
    // If this is not our own profile, fetch our skills for swap requests
    if (!isOwnProfile.value) {
      const myProfileResponse = await api.get('/users/profile')
      mySkills.value = myProfileResponse.data.user.skillsOffered || []
    }
    
  } catch (err) {
    console.error('Error fetching user:', err)
    if (err.response?.status === 404) {
      error.value = 'User not found'
    } else if (err.response?.status === 403) {
      error.value = 'This profile is private'
    } else {
      error.value = 'Failed to load user profile'
    }
  } finally {
    loading.value = false
  }
}

const getPhotoUrl = (photoPath) => {
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}/${photoPath}`
}

const formatJoinDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

const canOfferSkill = (skillName) => {
  return mySkills.value.some(skill => skill.name.toLowerCase() === skillName.toLowerCase())
}

const requestSkill = (skill) => {
  swapForm.skillRequestedId = skill._id || skill.name
  showSwapModal.value = true
}

const offerSkill = (wantedSkill) => {
  const myMatchingSkill = mySkills.value.find(skill => 
    skill.name.toLowerCase() === wantedSkill.name.toLowerCase()
  )
  if (myMatchingSkill) {
    swapForm.skillOfferedId = myMatchingSkill._id || myMatchingSkill.name
    showSwapModal.value = true
  }
}

const closeSwapModal = () => {
  showSwapModal.value = false
  swapForm.skillRequestedId = ''
  swapForm.skillOfferedId = ''
  swapForm.message = ''
}

const submitSwapRequest = async () => {
  try {
    submittingSwap.value = true
    
    const requestedSkill = user.value.skillsOffered.find(s => (s._id || s.name) === swapForm.skillRequestedId)
    const offeredSkill = mySkills.value.find(s => (s._id || s.name) === swapForm.skillOfferedId)
    
    const swapData = {
      providerId: user.value._id,
      skillRequested: {
        name: requestedSkill.name,
        description: requestedSkill.description
      },
      skillOffered: {
        name: offeredSkill.name,
        description: offeredSkill.description
      },
      message: swapForm.message
    }
    
    await api.post('/swaps', swapData)
    
    toast.success('Swap request sent successfully!')
    closeSwapModal()
    
  } catch (error) {
    console.error('Error submitting swap request:', error)
    toast.error('Failed to send swap request')
  } finally {
    submittingSwap.value = false
  }
}

onMounted(() => {
  fetchUser()
})
</script>

<style scoped>
.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.user-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
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

.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  color: #1f2937;
  margin-bottom: 1rem;
}

.profile-header-card {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: #6b7280;
}

.profile-details h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.location {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rating-stars {
  font-size: 1.25rem;
}

.rating-value {
  font-weight: 700;
  color: #1f2937;
}

.rating-count {
  color: #6b7280;
  font-size: 0.875rem;
}

.join-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skill-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.skill-header h4 {
  color: #1f2937;
  margin: 0;
}

.skill-level {
  background: #e5e7eb;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.skill-priority {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.skill-priority.low {
  background: #d1fae5;
  color: #065f46;
}

.skill-priority.medium {
  background: #fef3c7;
  color: #92400e;
}

.skill-priority.high {
  background: #fee2e2;
  color: #991b1b;
}

.skill-card p {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.empty-skills {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.availability-display {
  margin-top: 1rem;
}

.availability-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.availability-tag {
  background: #e5e7eb;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.no-availability {
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
}

.modal-content h3 {
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.swap-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .profile-header-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
  }
  
  .profile-info {
    flex-direction: column;
    text-align: center;
  }
  
  .skills-grid {
    grid-template-columns: 1fr;
  }
  
  .user-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
