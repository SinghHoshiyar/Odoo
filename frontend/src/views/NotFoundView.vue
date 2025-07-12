<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>Sorry, the page you're looking for doesn't exist.</p>
      <RouterLink to="/" class="btn btn-primary">Go Home</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.not-found-content h1 {
  font-size: 4rem;
  font-weight: 800;
  color: #3b82f6;
  margin-bottom: 1rem;
}

.not-found-content h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.not-found-content p {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.125rem;
}
</style>
