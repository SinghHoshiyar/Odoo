<template>
  <div class="register">
    <div class="register-container">
      <div class="register-header">
        <h1>Join SkillSwap</h1>
        <p>Create your account and start sharing skills</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="name" class="form-label">Full Name</label>
          <input
            v-model="form.name"
            type="text"
            id="name"
            class="form-input"
            :class="{ 'error': errors.name }"
            required
          />
          <div v-if="errors.name" class="form-error">{{ errors.name }}</div>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            v-model="form.email"
            type="email"
            id="email"
            class="form-input"
            :class="{ 'error': errors.email }"
            required
          />
          <div v-if="errors.email" class="form-error">{{ errors.email }}</div>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            v-model="form.password"
            type="password"
            id="password"
            class="form-input"
            :class="{ 'error': errors.password }"
            required
          />
          <div v-if="errors.password" class="form-error">{{ errors.password }}</div>
        </div>

        <div class="form-group">
          <label for="location" class="form-label">Location (Optional)</label>
          <input
            v-model="form.location"
            type="text"
            id="location"
            class="form-input"
            placeholder="e.g., New York, NY"
          />
        </div>

        <button 
          type="submit" 
          class="btn btn-primary btn-full"
          :disabled="authStore.isLoading"
          :class="{ 'loading': authStore.isLoading }"
        >
          {{ authStore.isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div class="register-footer">
        <p>
          Already have an account?
          <RouterLink to="/login" class="link">Sign in here</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  location: ''
})

const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!form.name || form.name.length < 2) {
    errors.value.name = 'Name must be at least 2 characters'
  }
  
  if (!form.email) {
    errors.value.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.value.email = 'Please enter a valid email'
  }
  
  if (!form.password || form.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleRegister = async () => {
  if (!validateForm()) return
  
  try {
    await authStore.register(form)
    router.push('/dashboard')
  } catch (error) {
    // Error handling is done in the store/service
  }
}
</script>

<style scoped>
.register {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.register-container {
  max-width: 400px;
  width: 100%;
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.register-header p {
  color: #6b7280;
}

.register-form {
  margin-bottom: 2rem;
}

.btn-full {
  width: 100%;
}

.register-footer {
  text-align: center;
  color: #6b7280;
}

.link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.form-input.error {
  border-color: #ef4444;
}
</style>
