<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>{{ title }}</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="dialog-body">
        <p>{{ message }}</p>
        
        <div v-if="showMessageInput" class="message-input">
          <label for="response-message">Message (optional):</label>
          <textarea 
            id="response-message"
            v-model="responseMessage"
            placeholder="Add a message with your response..."
            rows="3"
            maxlength="500"
          ></textarea>
          <div class="char-count">{{ responseMessage.length }}/500</div>
        </div>
        
        <div v-if="showReasonInput" class="reason-input">
          <label for="cancel-reason">Reason for cancellation:</label>
          <textarea 
            id="cancel-reason"
            v-model="cancelReason"
            placeholder="Please provide a reason for cancellation..."
            rows="3"
            maxlength="500"
            required
          ></textarea>
          <div class="char-count">{{ cancelReason.length }}/500</div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="$emit('close')" class="btn btn-secondary">
          Cancel
        </button>
        <button @click="handleConfirm" class="btn" :class="confirmButtonClass">
          {{ confirmButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  action: {
    type: String,
    required: true
  },
  swap: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'confirm'])

const responseMessage = ref('')
const cancelReason = ref('')

const title = computed(() => {
  switch (props.action) {
    case 'accept':
      return 'Accept Swap Request'
    case 'reject':
      return 'Reject Swap Request'
    case 'cancel':
      return 'Cancel Swap'
    case 'complete':
      return 'Mark Swap as Completed'
    default:
      return 'Confirm Action'
  }
})

const message = computed(() => {
  switch (props.action) {
    case 'accept':
      return 'Are you sure you want to accept this swap request? This will notify the other user and you can begin coordinating the skill exchange.'
    case 'reject':
      return 'Are you sure you want to reject this swap request? This action cannot be undone.'
    case 'cancel':
      return 'Are you sure you want to cancel this swap? This will notify the other user and end the skill exchange.'
    case 'complete':
      return 'Are you sure you want to mark this swap as completed? Both parties will be able to leave feedback after completion.'
    default:
      return 'Are you sure you want to perform this action?'
  }
})

const showMessageInput = computed(() => {
  return props.action === 'accept' || props.action === 'reject'
})

const showReasonInput = computed(() => {
  return props.action === 'cancel'
})

const confirmButtonText = computed(() => {
  switch (props.action) {
    case 'accept':
      return 'Accept'
    case 'reject':
      return 'Reject'
    case 'cancel':
      return 'Cancel Swap'
    case 'complete':
      return 'Mark Complete'
    default:
      return 'Confirm'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.action) {
    case 'accept':
    case 'complete':
      return 'btn-success'
    case 'reject':
    case 'cancel':
      return 'btn-danger'
    default:
      return 'btn-primary'
  }
})

const handleConfirm = () => {
  const data = {
    action: props.action,
    swap: props.swap
  }
  
  if (showMessageInput.value && responseMessage.value.trim()) {
    data.message = responseMessage.value.trim()
  }
  
  if (showReasonInput.value) {
    if (!cancelReason.value.trim()) {
      alert('Please provide a reason for cancellation')
      return
    }
    data.reason = cancelReason.value.trim()
  }
  
  emit('confirm', data)
}

onMounted(() => {
  // Focus on textarea if visible
  setTimeout(() => {
    const textarea = document.querySelector('textarea')
    if (textarea) {
      textarea.focus()
    }
  }, 100)
})
</script>

<style scoped>
.dialog-overlay {
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
  padding: 1rem;
}

.dialog-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.dialog-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #374151;
  background: #f3f4f6;
}

.dialog-body {
  padding: 0 1.5rem 1rem 1.5rem;
}

.dialog-body p {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.message-input,
.reason-input {
  margin-top: 1rem;
}

.message-input label,
.reason-input label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.message-input textarea,
.reason-input textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.message-input textarea:focus,
.reason-input textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
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

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

@media (max-width: 640px) {
  .dialog-overlay {
    padding: 0.5rem;
  }
  
  .dialog-header {
    padding: 1rem 1rem 0 1rem;
  }
  
  .dialog-body {
    padding: 0 1rem 1rem 1rem;
  }
  
  .dialog-actions {
    padding: 1rem;
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
