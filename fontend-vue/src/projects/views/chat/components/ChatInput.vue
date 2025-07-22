<template>
  <footer class="chat-input-container">
    <div class="chat-input-box">
      <input
        v-model="message"
        class="chat-input"
        :placeholder="`ถาม ${appName}...`"
        @keyup.enter="sendMessage"
      />
      <div class="input-actions d-flex align-items-center justify-content-between mt-3">
        <div class="d-flex align-items-center gap-2">
          <CButton color="light" variant="ghost" class="icon-btn" @click="$emit('report')">
            <CIcon :icon="iconMap[iconName] || cilList" size="lg" /> <span>แจ้งข้อมูลภัยพิบัติ</span>
          </CButton>
          <CButton color="light" variant="ghost" class="icon-btn" @click="$emit('image')">
            <CIcon :icon="cilEnvelopeClosed" size="lg" /> <span>รูปภาพ</span>
          </CButton>
        </div>
        <div class="d-flex align-items-center gap-2">
          <CButton color="light" variant="ghost" class="icon-btn" @click="$emit('voice')">
            <CIcon :icon="cilMicrophone" size="lg" />
          </CButton>
          <CButton color="primary" class="icon-btn send-btn" @click="sendMessage">
            <CIcon :icon="cilUser" size="lg" />
          </CButton>
        </div>
      </div>
    </div>
  </footer>
</template>
<script>
import { cilList, cilEnvelopeClosed, cilMicrophone, cilUser } from '@coreui/icons'
export default {
  name: "ChatInput",
  props: {
    appName: String,
    iconName: String // เพิ่ม prop สำหรับ dynamic icon
  },
  data() {
    return {
      message: "",
      cilList, cilEnvelopeClosed, cilMicrophone, cilUser,
      iconMap: {
        cilList,
        cilEnvelopeClosed,
        cilMicrophone,
        cilUser
      }
    }
  },
  methods: {
    sendMessage() {
      if (this.message.trim()) {
        this.$emit('send', this.message)
        this.message = ""
      }
    }
  }
}
</script>
<style>
svg.c-icon {
  display: inline-block !important;
  visibility: visible !important;
  width: 1.25em !important;
  height: 1.25em !important;
  color: #fff !important;
  fill: currentColor !important;
}
</style>

<style scoped>
.chat-input-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 32px 0 24px 0;
  background: transparent;
}
.chat-input-box {
  background: #111;
  border: 1.5px solid #333;
  border-radius: 20px;
  padding: 24px 28px 18px 28px;
  width: 100%;
  max-width: 650px;
  box-sizing: border-box;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
}
.chat-input {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  outline: none;
  padding: 0;
}
.chat-input::placeholder {
  color: #bbb;
  opacity: 1;
}
.input-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.icon-btn {
  min-width: 0;
  padding: 0 10px;
  font-size: 1.05rem;
  color: #bbb;
  border-radius: 12px;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.icon-btn:hover {
  background: #232526;
  color: #fff;
}
.send-btn {
  background: #4285f4 !important;
  color: #fff !important;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
@media (max-width: 600px) {
  .chat-input-box {
    padding: 16px 8px 12px 8px;
    max-width: 98vw;
  }
}
</style> 