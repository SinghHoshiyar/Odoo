<template>
  <div class="swap-tabs">
    <button 
      v-for="tab in tabs" 
      :key="tab.key"
      @click="selectTab(tab.key)"
      :class="['tab-button', { 'active': activeTab === tab.key }]"
    >
      {{ tab.label }}
      <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

const props = defineProps({
  activeTab: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['tab-change', 'update:activeTab'])

const toast = useToast()
const stats = ref({})

const tabs = computed(() => [
  { key: 'all', label: 'All', count: stats.value.total },
  { key: 'sent', label: 'Sent', count: null },
  { key: 'received', label: 'Received', count: null },
  { key: 'accepted', label: 'Accepted', count: stats.value.accepted },
  { key: 'rejected', label: 'Rejected', count: stats.value.rejected },
  { key: 'pending', label: 'Pending', count: stats.value.pending }
])

const selectTab = (tabKey) => {
  emit('update:activeTab', tabKey)
  emit('tab-change', tabKey)
}

const fetchStats = async () => {
  try {
    const response = await api.get('/swaps/stats')
    stats.value = response.data
  } catch (error) {
    console.error('Error fetching swap stats:', error)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.swap-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 1rem;
  flex-wrap: wrap;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: #f3f4f6;
  border-radius: 0.5rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  background: #e5e7eb;
  color: #374151;
}

.tab-button.active {
  background: #3b82f6;
  color: white;
}

.tab-count {
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.5rem;
  text-align: center;
}

.tab-button.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .swap-tabs {
    gap: 0.25rem;
  }
  
  .tab-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
}
</style>
