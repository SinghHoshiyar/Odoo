<template>
  <div class="profile">
    <div class="profile-header">
      <h1>Profile Management</h1>
      <p>Update your profile information and manage your skills</p>
    </div>
    
    <div class="profile-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>
      
      <!-- Profile Form -->
      <div v-else class="profile-grid">
        <!-- Basic Information -->
        <div class="card">
          <h2>Basic Information</h2>
          <form @submit.prevent="updateProfile" class="profile-form">
            <div class="form-group">
              <label class="form-label">Profile Photo</label>
              <div class="photo-upload">
                <div class="photo-preview">
                  <img v-if="profile.profilePhoto" :src="getPhotoUrl(profile.profilePhoto)" alt="Profile" class="profile-image" />
                  <div v-else class="photo-placeholder">
                    <span>{{ profile.name?.charAt(0) || 'U' }}</span>
                  </div>
                </div>
                <div class="photo-actions">
                  <input ref="photoInput" type="file" accept="image/*" @change="handlePhotoUpload" style="display: none" />
                  <button type="button" @click="$refs.photoInput.click()" class="btn btn-secondary btn-sm">Change Photo</button>
                  <button v-if="profile.profilePhoto" type="button" @click="removePhoto" class="btn btn-danger btn-sm">Remove</button>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="name" class="form-label">Name *</label>
              <input
                v-model="profile.name"
                type="text"
                id="name"
                class="form-input"
                :class="{ 'error': errors.name }"
                required
              />
              <div v-if="errors.name" class="form-error">{{ errors.name }}</div>
            </div>
            
            <div class="form-group">
              <label for="email" class="form-label">Email *</label>
              <input
                v-model="profile.email"
                type="email"
                id="email"
                class="form-input"
                :class="{ 'error': errors.email }"
                required
              />
              <div v-if="errors.email" class="form-error">{{ errors.email }}</div>
            </div>
            
            <div class="form-group">
              <label for="location" class="form-label">Location</label>
              <input
                v-model="profile.location"
                type="text"
                id="location"
                class="form-input"
                placeholder="City, Country"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Profile Visibility</label>
              <div class="toggle-container">
                <input
                  v-model="profile.isPublic"
                  type="checkbox"
                  id="isPublic"
                  class="toggle-input"
                />
                <label for="isPublic" class="toggle-label">
                  <span class="toggle-text">{{ profile.isPublic ? 'Public' : 'Private' }}</span>
                </label>
              </div>
              <p class="form-help">{{ profile.isPublic ? 'Your profile is visible to all users' : 'Your profile is only visible to you' }}</p>
            </div>
            
            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Profile' }}</button>
          </form>
        </div>
        
        <!-- Availability -->
        <div class="card">
          <h2>Availability</h2>
          <div class="availability-grid">
            <div class="availability-item">
              <input v-model="profile.availability.weekdays" type="checkbox" id="weekdays" class="checkbox" />
              <label for="weekdays" class="checkbox-label">Weekdays</label>
            </div>
            <div class="availability-item">
              <input v-model="profile.availability.weekends" type="checkbox" id="weekends" class="checkbox" />
              <label for="weekends" class="checkbox-label">Weekends</label>
            </div>
            <div class="availability-item">
              <input v-model="profile.availability.mornings" type="checkbox" id="mornings" class="checkbox" />
              <label for="mornings" class="checkbox-label">Mornings</label>
            </div>
            <div class="availability-item">
              <input v-model="profile.availability.afternoons" type="checkbox" id="afternoons" class="checkbox" />
              <label for="afternoons" class="checkbox-label">Afternoons</label>
            </div>
            <div class="availability-item">
              <input v-model="profile.availability.evenings" type="checkbox" id="evenings" class="checkbox" />
              <label for="evenings" class="checkbox-label">Evenings</label>
            </div>
          </div>
        </div>
        
        <!-- Skills Offered -->
        <div class="card">
          <h2>Skills I Offer</h2>
          <div class="skills-section">
            <div v-for="(skill, index) in profile.skillsOffered" :key="index" class="skill-item">
              <div class="skill-form">
                <input v-model="skill.name" type="text" placeholder="Skill name" class="form-input" />
                <textarea v-model="skill.description" placeholder="Description" class="form-textarea" rows="2"></textarea>
                <select v-model="skill.level" class="form-select">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <button type="button" @click="removeSkillOffered(index)" class="btn btn-danger btn-sm">Remove</button>
            </div>
            <button type="button" @click="addSkillOffered" class="btn btn-secondary">Add Skill</button>
          </div>
        </div>
        
        <!-- Skills Wanted -->
        <div class="card">
          <h2>Skills I Want to Learn</h2>
          <div class="skills-section">
            <div v-for="(skill, index) in profile.skillsWanted" :key="index" class="skill-item">
              <div class="skill-form">
                <input v-model="skill.name" type="text" placeholder="Skill name" class="form-input" />
                <textarea v-model="skill.description" placeholder="Description" class="form-textarea" rows="2"></textarea>
                <select v-model="skill.priority" class="form-select">
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
              <button type="button" @click="removeSkillWanted(index)" class="btn btn-danger btn-sm">Remove</button>
            </div>
            <button type="button" @click="addSkillWanted" class="btn btn-secondary">Add Skill</button>
          </div>
        </div>
        
        <!-- Account Settings -->
        <div class="card">
          <h2>Account Settings</h2>
          <div class="settings-section">
            <div class="setting-item">
              <h3>Change Password</h3>
              <button @click="showPasswordModal = true" class="btn btn-secondary">Change Password</button>
            </div>
            <div class="setting-item">
              <h3>Account Status</h3>
              <p class="status-text">Account is {{ profile.isActive ? 'Active' : 'Inactive' }}</p>
            </div>
            <div class="setting-item">
              <h3>Rating</h3>
              <div class="rating-display">
                <span class="rating-stars">⭐</span>
                <span class="rating-value">{{ profile.rating?.average?.toFixed(1) || 'N/A' }}</span>
                <span class="rating-count">({{ profile.rating?.count || 0 }} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Password Change Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="showPasswordModal = false">
      <div class="modal-content" @click.stop>
        <h3>Change Password</h3>
        <form @submit.prevent="changePassword" class="password-form">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input v-model="passwordForm.currentPassword" type="password" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input v-model="passwordForm.newPassword" type="password" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input v-model="passwordForm.confirmPassword" type="password" class="form-input" required />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showPasswordModal = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="changingPassword">{{ changingPassword ? 'Changing...' : 'Change Password' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const changingPassword = ref(false)
const showPasswordModal = ref(false)
const errors = ref({})

const profile = reactive({
  name: '',
  email: '',
  location: '',
  profilePhoto: null,
  isPublic: true,
  isActive: true,
  availability: {
    weekdays: false,
    weekends: false,
    mornings: false,
    afternoons: false,
    evenings: false
  },
  skillsOffered: [],
  skillsWanted: [],
  rating: { average: 0, count: 0 }
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const fetchProfile = async () => {
  try {
    loading.value = true
    const response = await api.get('/users/profile')
    
    Object.assign(profile, response.data.user)
    
    // Ensure skills arrays exist
    if (!profile.skillsOffered) profile.skillsOffered = []
    if (!profile.skillsWanted) profile.skillsWanted = []
    if (!profile.availability) profile.availability = {
      weekdays: false,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: false
    }
    
  } catch (error) {
    console.error('Error fetching profile:', error)
    toast.error('Failed to load profile')
  } finally {
    loading.value = false
  }
}

const updateProfile = async () => {
  try {
    saving.value = true
    errors.value = {}
    
    // Validate
    if (!profile.name.trim()) {
      errors.value.name = 'Name is required'
      return
    }
    
    if (!profile.email.trim()) {
      errors.value.email = 'Email is required'
      return
    }
    
    const response = await api.put('/users/profile', profile)
    
    toast.success('Profile updated successfully')
    authStore.updateUser(response.data.user)
    
  } catch (error) {
    console.error('Error updating profile:', error)
    toast.error('Failed to update profile')
  } finally {
    saving.value = false
  }
}

const handlePhotoUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('profilePhoto', file)
  
  try {
    const response = await api.post('/users/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    profile.profilePhoto = response.data.profilePhoto
    toast.success('Profile photo updated successfully')
    authStore.updateUser({ profilePhoto: response.data.profilePhoto })
    
  } catch (error) {
    console.error('Error uploading photo:', error)
    toast.error('Failed to upload photo')
  }
}

const removePhoto = async () => {
  try {
    await api.delete('/users/profile/photo')
    profile.profilePhoto = null
    toast.success('Profile photo removed successfully')
    authStore.updateUser({ profilePhoto: null })
  } catch (error) {
    console.error('Error removing photo:', error)
    toast.error('Failed to remove photo')
  }
}

const getPhotoUrl = (photoPath) => {
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}/${photoPath}`
}

const addSkillOffered = () => {
  profile.skillsOffered.push({
    name: '',
    description: '',
    level: 'Intermediate'
  })
}

const removeSkillOffered = (index) => {
  profile.skillsOffered.splice(index, 1)
}

const addSkillWanted = () => {
  profile.skillsWanted.push({
    name: '',
    description: '',
    priority: 'Medium'
  })
}

const removeSkillWanted = (index) => {
  profile.skillsWanted.splice(index, 1)
}

const changePassword = async () => {
  try {
    changingPassword.value = true
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    await authStore.updatePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    
    showPasswordModal.value = false
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
  } catch (error) {
    console.error('Error changing password:', error)
  } finally {
    changingPassword.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-header {
  margin-bottom: 2rem;
}

.profile-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.profile-header p {
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

.profile-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

.photo-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.photo-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
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

.photo-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-input {
  width: 20px;
  height: 20px;
}

.toggle-label {
  font-weight: 500;
  color: #374151;
}

.form-help {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.availability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.availability-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox {
  width: 18px;
  height: 18px;
}

.checkbox-label {
  font-weight: 500;
  color: #374151;
}

.skills-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skill-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.skill-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 60px;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.setting-item h3 {
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.status-text {
  color: #6b7280;
  font-size: 0.875rem;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  .profile-grid {
    grid-template-columns: 1fr;
  }
  
  .availability-grid {
    grid-template-columns: 1fr;
  }
  
  .skill-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .photo-upload {
    flex-direction: column;
    align-items: center;
  }
  
  .photo-actions {
    flex-direction: row;
  }
}
</style>
