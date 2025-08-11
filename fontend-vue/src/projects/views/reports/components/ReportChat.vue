<template>
  <div class="chat-container">
    <!-- Header -->
    <div class="chat-header">
      <div class="header-content">
        <h2 class="chat-title">แจ้งเหตุฉุกเฉินและภัยพิบัติ</h2>
      </div>
    </div>

    <!-- Chat Content -->
    <div class="chat-content">
      <!-- Chat History -->
      <div ref="chatHistory" class="chat-history">
        <div
          v-for="(msg, idx) in chatHistory"
          :key="idx"
          :class="['chat-row', msg.role]"
        >
          <template v-if="msg.role === 'ai'">
            <div class="ai-message">
              <div class="ai-icon">
                <img src="/dindin.png" alt="AI" />
              </div>
              <div class="chat-bubble ai">
                <span v-if="msg.text !== '__ai_loading__'">{{ msg.text }}</span>
                <span v-else>
                  <span class="ai-typing">
                    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                  </span>
                </span>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="user-message">
              <div class="chat-bubble user">
                <span>{{ typeof msg.text === 'string' ? msg.text : msg.text.text }}</span>
                <!-- แสดงรูปในแชท -->
                <div v-if="msg.text && msg.text.media && msg.text.media.length > 0" class="chat-media">
                  <div v-for="(img, imgIdx) in msg.text.media" :key="imgIdx" class="chat-media-item">
                    <img v-if="isFile(img)" :src="getObjectURL(img)" :alt="img.name || 'image'" class="chat-media-img" />
                    <img v-else-if="img.src" :src="img.src" :alt="img.name || 'image'" class="chat-media-img" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-container">
          <div class="input-row">
            <textarea
              v-model="description"
              class="chat-input"
              :placeholder="currentMode === 'chat' ? 'ถามอะไรก็ได้' : currentMode === 'query' ? 'ถามเกี่ยวกับข้อมูลภัยพิบัติ' : 'รายละเอียดเหตุการณ์ที่พบ'"
              rows="2"
              @keydown.enter.prevent="handleSubmit"
              @input="autoResize"
            ></textarea>
            <div class="input-actions">
              <button 
                class="input-btn"
                :disabled="isSubmitting"
                @click="triggerCamera"
              >
                <CIcon name="cil-camera" />
              </button>
              <button 
                class="input-btn mic-btn"
                :disabled="isSubmitting"
                @click="startListening"
                :class="{ 'mic-listening': isListening }"
              >
                <CIcon name="cil-microphone" />
              </button>
              <button 
                class="input-btn send-btn"
                :disabled="isSubmitting || !description.trim()"
                @click="handleSubmit"
              >
                <CIcon name="cil-cursor" />
              </button>
            </div>
          </div>
          
          <!-- Mode Selector Row 2 -->
          <div class="mode-selector-row">
            <button 
              class="mode-btn"
              :class="{ active: currentMode === 'chat' }"
              @click="switchToChatMode"
            >
              <CIcon name="cil-chat-bubble" />
              <span>พูดคุยทั่วไป</span>
            </button>
            <button 
              class="mode-btn"
              :class="{ active: currentMode === 'report' }"
              @click="switchToReportMode"
            >
              <CIcon name="cil-plus" />
              <span>แจ้งเหตุ</span>
            </button>
          </div>
          <!-- Media Preview -->
          <div v-if="media.length" class="media-preview-list">
            <div v-for="(img, idx) in media" :key="idx" class="media-preview-item">
              <img v-if="isFile(img)" :src="getObjectURL(img)" :alt="img.name || 'image'" class="media-preview-img" />
              <img v-else-if="img.src" :src="img.src" :alt="img.name || 'image'" class="media-preview-img" />
              <div v-else class="media-error">ไม่สามารถแสดงรูปนี้ได้</div>
              <button class="remove-media-btn" @click="removeMedia(idx)" :disabled="isSubmitting">&times;</button>
            </div>
          </div>

          <!-- Suggestions -->
          <div class="suggestions">
            <button
              v-for="(tag, idx) in currentMode === 'chat' ? chatSuggestions : currentMode === 'query' ? querySuggestions : reportSuggestions"
              :key="idx"
              class="suggestion-tag"
              @click="!description.includes(tag) && (description += ' ' + tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="onMediaChange"
    />
  </div>
</template>

<script>
import { CIcon } from '@coreui/icons-vue'
import axios from 'axios'

export default {
  name: 'ReportChat',
  components: { CIcon },
  computed: {
    description: {
      get() { return this.$store.getters['ReportChat/description'] },
      set(val) { this.$store.commit('ReportChat/setDescription', val) }
    },
    media: {
      get() { return this.$store.getters['ReportChat/media'] },
      set(val) { this.$store.commit('ReportChat/setMedia', val) }
    },
    mediaToSend: {
      get() { return this.$store.getters['ReportChat/mediaToSend'] },
      set(val) { this.$store.commit('ReportChat/setMediaToSend', val) }
    },
    mediaAlreadySent: {
      get() { return this.$store.getters['ReportChat/mediaAlreadySent'] },
      set(val) { this.$store.commit('ReportChat/setMediaAlreadySent', val) }
    },
    location: {
      get() { return this.$store.getters['ReportChat/location'] },
      set(val) { this.$store.commit('ReportChat/setLocation', val) }
    },
    chatHistory: {
      get() { return this.$store.getters['ReportChat/chatHistory'] },
      set(val) { this.$store.commit('ReportChat/setChatHistory', val) }
    },
    llmContextHistory: {
      get() { return this.$store.getters['ReportChat/llmContextHistory'] },
      set(val) { this.$store.commit('ReportChat/setLlmContextHistory', val) }
    },
    contact: {
      get() { return this.$store.getters['ReportChat/contact'] },
      set(val) { this.$store.commit('ReportChat/setContact', val) }
    },
    language: {
      get() { return this.$store.getters['ReportChat/language'] },
      set(val) { this.$store.commit('ReportChat/setLanguage', val) }
    },
    isListening: {
      get() { return this.$store.getters['ReportChat/isListening'] },
      set(val) { this.$store.commit('ReportChat/setIsListening', val) }
    },
    isSubmitting: {
      get() { return this.$store.getters['ReportChat/isSubmitting'] },
      set(val) { this.$store.commit('ReportChat/setIsSubmitting', val) }
    },
    lastReportText: {
      get() { return this.$store.getters['ReportChat/lastReportText'] },
      set(val) { this.$store.commit('ReportChat/setLastReportText', val) }
    }
  },
  data() {
    return {
      fileInput: null,
      currentMode: 'query',
      // chatSuggestions: [
      //   'สวัสดี', 'ช่วยเหลือ', 'ข้อมูล', 'คำแนะนำ', 'พูดคุย'
      // ],
      // querySuggestions: [
      //   'ข้อมูลภัยพิบัติ', 'สถิติ', 'พื้นที่เสี่ยง', 'การป้องกัน', 'ข้อมูลล่าสุด'
      // ],
      // reportSuggestions: [
      //   'น้ำท่วม', 'ไฟไหม้', 'อุบัติเหตุ', 'แจ้งเหตุฉุกเฉิน', 'ช่วยเหลือ'
      // ],
      translations: {
        th: {
          reportTitle: 'แจ้งข้อมูลภัยพิบัติ',
          reportDescription: 'อุบัติเหตุและภัยพิบัติสามารถเกิดขึ้นได้ทุกเมื่อ โดยไม่ทันตั้งตัว การแจ้งเหตุที่รวดเร็วและแม่นยำจะช่วยให้หน่วยงานสามารถเข้าถึงพื้นที่ได้ทันท่วงทีลดความสูญเสีย และช่วยเหลือผู้ประสบภัยอย่างมีประสิทธิภาพ โปรดรายงานเหตุการณ์ที่พบเห็นเพื่อร่วมเป็นส่วนหนึ่งในการปกป้องชีวิตและความปลอดภัยของทุกคน',
          typeMessageOrSpeak: 'กรุณากรอกข้อความและข้อมูลติดต่อ',
          confirmReportTitle: 'ยืนยันการส่ง',
          confirmReportText: 'โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน',
          confirmReportButton: 'ยืนยัน!',
          cancelReportButton: 'ยกเลิก',
          reportSuccessTitle: 'สำเร็จ!',
          reportSuccessText: 'รายงานของคุณถูกส่งให้กับเจ้าหน้าที่เรียบร้อยแล้ว.',
          reportErrorTitle: 'เกิดข้อผิดพลาด!',
          cancel: 'ยกเลิก',
          reportCanceled: 'การส่งรายงานถูกยกเลิก.',
          cannotListen: '⚠️ ไม่สามารถฟังเสียงได้: ',
          yourBrowserNotSupportVoiceRecognition: 'เบราว์เซอร์ของคุณไม่รองรับการแปลงเสียงเป็นข้อความ'
        }
      },
      baseDescription: '', 
    }
  },
  mounted() {
    this.fileInput = this.$refs.fileInput
    this.getLocation()
  },
  methods: {
    t(key) {
      const lang = this.language || 'th';
      const dict = (this.translations && this.translations[lang]) ? this.translations[lang] : (this.translations ? this.translations['th'] : {});
      return dict && dict[key] ? dict[key] : key;
    },
    isFile(obj) {
      return typeof File !== 'undefined' && obj instanceof File;
    },
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    async compressImage(file, maxSize) {
      return new Promise((resolve, reject) => {
        console.log('Starting compression for file:', file.name, 'Size:', file.size);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          console.log('Image loaded, original dimensions:', img.width, 'x', img.height);
          
          // Calculate new dimensions (maintain aspect ratio)
          let { width, height } = img;
          const maxDimension = 1200; // Reduced for better compression
          
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          
          console.log('New dimensions:', width, 'x', height);
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels
          let quality = 0.8;
          let attempts = 0;
          const maxAttempts = 15;
          
          const tryCompress = () => {
            attempts++;
            console.log(`Compression attempt ${attempts}, quality: ${quality}`);
            
            canvas.toBlob((blob) => {
              console.log('Blob size:', blob.size, 'Target max:', maxSize);
              
              if (blob.size <= maxSize || quality <= 0.1 || attempts >= maxAttempts) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                console.log('Compression complete. Final size:', compressedFile.size);
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            }, 'image/jpeg', quality);
          };
          
          tryCompress();
        };
        
        img.onerror = (error) => {
          console.error('Image load error:', error);
          reject(error);
        };
        
        img.src = URL.createObjectURL(file);
      });
    },
    getObjectURL(file) {
      return (window.URL && file) ? window.URL.createObjectURL(file) : '';
    },
    addToHistory(role, text) {
      this.$store.commit('ReportChat/addChatHistory', { role, text });
      this.$store.commit('ReportChat/addLlmContextHistory', { role, text });
      this.$nextTick(() => {
        const el = this.$refs.chatHistory;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
    getLocation() {
      this.$store.dispatch('ReportChat/fetchLocation');
    },
    autoResize(e) {
      const textarea = e.target
      textarea.style.height = 'auto'
      
      // คำนวณความสูงของ 2 บรรทัด
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
      const maxHeight = lineHeight * 2
      
      // ตั้งค่าความสูงสูงสุดเป็น 2 บรรทัด
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.height = maxHeight + 'px'
        textarea.style.overflowY = 'auto'
      } else {
        textarea.style.height = textarea.scrollHeight + 'px'
        textarea.style.overflowY = 'hidden'
      }
    },
    async onMediaChange(e) {
      const files = Array.from(e.target.files)
      if (this.mediaToSend.length + files.length > 1) {
        this.addToHistory('ai', 'อัปโหลดได้สูงสุด 1 รูปเท่านั้น');
        this.$refs.fileInput.value = ''
        return
      }
      
      for (let file of files) {
        if (!file.type.startsWith('image/')) {
          this.addToHistory('ai', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น');
          continue;
        }
        
        // บีบอัดทุกไฟล์ให้ต่ำกว่า 1MB
        const targetSize = 1 * 1024 * 1024; // 1MB target
        
        if (file.size > targetSize) {
          try {
            console.log('Original file size:', file.size, 'bytes');
            this.addToHistory('ai', 'กำลังบีบอัดรูปภาพ...');
            file = await this.compressImage(file, targetSize);
            console.log('Compressed file size:', file.size, 'bytes');
            this.addToHistory('ai', `บีบอัดรูปภาพสำเร็จ!`);
          } catch (error) {
            console.error('Compression error:', error);
            this.addToHistory('ai', 'ไม่สามารถบีบอัดไฟล์ได้ กรุณาเลือกรูปที่มีขนาดไม่เกิน 1MB');
            continue;
          }
        } else {
          console.log('File size already OK:', file.size, 'bytes');
        }
        
        if (!this.mediaToSend.some(f => f.name === file.name && f.size === file.size)) {
          this.media = [...this.media, file];
          this.mediaToSend = [...this.mediaToSend, file];
        }
      }
      
      this.$refs.fileInput.value = ''
      console.log('media array:', this.media);
    },
    triggerCamera() {
        this.$refs.fileInput.click();
    },
    removeMedia(index) {
      const newMedia = [...this.media];
      const newMediaToSend = [...this.mediaToSend];
      newMedia.splice(index, 1);
      newMediaToSend.splice(index, 1);
      this.media = newMedia;
      this.mediaToSend = newMediaToSend;
    },
    async handleSubmit() {
      if (this.isSubmitting) return 
      if (!this.description.trim()) {
        this.addToHistory('ai', '⚠️ กรุณาพิมพ์ข้อความก่อนส่ง');
        return;
      }
      const userText = this.description;
      const userMedia = [...this.media];
      
      // เพิ่มข้อความในแชท
      this.addToHistory('user', userText);
      
      // เพิ่มรูปในแชทถ้ามี
      if (userMedia.length > 0 && !this.mediaAlreadySent) {
        this.addToHistory('user', {
          media: userMedia
        });
      }
      
      this.description = '';
      this.baseDescription = '';
      this.$store.commit('ReportChat/setIsSubmitting', true);
      this.$store.commit('ReportChat/addChatHistory', { role: 'ai', text: '__ai_loading__' });
      this.lastReportText = userText;
      
      try {
        // สร้าง FormData
        const formData = new FormData();
        formData.append('text', userText);
        formData.append('intent', this.currentMode); // ส่ง intent ตาม mode ที่เลือก
        if (this.location) {
          formData.append('location', JSON.stringify({ coordinates: [this.location.lng, this.location.lat] }));
        }
        formData.append('chatHistory', JSON.stringify(this.llmContextHistory.slice(-10)));
        
        // แนบ media เฉพาะรอบแรกที่ยังไม่เคยส่ง
        if (!this.mediaAlreadySent && userMedia.length > 0) {
          userMedia.forEach(file => formData.append('media', file));
        }
        
        //localhost:8081,https://sos.mfu.ac.th
        const res = await axios.post('http://localhost:8081/api/v1/report/report', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        const data = res.data;
        
        this.chatHistory = this.chatHistory.filter(msg => msg.text !== '__ai_loading__');
        this.$store.commit('ReportChat/setIsSubmitting', false);
        
        if (data.code === 20000 && data.data && data.intent === 'report') {
          // สำเร็จ: ล้าง media/mediaToSend และรีเซ็ต mediaAlreadySent
          this.media = [];
          this.mediaToSend = [];
          this.mediaAlreadySent = false;
        } else if (userMedia.length > 0 && !this.mediaAlreadySent) {
          // ถ้ายังไม่สำเร็จและเพิ่งแนบ media ให้ mark ว่า media ถูกส่งแล้ว
          this.mediaAlreadySent = true;
        }
        
        if (data.code === 20000 && data.data) {
          if (data.intent === 'query' || data.intent === 'chat') {
            this.addToHistory('ai', data.data.answer)
          }
          if (data.intent === 'report') {
            this.addToHistory('ai', data.message)
            this.lastReportText = '';
            this.contact = { name: '', phone: '' }
            if (String(data.code).startsWith('200')) {
              this.llmContextHistory = [];
            }
          }
        } else {
          this.addToHistory('ai', (data.message));
        }
      } catch (e) {
        this.chatHistory = this.chatHistory.filter(msg => msg.text !== '__ai_loading__');
        this.$store.commit('ReportChat/setIsSubmitting', false);
        if (e.response && e.response.data && e.response.data.message) {
          this.addToHistory('ai', e.response.data.message);
        } else {
          this.addToHistory('ai', this.t('reportErrorMessage') + (e.message || ''));
        }
      } finally {
        this.$store.commit('ReportChat/setIsSubmitting', false);
      }
    },


    switchToQueryMode() {
      // ถ้ากดซ้ำที่โหมดเดิม ให้ออกจากโหมดนั้น
      if (this.currentMode === 'query') {
        this.currentMode = 'chat'; // กลับไปโหมด default
        this.addToHistory('ai', 'คุณได้ออกจากโหมดข้อมูลภัยพิบัติ');
      } else {
        this.currentMode = 'query';
        this.addToHistory('ai', 'คุณได้เข้าสู่โหมดข้อมูลภัยพิบัติ สามารถถามเกี่ยวกับข้อมูล สถิติ และพื้นที่เสี่ยงได้');
      }
    },
    switchToChatMode() {
      // ถ้ากดซ้ำที่โหมดเดิม ให้ออกจากโหมดนั้น
      if (this.currentMode === 'chat') {
        this.currentMode = 'query'; // กลับไปโหมด default
        this.addToHistory('ai', 'คุณได้ออกจากโหมดพูดคุยทั่วไป');
      } else {
        this.currentMode = 'chat';
        this.addToHistory('ai', 'คุณได้เข้าสู่โหมดพูดคุยทั่วไป สามารถถามคำแนะนำหรือพูดคุยได้');
      }
    },
    switchToReportMode() {
      // ถ้ากดซ้ำที่โหมดเดิม ให้ออกจากโหมดนั้น
      if (this.currentMode === 'report') {
        this.currentMode = 'query'; // กลับไปโหมด default
        this.addToHistory('ai', 'คุณได้ออกจากโหมดแจ้งเหตุ');
      } else {
        this.currentMode = 'report';
        this.addToHistory('ai', 'คุณได้เข้าสู่โหมดแจ้งเหตุ กรุณารายละเอียดเหตุการณ์ที่พบ');
      }
    },
    startListening() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.addToHistory('ai', '⚠️ เบราว์เซอร์ของคุณไม่รองรับการแปลงเสียงเป็นข้อความ');
        return;
      }
      if (!this.isListening) {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = this.language === 'th' ? 'th-TH' : 'en-US';
        this.recognition.interimResults = true;
        this.baseDescription = this.description;

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          this.description = (this.baseDescription + ' ' + finalTranscript + interimTranscript).trim();
          if (finalTranscript) {
            this.baseDescription = this.description;
          }
        };
        this.recognition.onerror = (e) => {
          if (e.error !== 'aborted' && this.isListening) {
            this.recognition.start();
          }
        };
        this.recognition.onend = () => {
          if (this.isListening) {
            this.recognition.start();
          }
        };
        this.isListening = true;
        this.recognition.start();
      } else {
        this.isListening = false;
        if (this.recognition) {
          this.recognition.stop();
          this.recognition = null;
        }
      }
    }
  }
}
</script>

<style>
/* Light Theme Variables - Matching ReportForm */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #ffffff;
  --bg-tertiary: #e9ecef;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-muted: #adb5bd;
  --accent-blue: #74d1ee;
  --accent-green: #198754;
  --accent-red: #dc3545;
  --border-color: #dee2e6;
  --shadow-light: rgba(0, 0, 0, 0.05);
  --shadow-medium: rgba(0, 0, 0, 0.1);
}

/* Main Container */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

/* Header */
.chat-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.chat-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  text-align: center;
}

/* Chat Content */
.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 1rem;
  min-height: 0;
}
/* Chat History */
.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  min-height: 0;
  max-height: calc(90vh - 200px);
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--border-color);
}

.chat-history::-webkit-scrollbar {
  width: 8px;
}

.chat-history::-webkit-scrollbar-thumb {
  background: var(--text-muted);
  border-radius: 4px;
}

.chat-history::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
}

.chat-row {
  margin-bottom: 1.5rem;
}

/* AI Message */
.ai-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: 70%;
  margin-left: 1rem;
  margin-bottom: 1rem;
}

.ai-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.ai-icon img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.chat-bubble {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: break-word;
  max-width: 100%;
}

.chat-bubble.ai {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
}

.message-actions {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.ai-message:hover .message-actions {
  opacity: 1;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

/* User Message */
.user-message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  justify-content: flex-end;
  max-width: 70%;
  margin-left: auto;
  margin-right: 0.5rem;
  margin-bottom: 1rem;
}

.chat-bubble.user {
  background: var(--accent-blue);
  color: var(--bg-secondary);
  border: 1px solid var(--accent-blue);
  box-shadow: var(--shadow-light);
}

.edit-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.user-message:hover .edit-btn {
  opacity: 1;
}

.edit-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}



/* Input Area */
.input-area {
  padding: 0.5rem 0;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}


/* Mode Selector Row 2 */
.mode-selector-row {
  display: flex;
  justify-content: flex-start;
  padding: 0.5rem 0 0 0;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mode-btn:hover {
  color: var(--text-primary);
}

.mode-btn.active {
  color: var(--text-primary);
}

.input-container {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 0.75rem;
  box-shadow: var(--shadow-light);
}

.input-container:focus-within {
  border-color: var(--accent-blue);
  box-shadow: var(--shadow-medium);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.5;
  resize: none;
  min-height: 1.5rem;
  max-height: 3rem;
  overflow-y: auto;
  font-family: inherit;
  transition: height 0.2s ease;
  padding: 0.5rem 0;
}

.chat-input::placeholder {
  color: var(--text-muted);
}

.input-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
}

.input-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.input-btn.send-btn {
  background: var(--accent-blue);
  color: var(--text-primary);
}

.input-btn.send-btn:hover:not(:disabled) {
  background: #3367d6;
}

.input-btn.send-btn:disabled {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  cursor: not-allowed;
}

.mic-btn.mic-listening {
  background: var(--accent-red);
  color: var(--text-primary);
  animation: mic-pulse 1s infinite;
}

.media-preview-list {
  display: flex;
  gap: 0.75rem;
  margin: 0.75rem 0 0 0;
  flex-wrap: wrap;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.media-preview-list::-webkit-scrollbar {
  display: none;
}

.media-preview-item {
  position: relative;
  width: 4rem;
  height: 4rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  flex-shrink: 0;
  box-shadow: var(--shadow-light);
}

.media-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media-error {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-red);
  font-size: 0.75rem;
  text-align: center;
  padding: 0.5rem;
}

.remove-media-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(0, 0, 0, 0.7);
  color: var(--text-primary);
  border: none;
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.remove-media-btn:hover {
  background: var(--accent-red);
}

/* Suggestions */
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.suggestion-tag {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 1rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.suggestion-tag:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--accent-blue);
}

@keyframes mic-pulse {
  0% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(234, 67, 53, 0); }
  100% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0); }
}

.ai-typing {
  display: inline-block;
}

.ai-typing .dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background: var(--accent-blue);
  border-radius: 50%;
  animation: ai-bounce 1.2s infinite both;
}

.ai-typing .dot:nth-child(2) { animation-delay: 0.2s; }
.ai-typing .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes ai-bounce {
  0%, 80%, 100% { transform: scale(0.7); }
  40% { transform: scale(1.2); }
}

/* Chat Media */
.chat-media {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chat-media-item {
  border-radius: 0.5rem;
  overflow: hidden;
}

.chat-media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ai-typing {
  display: inline-block;
}
.ai-typing .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin: 0 2px;
  background: #1976d2;
  border-radius: 50%;
  animation: ai-bounce 1.2s infinite both;
}
.ai-typing .dot:nth-child(2) { animation-delay: 0.2s; }
.ai-typing .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes ai-bounce {
  0%, 80%, 100% { transform: scale(0.7); }
  40% { transform: scale(1.2); }
}
/* Responsive Design */
@media (max-width: 768px) {
  .chat-container {
    height: 100vh;
  }
  .chat-header {
    padding: 0.75rem 1rem;
  }
  .chat-title {
    font-size: 1.1rem;
  }
  .chat-content {
    padding: 0.5rem;
  }
  
  .chat-history {
    min-height: 0;
    max-height: calc(100vh - 180px);
  }
  
  .ai-message {
    max-width: 80%;
    padding: 0.5rem;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  
  .user-message {
    max-width: 80%;
    padding: 0.5rem;
    margin-left: auto;
    margin-right: 0.25rem;
  }
  
  .chat-bubble {
    font-size: 0.9rem;
    padding: 0.6rem 0.8rem;
  }
  
  .input-area {
    gap: 0.5rem;
  }
  
  .mode-selector-row {
    padding: 0.4rem 0;
  }
  
  .mode-btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }
  
  .input-container {
    padding: 0.6rem;
  }
  
  .chat-input {
    font-size: 1rem;
    max-height: 2.7rem;
    padding: 0.4rem 0;
  }
  
  .input-btn {
    width: 2rem;
    height: 2rem;
    padding: 0.25rem;
  }
  
  .media-preview-item {
    width: 3rem;
    height: 3rem;
  }
  
  .suggestion-tag {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }
}

@media (max-width: 480px) {
  .chat-header {
    padding: 0.5rem 0.75rem;
  }
  .chat-title {
    font-size: 1rem;
  }
  .chat-content {
    padding: 0.25rem;
  }
  
  .chat-history {
    min-height: 0;
    max-height: calc(89vh - 160px);
  }
  
  .ai-message {
    max-width: 85%;
    margin-left: 0.25rem;
    margin-right: 0.25rem;
  }
  
  .user-message {
    max-width: 85%;
    margin-left: auto;
    margin-right: 0.1rem;
  }
  
  .chat-bubble {
    font-size: 0.85rem;
    padding: 0.5rem 0.7rem;
  }
  
  .input-area {
    gap: 0.3rem;
    padding: 0.3rem 0;
  }
  
  .mode-selector-row {
    padding: 0.3rem 0;
  }
  
  .mode-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .input-container {
    padding: 0.5rem;
  }
  
  .chat-input {
    font-size: 0.95rem;
    max-height: 2.5rem;
    padding: 0.3rem 0;
  }
  
  .input-actions {
    gap: 0.25rem;
  }
  
  .input-btn {
    width: 1.75rem;
    height: 1.75rem;
    padding: 0.2rem;
  }
  
  .suggestions {
    gap: 0.25rem;
  }
  
  .suggestion-tag {
    font-size: 0.75rem;
    padding: 0.3rem 0.5rem;
  }
}

</style>
