<template>
  <div class="my-swaps">
    <div class="page-header">
      <h1>🔁 My Swaps</h1>
      <p>Manage your skill exchange requests and sessions</p>
    </div>
    
    <swap-tabs 
      v-model:active-tab="activeTab" 
      @tab-change="handleTabChange" 
    />
    
    <div class="swap-list">
      <template v-if="loading">
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading swaps...</p>
        </div>
      </template>
      
      <template v-else>
        <div v-if="swaps.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No {{ activeTab === 'all' ? '' : activeTab }} swaps found</h3>
          <p>{{ getEmptyStateMessage() }}</p>
        </div>
        
        <swap-card 
          v-for="swap in swaps" 
          :key="swap._id" 
          :swap="swap" 
          :is-received="isReceivedSwap(swap)"
          @action="handleAction" 
        />
      </template>
    </div>
    
    <confirm-dialog 
      v-if="showConfirm" 
      :action="currentAction.action"
      :swap="currentAction.swap"
      @close="showConfirm = false" 
      @confirm="confirmAction" 
    />
    
    <feedback-form 
      v-if="showFeedback" 
      :swap="currentAction.swap"
      @close="showFeedback = false" 
      @submit="submitFeedback" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from 'vue-toastification'
import SwapTabs from '@/components/SwapTabs.vue'
import SwapCard from '@/components/SwapCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FeedbackForm from '@/components/FeedbackForm.vue'

const router = useRouter()
const toast = useToast()

const activeTab = ref('all')
const swaps = ref([])
const loading = ref(false)
const showConfirm = ref(false)
const showFeedback = ref(false)
const currentAction = ref({})

// Get current user from localStorage
const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

const isReceivedSwap = (swap) => {
  if (!currentUser.value) return false
  // Check if current user is the recipient (provider/toUser)
  return swap.provider?._id === currentUser.value.id || swap.toUser?._id === currentUser.value.id
}

const getEmptyStateMessage = () => {
  switch (activeTab.value) {
    case 'sent':
      return 'You haven\'t sent any swap requests yet. Browse skills to start exchanging!'
    case 'received':
      return 'No one has requested to swap skills with you yet.'
    case 'pending':
      return 'No pending swap requests at the moment.'
    case 'accepted':
      return 'No accepted swaps yet. Accept some requests to start learning!'
    case 'rejected':
      return 'No rejected swaps to show.'
    default:
      return 'Start by browsing skills and sending swap requests to other users.'
  }
}

const fetchSwaps = async () => {
  try {
    loading.value = true
    let url = '/swaps'
    
    // Add query parameters based on active tab
    const params = new URLSearchParams()
    if (activeTab.value !== 'all') {
      if (activeTab.value === 'sent' || activeTab.value === 'received') {
        params.append('type', activeTab.value)
      } else {
        params.append('status', activeTab.value)
      }
    }
    
    if (params.toString()) {
      url += '?' + params.toString()
    }
    
    const response = await api.get(url)
    swaps.value = response.data.swaps || []
  } catch (error) {
    console.error('Error loading swaps:', error)
    toast.error('Failed to load swaps')
    swaps.value = []
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tabKey) => {
  activeTab.value = tabKey
  fetchSwaps()
}

const handleAction = (action, swap) => {
  currentAction.value = { action, swap }
  
  if (action === 'giveFeedback') {
    showFeedback.value = true
  } else if (action === 'viewDetails') {
    // Navigate to swap details page
    router.push(`/swaps/${swap._id}`)
  } else {
    showConfirm.value = true
  }
}

const confirmAction = async (data) => {
  try {
    const { action, swap, message, reason } = data
    let response
    
    switch (action) {
      case 'accept':
        response = await api.put(`/swaps/${swap._id}/respond`, {
          action: 'accept',
          message: message || undefined
        })
        toast.success('Swap request accepted!')
        break
        
      case 'reject':
        response = await api.put(`/swaps/${swap._id}/respond`, {
          action: 'reject',
          message: message || undefined
        })
        toast.success('Swap request rejected')
        break
        
      case 'cancel':
        response = await api.put(`/swaps/${swap._id}/cancel`, {
          reason: reason || undefined
        })
        toast.success('Swap cancelled successfully')
        break
        
      case 'complete':
        response = await api.put(`/swaps/${swap._id}/complete`)
        toast.success('Swap marked as completed!')
        break
        
      default:
        throw new Error('Unknown action')
    }
    
    // Refresh the swaps list
    await fetchSwaps()
    
  } catch (error) {
    console.error(`Error ${data.action}ing swap:`, error)
    const message = error.response?.data?.message || `Failed to ${data.action} swap`
    toast.error(message)
  } finally {
    showConfirm.value = false
  }
}

const submitFeedback = async (feedbackData) => {
  try {
    const { swap } = currentAction.value
    
    await api.post(`/swaps/${swap._id}/feedback`, {
      rating: feedbackData.rating,
      comment: feedbackData.comment,
      tags: feedbackData.tags,
      wouldRecommend: feedbackData.wouldRecommend
    })
    
    toast.success('Feedback submitted successfully!')
    
    // Refresh the swaps list
    await fetchSwaps()
    
  } catch (error) {
    console.error('Error submitting feedback:', error)
    const message = error.response?.data?.message || 'Failed to submit feedback'
    toast.error(message)
  } finally {
    showFeedback.value = false
  }
}

onMounted(() => {
  fetchSwaps()
})
</script>

<style scoped>
.my-swaps {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.swap-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.loading {
  text-align: center;
  padding: 1rem;
}

.empty-state {
  text-align: center;
  color: #999;
}
</style>

