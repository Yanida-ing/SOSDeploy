<template>
  <main class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
    <h1 class="welcome-text mb-4">
      สวัสดี <span class="username">{{ username }}</span>
    </h1>
  </main>
</template>
<script>
export default {
  name: "ChatWelcome",
  props: { username: String }
}
</script>
<style scoped>
.welcome-text {
  color: #4285f4;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
}
.username {
  color: #3a2ee6;
}
</style> 