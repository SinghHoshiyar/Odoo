<template>
  <div class="feedback-overlay" @click.self="$emit('close')">
    <div class="feedback-content">
      <div class="feedback-header">
        <h3>⭐ Give Feedback</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="feedback-body">
        <div class="swap-info" v-if="swap">
          <h4>Skill Exchange Summary</h4>
          <div class="skills-exchanged">
            <div class="skill-item">
              <span class="label">You taught:</span>
              <span class="skill">{{ swap.skillOffered?.name }}</span>
            </div>
            <div class="skill-item">
              <span class="label">You learned:</span>
              <span class="skill">{{ swap.skillRequested?.name || swap.skillWanted?.name }}</span>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="rating-section">
            <label class="section-label">Overall Rating *</label>
            <div class="star-rating">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="rating = star"
                :class="['star', { 'filled': star <= rating, 'hovered': star <= hoveredRating }]"
                @mouseenter="hoveredRating = star"
                @mouseleave="hoveredRating = 0"
              >
                ⭐
              </button>
            </div>
            <div class="rating-labels">
              <span v-if="rating === 1">Poor</span>
              <span v-else-if="rating === 2">Fair</span>
              <span v-else-if="rating === 3">Good</span>
              <span v-else-if="rating === 4">Very Good</span>
              <span v-else-if="rating === 5">Excellent</span>
              <span v-else>Click to rate</span>
            </div>
          </div>

          <div class="comment-section">
            <label for="feedback-comment" class="section-label">Your Experience</label>
            <textarea
              id="feedback-comment"
              v-model="comment"
              placeholder="Share your experience with this skill exchange. What went well? What could be improved?"
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ comment.length }}/500</div>
          </div>

          <div class="tags-section">
            <label class="section-label">Quick Tags (Optional)</label>
            <div class="tags-grid">
              <button
                v-for="tag in availableTags"
                :key="tag"
                type="button"
                @click="toggleTag(tag)"
                :class="['tag-button', { 'selected': selectedTags.includes(tag) }]"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <div class="recommend-section">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="wouldRecommend"
              />
              <span class="checkmark"></span>
              I would recommend this person to others
            </label>
          </div>
        </form>
      </div>
      
      <div class="feedback-actions">
        <button @click="$emit('close')" class="btn btn-secondary">
          Cancel
        </button>
        <button @click="handleSubmit" class="btn btn-primary" :disabled="!isValid">
          Submit Feedback
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

const props = defineProps({
  swap: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'submit'])

const toast = useToast()
const rating = ref(0)
const hoveredRating = ref(0)
const comment = ref('')
const selectedTags = ref([])
const wouldRecommend = ref(true)

const availableTags = [
  'patient', 'knowledgeable', 'helpful', 'friendly', 'professional',
  'punctual', 'well-prepared', 'clear-communicator', 'enthusiastic'
]

const isValid = computed(() => {
  return rating.value > 0
})

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const handleSubmit = () => {
  if (!isValid.value) {
    toast.error('Please provide a rating')
    return
  }

  const feedbackData = {
    rating: rating.value,
    comment: comment.value.trim(),
    tags: selectedTags.value,
    wouldRecommend: wouldRecommend.value,
    skillTaught: props.swap.skillOffered?.name || '',
    skillLearned: props.swap.skillRequested?.name || props.swap.skillWanted?.name || ''
  }

  emit('submit', feedbackData)
}

onMounted(() => {
  // Auto focus on first interactive element
  setTimeout(() => {
    const firstStar = document.querySelector('.star')
    if (firstStar) {
      firstStar.focus()
    }
  }, 100)
})
</script>

<style scoped>
.feedback-overlay {
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

.feedback-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.feedback-header h3 {
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
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #374151;
  background: #f3f4f6;
}

.feedback-body {
  padding: 0 1.5rem;
}

.swap-info {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.swap-info h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.skills-exchanged {
  display: grid;
  gap: 0.5rem;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-item .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.skill-item .skill {
  font-weight: 600;
  color: #1f2937;
}

.section-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.rating-section {
  margin-bottom: 1.5rem;
}

.star-rating {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.star {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  color: #d1d5db;
}

.star.filled,
.star.hovered {
  color: #fbbf24;
  transform: scale(1.1);
}

.star:hover {
  transform: scale(1.2);
}

.rating-labels {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.comment-section {
  margin-bottom: 1.5rem;
}

.comment-section textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

.comment-section textarea:focus {
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

.tags-section {
  margin-bottom: 1.5rem;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-button {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 1rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.tag-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.tag-button.selected {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.recommend-section {
  margin-bottom: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  position: relative;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"]:checked {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-label input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
}

.feedback-actions {
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

@media (max-width: 640px) {
  .feedback-overlay {
    padding: 0.5rem;
  }
  
  .feedback-header {
    padding: 1rem 1rem 0 1rem;
  }
  
  .feedback-body {
    padding: 0 1rem;
  }
  
  .feedback-actions {
    padding: 1rem;
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .star-rating {
    justify-content: center;
  }
  
  .tags-grid {
    justify-content: center;
  }
}
</style>
