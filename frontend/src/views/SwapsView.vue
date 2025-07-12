<template>
  <div class="swaps">
    <div class="swaps-header">
      <h1>My Swaps</h1>
      <p>View and manage all your skill swap requests</p>
    </div>
    
    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="['tab-button', { 'active': activeTab === tab.key }]"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading swaps...</p>
    </div>
    
    <!-- Swaps Content -->
    <div v-else class="swaps-content">
      <!-- Empty State -->
      <div v-if="filteredSwaps.length === 0" class="empty-state">
        <div class="empty-icon">🤝</div>
        <h3>No {{ activeTab }} swaps found</h3>
        <p v-if="activeTab === 'all'">Start by browsing skills and creating swap requests</p>
        <p v-else>No swaps with {{ activeTab }} status yet</p>
        <RouterLink to="/skills" class="btn btn-primary">Browse Skills</RouterLink>
      </div>
      
      <!-- Swaps List -->
      <div v-else class="swaps-list">
        <div v-for="swap in filteredSwaps" :key="swap._id" class="swap-card">
          <div class="swap-header">
            <div class="swap-info">
              <h3>{{ swap.skillRequested.name }} ↔ {{ swap.skillOffered.name }}</h3>
              <p class="swap-partner">{{ getSwapPartnerText(swap) }}</p>
            </div>
            <span :class="['status-badge', swap.status]">{{ swap.status }}</span>
          </div>
          
          <div class="swap-details">
            <div class="skill-details">
              <div class="skill-section">
                <h4>Requested: {{ swap.skillRequested.name }}</h4>
                <p>{{ swap.skillRequested.description || 'No description provided' }}</p>
              </div>
              <div class="skill-section">
                <h4>Offered: {{ swap.skillOffered.name }}</h4>
                <p>{{ swap.skillOffered.description || 'No description provided' }}</p>
              </div>
            </div>
            
            <div class="swap-message">
              <h4>Message:</h4>
              <p>{{ swap.message }}</p>
            </div>
            
            <div class="swap-meta">
              <span class="swap-date">Created: {{ formatDate(swap.createdAt) }}</span>
              <span v-if="swap.acceptedAt" class="swap-date">Accepted: {{ formatDate(swap.acceptedAt) }}</span>
              <span v-if="swap.completedAt" class="swap-date">Completed: {{ formatDate(swap.completedAt) }}</span>
            </div>
          </div>
          
          <!-- Swap Actions -->
          <div class="swap-actions">
            <template v-if="swap.status === 'pending'">
              <!-- If current user is the provider (receiver) -->
              <template v-if="isSwapProvider(swap)">
                <button @click="respondToSwap(swap._id, 'accepted')" class="btn btn-success btn-sm">Accept</button>
                <button @click="respondToSwap(swap._id, 'rejected')" class="btn btn-danger btn-sm">Reject</button>
              </template>
              <!-- If current user is the requester -->
              <template v-else>
                <button @click="cancelSwap(swap._id)" class="btn btn-danger btn-sm">Cancel Request</button>
              </template>
            </template>
            
            <template v-if="swap.status === 'accepted'">
              <button @click="completeSwap(swap._id)" class="btn btn-success btn-sm">Mark as Completed</button>
              <button @click="cancelSwap(swap._id)" class="btn btn-secondary btn-sm">Cancel</button>
            </template>
            
            <template v-if="swap.status === 'completed'">
              <button v-if="canLeaveFeedback(swap)" @click="showFeedbackModal(swap)" class="btn btn-primary btn-sm">Leave Feedback</button>
              <span v-else class="feedback-status">Feedback submitted</span>
            </template>
            
            <button @click="viewSwapDetails(swap._id)" class="btn btn-secondary btn-sm">View Details</button>
          </div>
          
          <!-- Feedback Display -->
          <div v-if="swap.status === 'completed' && hasFeedback(swap)" class="feedback-section">
            <h4>Feedback</h4>
            <div class="feedback-grid">
              <div v-if="swap.feedback.requesterFeedback?.rating" class="feedback-item">
                <strong>From {{ swap.requester.name }}:</strong>
                <div class="rating">{{ '⭐'.repeat(swap.feedback.requesterFeedback.rating) }}</div>
                <p>{{ swap.feedback.requesterFeedback.comment }}</p>
              </div>
              <div v-if="swap.feedback.providerFeedback?.rating" class="feedback-item">
                <strong>From {{ swap.provider.name }}:</strong>
                <div class="rating">{{ '⭐'.repeat(swap.feedback.providerFeedback.rating) }}</div>
                <p>{{ swap.feedback.providerFeedback.comment }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Feedback Modal -->
    <div v-if="showFeedbackModalFlag" class="modal-overlay" @click="closeFeedbackModal">
      <div class="modal-content" @click.stop>
        <h3>Leave Feedback</h3>
        <form @submit.prevent="submitFeedback" class="feedback-form">
          <div class="form-group">
            <label class="form-label">Rating</label>
            <div class="rating-input">
              <button 
                v-for="star in 5" 
                :key="star"
                type="button"
                @click="feedbackForm.rating = star"
                :class="['star-button', { 'active': star <= feedbackForm.rating }]"
              >
                ⭐
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Comment</label>
            <textarea 
              v-model="feedbackForm.comment" 
              class="form-textarea" 
              rows="4" 
              placeholder="Share your experience with this skill swap..."
              required
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeFeedbackModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submittingFeedback">{{ submittingFeedback ? 'Submitting...' : 'Submit Feedback' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const activeTab = ref('all')
const swaps = ref([])
const showFeedbackModalFlag = ref(false)
const submittingFeedback = ref(false)
const currentSwap = ref(null)

const feedbackForm = reactive({
  rating: 5,
  comment: ''
})

const tabs = computed(() => [
  { key: 'all', label: 'All', count: swaps.value.length },
  { key: 'pending', label: 'Pending', count: swaps.value.filter(s => s.status === 'pending').length },
  { key: 'accepted', label: 'Accepted', count: swaps.value.filter(s => s.status === 'accepted').length },
  { key: 'completed', label: 'Completed', count: swaps.value.filter(s => s.status === 'completed').length },
  { key: 'rejected', label: 'Rejected', count: swaps.value.filter(s => s.status === 'rejected').length },
  { key: 'cancelled', label: 'Cancelled', count: swaps.value.filter(s => s.status === 'cancelled').length }
])

const filteredSwaps = computed(() => {
  if (activeTab.value === 'all') return swaps.value
  return swaps.value.filter(swap => swap.status === activeTab.value)
})

const fetchSwaps = async () => {
  try {
    loading.value = true
    const response = await api.get('/swaps')
    swaps.value = response.data.swaps || []
  } catch (error) {
    console.error('Error fetching swaps:', error)
    toast.error('Failed to load swaps')
  } finally {
    loading.value = false
  }
}

const getSwapPartnerText = (swap) => {
  const currentUserId = authStore.user?._id
  if (swap.requester._id === currentUserId) {
    return `with ${swap.provider.name}`
  } else {
    return `from ${swap.requester.name}`
  }
}

const isSwapProvider = (swap) => {
  return swap.provider._id === authStore.user?._id
}

const respondToSwap = async (swapId, response) => {
  try {
    await api.put(`/swaps/${swapId}/respond`, { response })
    toast.success(`Swap ${response} successfully`)
    await fetchSwaps() // Refresh the list
  } catch (error) {
    console.error('Error responding to swap:', error)
    toast.error('Failed to respond to swap')
  }
}

const cancelSwap = async (swapId) => {
  try {
    await api.put(`/swaps/${swapId}/cancel`)
    toast.success('Swap cancelled successfully')
    await fetchSwaps() // Refresh the list
  } catch (error) {
    console.error('Error cancelling swap:', error)
    toast.error('Failed to cancel swap')
  }
}

const completeSwap = async (swapId) => {
  try {
    await api.put(`/swaps/${swapId}/complete`)
    toast.success('Swap marked as completed')
    await fetchSwaps() // Refresh the list
  } catch (error) {
    console.error('Error completing swap:', error)
    toast.error('Failed to complete swap')
  }
}

const canLeaveFeedback = (swap) => {
  const currentUserId = authStore.user?._id
  const isRequester = swap.requester._id === currentUserId
  const isProvider = swap.provider._id === currentUserId
  
  if (isRequester && !swap.feedback?.requesterFeedback?.rating) return true
  if (isProvider && !swap.feedback?.providerFeedback?.rating) return true
  
  return false
}

const hasFeedback = (swap) => {
  return swap.feedback?.requesterFeedback?.rating || swap.feedback?.providerFeedback?.rating
}

const showFeedbackModal = (swap) => {
  currentSwap.value = swap
  feedbackForm.rating = 5
  feedbackForm.comment = ''
  showFeedbackModalFlag.value = true
}

const closeFeedbackModal = () => {
  showFeedbackModalFlag.value = false
  currentSwap.value = null
}

const submitFeedback = async () => {
  try {
    submittingFeedback.value = true
    
    await api.post(`/swaps/${currentSwap.value._id}/feedback`, feedbackForm)
    
    toast.success('Feedback submitted successfully')
    closeFeedbackModal()
    await fetchSwaps() // Refresh the list
    
  } catch (error) {
    console.error('Error submitting feedback:', error)
    toast.error('Failed to submit feedback')
  } finally {
    submittingFeedback.value = false
  }
}

const viewSwapDetails = (swapId) => {
  router.push(`/swaps/${swapId}`)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchSwaps()
})
</script>

<style scoped>
.swaps-header {
  margin-bottom: 2rem;
}

.swaps-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.swaps-header p {
  color: #6b7280;
  font-size: 1.125rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-button:not(.active) .tab-count {
  background: #e5e7eb;
  color: #6b7280;
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #1f2937;
  margin-bottom: 1rem;
}

.empty-state p {
  margin-bottom: 2rem;
}

.swaps-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.swap-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.2s ease;
}

.swap-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.swap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.swap-info h3 {
  color: #1f2937;
  margin-bottom: 0.25rem;
  font-size: 1.25rem;
}

.swap-partner {
  color: #6b7280;
  font-size: 0.875rem;
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

.status-badge.cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.swap-details {
  margin-bottom: 1.5rem;
}

.skill-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.skill-section h4 {
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.skill-section p {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.swap-message {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.swap-message h4 {
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.swap-message p {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.swap-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.swap-date {
  color: #9ca3af;
  font-size: 0.75rem;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.swap-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.feedback-status {
  color: #10b981;
  font-size: 0.875rem;
  font-weight: 500;
}

.feedback-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.feedback-section h4 {
  color: #1f2937;
  margin-bottom: 1rem;
}

.feedback-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.feedback-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.feedback-item strong {
  color: #1f2937;
  display: block;
  margin-bottom: 0.5rem;
}

.rating {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.feedback-item p {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
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

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rating-input {
  display: flex;
  gap: 0.25rem;
}

.star-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  opacity: 0.3;
}

.star-button.active {
  opacity: 1;
}

.star-button:hover {
  background: #f3f4f6;
  opacity: 1;
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
  .swap-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .skill-details {
    grid-template-columns: 1fr;
  }
  
  .swap-actions {
    justify-content: center;
  }
  
  .feedback-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-tabs {
    justify-content: center;
  }
  
  .tab-button {
    flex: 1;
    min-width: 100px;
  }
}
</style>
