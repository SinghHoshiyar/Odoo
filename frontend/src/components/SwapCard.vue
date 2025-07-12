<template>
  <div class="swap-card">
    <div class="swap-header">
      <div class="swap-status">
        <span :class="['status-badge', `status-${swap.status}`]">
          {{ swap.status.charAt(0).toUpperCase() + swap.status.slice(1) }}
        </span>
        <span class="swap-date">{{ formatDate(swap.createdAt) }}</span>
      </div>
      <div class="swap-participants">
        <div class="participant">
          <img 
            :src="otherUser.profilePhoto || '/default-avatar.png'" 
            :alt="otherUser.name"
            class="avatar"
          />
          <div>
            <div class="participant-name">{{ otherUser.name }}</div>
            <div class="participant-location">{{ otherUser.location || 'Location not specified' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="swap-details">
      <div class="skill-exchange">
        <div class="skill-wanted">
          <h4>Skill Wanted:</h4>
          <span class="skill-name">{{ swap.skillRequested?.name || swap.skillWanted?.name }}</span>
        </div>
        <div class="exchange-arrow">⇄</div>
        <div class="skill-offered">
          <h4>Skill Offered:</h4>
          <span class="skill-name">{{ swap.skillOffered?.name }}</span>
        </div>
      </div>

      <div v-if="swap.message" class="swap-message">
        <h4>Message:</h4>
        <p>{{ swap.message }}</p>
      </div>

      <div v-if="swap.proposedDate" class="proposed-date">
        <h4>Proposed Date:</h4>
        <span>{{ formatDate(swap.proposedDate) }}</span>
      </div>

      <div v-if="swap.location" class="swap-location">
        <h4>Location:</h4>
        <span>{{ swap.location }}</span>
      </div>
    </div>

    <div class="swap-actions">
      <template v-if="isReceived && swap.status === 'pending'">
        <button @click="$emit('action', 'accept', swap)" class="btn btn-success">
          ✅ Accept
        </button>
        <button @click="$emit('action', 'reject', swap)" class="btn btn-danger">
          ❌ Reject
        </button>
      </template>

      <template v-else-if="!isReceived && swap.status === 'pending'">
        <button @click="$emit('action', 'cancel', swap)" class="btn btn-warning">
          ❌ Cancel Request
        </button>
      </template>

      <template v-else-if="swap.status === 'accepted'">
        <button @click="$emit('action', 'complete', swap)" class="btn btn-success">
          ✓ Mark as Completed
        </button>
        <button @click="$emit('action', 'cancel', swap)" class="btn btn-warning">
          ❌ Cancel
        </button>
      </template>

      <template v-else-if="swap.status === 'completed' && canGiveFeedback">
        <button @click="$emit('action', 'giveFeedback', swap)" class="btn btn-primary">
          ⭐ Give Feedback
        </button>
      </template>

      <template v-if="swap.status === 'accepted' || swap.status === 'completed'">
        <button @click="$emit('action', 'viewDetails', swap)" class="btn btn-secondary">
          👁️ View Details
        </button>
      </template>
    </div>

    <div v-if="swap.responses && swap.responses.length > 0" class="swap-responses">
      <h4>Messages:</h4>
      <div v-for="response in swap.responses.slice(-2)" :key="response._id" class="response">
        <strong>{{ response.from.name }}:</strong> {{ response.message }}
        <span class="response-time">{{ formatDate(response.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  swap: {
    type: Object,
    required: true
  },
  isReceived: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['action'])

const otherUser = computed(() => {
  return props.isReceived ? props.swap.requester || props.swap.fromUser : props.swap.provider || props.swap.toUser
})

const canGiveFeedback = computed(() => {
  // Check if user hasn't given feedback yet
  const userId = JSON.parse(localStorage.getItem('user')).id
  if (props.isReceived) {
    return !props.swap.feedback?.providerFeedback?.rating
  } else {
    return !props.swap.feedback?.requesterFeedback?.rating
  }
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.swap-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.2s ease;
}

.swap-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.swap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.swap-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-accepted {
  background: #d1fae5;
  color: #065f46;
}

.status-completed {
  background: #dbeafe;
  color: #1e40af;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-cancelled {
  background: #f3f4f6;
  color: #374151;
}

.swap-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.participant {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.participant-name {
  font-weight: 600;
  color: #1f2937;
}

.participant-location {
  font-size: 0.875rem;
  color: #6b7280;
}

.swap-details {
  margin-bottom: 1.5rem;
}

.skill-exchange {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.skill-wanted,
.skill-offered {
  flex: 1;
}

.skill-exchange h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.skill-name {
  font-weight: 600;
  color: #1f2937;
}

.exchange-arrow {
  font-size: 1.5rem;
  color: #3b82f6;
}

.swap-message,
.proposed-date,
.swap-location {
  margin-bottom: 0.75rem;
}

.swap-message h4,
.proposed-date h4,
.swap-location h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.swap-message p {
  color: #374151;
  line-height: 1.5;
}

.swap-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.swap-responses {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.swap-responses h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.response {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.375rem;
}

.response-time {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
  margin-left: 0.5rem;
}

@media (max-width: 768px) {
  .swap-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .skill-exchange {
    flex-direction: column;
    gap: 0.5rem;
  }

  .exchange-arrow {
    transform: rotate(90deg);
  }

  .swap-actions {
    gap: 0.25rem;
  }

  .btn {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }
}
</style>
