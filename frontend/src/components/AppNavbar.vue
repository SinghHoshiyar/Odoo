<template>
  <nav class="navbar">
    <div class="nav-container">
      <!-- Logo/Brand -->
      <RouterLink to="/" class="nav-brand">
        <div class="brand-icon">🔄</div>
        <span class="brand-text">SkillSwap</span>
      </RouterLink>

      <!-- Mobile menu button -->
      <button 
        class="mobile-menu-btn"
        @click="toggleMobileMenu"
        :aria-expanded="isMobileMenuOpen"
      >
        <span class="sr-only">Open main menu</span>
        <div class="hamburger" :class="{ 'is-active': isMobileMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <!-- Navigation Links -->
      <div class="nav-links" :class="{ 'mobile-open': isMobileMenuOpen }">
        <!-- Public links -->
        <RouterLink to="/" class="nav-link" @click="closeMobileMenu">
          Home
        </RouterLink>
        <RouterLink to="/skills" class="nav-link" @click="closeMobileMenu">
          Browse Skills
        </RouterLink>

        <!-- Authenticated user links -->
        <template v-if="authStore.isAuthenticated">
          <RouterLink to="/dashboard" class="nav-link" @click="closeMobileMenu">
            Dashboard
          </RouterLink>
          <RouterLink to="/swaps" class="nav-link" @click="closeMobileMenu">
            My Swaps
          </RouterLink>
          
          <!-- Admin link -->
          <RouterLink 
            v-if="authStore.isAdmin" 
            to="/admin" 
            class="nav-link admin-link" 
            @click="closeMobileMenu"
          >
            Admin
          </RouterLink>

          <!-- User dropdown -->
          <div class="user-dropdown" ref="dropdownRef">
            <button 
              class="user-dropdown-btn" 
              @click="toggleUserDropdown"
              :aria-expanded="isUserDropdownOpen"
            >
              <div class="user-avatar">
                <img 
                  v-if="authStore.user?.profilePhoto" 
                  :src="authStore.user.profilePhoto" 
                  :alt="authStore.user?.name"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  {{ authStore.user?.name?.charAt(0)?.toUpperCase() }}
                </div>
              </div>
              <span class="user-name">{{ authStore.user?.name }}</span>
              <ChevronDownIcon class="dropdown-icon" :class="{ 'rotated': isUserDropdownOpen }" />
            </button>

            <div v-if="isUserDropdownOpen" class="user-dropdown-menu">
              <RouterLink to="/profile" class="dropdown-item" @click="closeUserDropdown">
                <UserIcon class="dropdown-item-icon" />
                Profile
              </RouterLink>
              <button class="dropdown-item" @click="handleLogout">
                <LogOutIcon class="dropdown-item-icon" />
                Logout
              </button>
            </div>
          </div>
        </template>

        <!-- Guest links -->
        <template v-else>
          <RouterLink to="/login" class="nav-link" @click="closeMobileMenu">
            Login
          </RouterLink>
          <RouterLink to="/register" class="btn btn-primary nav-cta" @click="closeMobileMenu">
            Sign Up
          </RouterLink>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ChevronDownIcon, UserIcon, LogOutIcon } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)
const isUserDropdownOpen = ref(false)
const dropdownRef = ref(null)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value
}

const closeUserDropdown = () => {
  isUserDropdownOpen.value = false
  closeMobileMenu()
}

const handleLogout = () => {
  authStore.logout()
  closeUserDropdown()
  router.push('/')
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isUserDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.navbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #1f2937;
  font-weight: 700;
  font-size: 1.25rem;
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-text {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.hamburger {
  width: 24px;
  height: 18px;
  position: relative;
  transform: rotate(0deg);
  transition: 0.3s ease-in-out;
}

.hamburger span {
  display: block;
  position: absolute;
  height: 2px;
  width: 100%;
  background: #374151;
  border-radius: 2px;
  opacity: 1;
  left: 0;
  transform: rotate(0deg);
  transition: 0.3s ease-in-out;
}

.hamburger span:nth-child(1) {
  top: 0px;
}

.hamburger span:nth-child(2) {
  top: 8px;
}

.hamburger span:nth-child(3) {
  top: 16px;
}

.hamburger.is-active span:nth-child(1) {
  top: 8px;
  transform: rotate(135deg);
}

.hamburger.is-active span:nth-child(2) {
  opacity: 0;
  left: -60px;
}

.hamburger.is-active span:nth-child(3) {
  top: 8px;
  transform: rotate(-135deg);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  padding: 0.5rem 0;
  transition: color 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: #3b82f6;
}

.nav-link.router-link-active {
  color: #3b82f6;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
}

.admin-link {
  color: #f59e0b !important;
}

.nav-cta {
  margin-left: 0.5rem;
}

.user-dropdown {
  position: relative;
}

.user-dropdown-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
}

.user-dropdown-btn:hover {
  background-color: #f3f4f6;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e5e7eb;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

.dropdown-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.user-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  min-width: 12rem;
  z-index: 50;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  transition: background-color 0.2s ease;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

.dropdown-item:first-child {
  border-radius: 0.5rem 0.5rem 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 0.5rem 0.5rem;
}

.dropdown-item-icon {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Mobile styles */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }

  .nav-links {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e5e7eb;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 1rem;
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }

  .nav-links.mobile-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .nav-link {
    padding: 0.75rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .nav-link:last-child {
    border-bottom: none;
  }

  .nav-cta {
    margin-left: 0;
    margin-top: 0.5rem;
    text-align: center;
  }

  .user-dropdown-btn {
    justify-content: flex-start;
    width: 100%;
    padding: 0.75rem 0;
  }

  .user-dropdown-menu {
    position: static;
    margin-top: 0.5rem;
    box-shadow: none;
    border: 1px solid #e5e7eb;
  }
}
</style>
