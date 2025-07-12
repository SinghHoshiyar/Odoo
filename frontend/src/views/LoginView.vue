<template>
  <div class="login">
    <div class="login-container">
      <div class="login-header">
        <h1>Welcome Back</h1>
        <p>Sign in to your SkillSwap account</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
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

        <button 
          type="submit" 
          class="btn btn-primary btn-full"
          :disabled="authStore.isLoading"
          :class="{ 'loading': authStore.isLoading }"
        >
          {{ authStore.isLoading ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <div class="login-footer">
        <p>
          Don't have an account?
          <RouterLink to="/register" class="link">Sign up here</RouterLink>
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
  email: '',
  password: ''
})

const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!form.email) {
    errors.value.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.value.email = 'Please enter a valid email'
  }
  
  if (!form.password) {
    errors.value.password = 'Password is required'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  try {
    await authStore.login(form)
    router.push('/dashboard')
  } catch (error) {
    // Error handling is done in the store/service
  }
}
</script>

<style scoped>
.login {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  max-width: 400px;
  width: 100%;
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #6b7280;
}

.login-form {
  margin-bottom: 2rem;
}

.btn-full {
  width: 100%;
}

.login-footer {
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
