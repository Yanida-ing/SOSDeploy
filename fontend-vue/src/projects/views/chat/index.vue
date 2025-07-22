<template>
  <div class="chat-bg d-flex flex-column min-vh-80">
    <ChatHeader />
    <ChatWelcome :username="username" />
    <div class="chat-messages-container">
      <div class="chat-messages-scroll">
        <div v-for="(msg, idx) in messages" :key="idx" class="chat-message" :class="msg.role">
          <span v-if="msg.role==='user'">🧑‍💬</span>
          <span v-else>🤖</span>
          <span class="chat-message-text">{{ msg.text }}</span>
        </div>
      </div>
    </div>
    <ChatInput :appName="appName"
      @send="onSend"
      @report="onReport"
      @image="onImage"
      @voice="onVoice"
    />
  </div>
</template>

<script>
import ChatHeader from './components/ChatHeader.vue'
import ChatWelcome from './components/ChatWelcome.vue'
import ChatInput from './components/ChatInput.vue'
import api from '@/service/api'
export default {
  name: "ChatPage",
  components: { ChatHeader, ChatWelcome, ChatInput },
  data() {
    return {
      username: "Phanthakan",
      appName: "DisasterAI",
      messages: []
    }
  },
  methods: {
    async onSend(msg) {
      this.messages.push({ role: 'user', text: msg })
      try {
        // เรียก backend โดยส่ง userId และ message
        const res = await api.chat(this.username, msg)
        if(res.data && res.data.data && res.data.data.response) {
          this.messages.push({ role: 'bot', text: res.data.data.response })
        } else {
          this.messages.push({ role: 'bot', text: 'ไม่สามารถตอบกลับได้' })
        }
      } catch (e) {
        this.messages.push({ role: 'bot', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' })
      }
    },
    onReport() { /* handle report */ },
    onImage() { /* handle image */ },
    onVoice() { /* handle voice */ }
  }
}
</script>

<style scoped>
.chat-bg {
  background: #000;
  min-height: 80vh;
  color: #fff;
}
.chat-messages-container {
  width: 100%;
  max-width: 650px;
  margin: 0 auto 16px auto;
  padding: 0 12px;
  min-height: 120px;
  max-height: 320px;
  /* ปรับ max-height ตามต้องการ */
  display: flex;
  flex-direction: column;
}
.chat-messages-scroll {
  overflow-y: auto;
  height: 100%;
  max-height: 320px;
  /* ปรับ max-height ตามต้องการ */
  padding-right: 4px;
}
.chat-message {
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.chat-message.user {
  justify-content: flex-end;
  color: #fff;
}
.chat-message.bot {
  justify-content: flex-start;
  color: #90caf9;
}
.chat-message-text {
  background: #232526;
  border-radius: 12px;
  padding: 6px 14px;
  max-width: 80%;
  word-break: break-word;
  font-size: 1rem;
}
</style>