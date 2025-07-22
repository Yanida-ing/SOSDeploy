<template>
  <header class="chat-header d-flex justify-content-between align-items-center px-4 py-3">
    <div class="d-flex align-items-center">
      <h2 class="app-title mb-0">DISASTER AI</h2>
      <CBadge color="secondary" class="ml-2">GEMMA 3</CBadge>
    </div>
    <CAvatar src="https://randomuser.me/api/portraits/men/32.jpg" size="md" />
  </header>
</template>
<script>
export default { name: "ChatHeader" }
</script>
<style scoped>
.chat-header {
  background: #111;
  border-bottom: 1px solid #232526;
}
.app-title {
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 1.5rem;
}
</style> 