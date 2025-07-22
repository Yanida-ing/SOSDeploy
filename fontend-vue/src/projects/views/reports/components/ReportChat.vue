<template>
  <div class="report-chat-copilot">
    <div class="welcome-title">
      แจ้งเหตุฉุกเฉินและภัยพิบัติ
    </div>
    <!-- <div class="welcome-desc">
      {{ t('reportDescription') }}
    </div> -->
    <div class="copilot-input-bar">
      <textarea
        v-model="description"
        :placeholder="t('typeMessageOrSpeak')"
        class="copilot-input"
        @keyup.enter="handleSubmit"
        :disabled="isSubmitting"
        rows="1"
        @input="autoResize"
        style="resize: none;"
        ref="copilotTextarea"
      ></textarea>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        @change="onMediaChange"
        style="display: none"
        :disabled="isSubmitting"
      />
      <button @click="triggerCamera" class="icon-btn" :disabled="isSubmitting"><i class="cil-camera"></i></button>
      <button @click="startListening" class="icon-btn" :disabled="isSubmitting"><i class="cil-mic"></i></button>
      <button @click="handleSubmit" class="icon-btn send-btn" :disabled="isSubmitting"><i class="cil-send"></i></button>
    </div>
    <div v-if="media.length" class="media-preview-list">
      <div v-for="(img, idx) in media" :key="idx" class="media-preview-item">
        <img :src="img.src" :alt="img.name" class="media-preview-img" />
        <button class="remove-media-btn" @click="removeMedia(idx)" :disabled="isSubmitting">&times;</button>
      </div>
    </div>
    <div class="suggestion-tags">
      <span v-for="(tag, idx) in suggestions" :key="idx" class="suggestion-tag" @click="description = tag">
        {{ tag }}
      </span>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'

export default {
  name: 'ReportChat',
  data() {
    return {
      description: '',
      media: [],
      fileInput: null,
      location: null,
      isListening: false,
      language: 'th',
      apiBase: 'https://sos.mfu.ac.th',
      contact: { name: '', phone: '' },
      isSubmitting: false,
      pendingContactReportId: null,
      suggestions: [
        'น้ำท่วม', 'ไฟไหม้', 'อุบัติเหตุ', 'แจ้งเหตุฉุกเฉิน', 'ช่วยเหลือ'
      ],
      translations: {
        th: {
          reportTitle: 'แจ้งข้อมูลภัยพิบัติ',
          reportDescription: 'อุบัติเหตุและภัยพิบัติสามารถเกิดขึ้นได้ทุกเมื่อ โดยไม่ทันตั้งตัว การแจ้งเหตุที่รวดเร็วและแม่นยำจะช่วยให้หน่วยงานสามารถเข้าถึงพื้นที่ได้ทันท่วงทีลดความสูญเสีย และช่วยเหลือผู้ประสบภัยอย่างมีประสิทธิภาพ โปรดรายงานเหตุการณ์ที่พบเห็นเพื่อร่วมเป็นส่วนหนึ่งในการปกป้องชีวิตและความปลอดภัยของทุกคน',
          typeMessageOrSpeak: 'กรุณากรอกข้อความและข้อมูลติดต่อ',
          confirmReportTitle: 'ยืนยันการแจ้งข้อมูล?',
          confirmReportText: 'โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน',
          confirmReportButton: 'ใช่, ยืนยัน!',
          cancelReportButton: 'ไม่, ยกเลิก',
          reportSuccessTitle: 'สำเร็จ!',
          reportSuccessText: 'รายงานของคุณถูกส่งเรียบร้อยแล้ว.',
          reportErrorTitle: 'เกิดข้อผิดพลาด!',
          reportErrorMessage: 'ไม่สามารถส่งรายงานได้: ',
          cancel: 'ยกเลิก',
          reportCanceled: 'การส่งรายงานถูกยกเลิก.',
          cannotListen: '⚠️ ไม่สามารถฟังเสียงได้: ',
          yourBrowserNotSupportVoiceRecognition: 'เบราว์เซอร์ของคุณไม่รองรับการแปลงเสียงเป็นข้อความ'
        }
      }
    }
  },
  mounted() {
    this.fileInput = this.$refs.fileInput
    this.getLocation()
  },
  methods: {
    t(key) {
      return this.translations[this.language][key] || key
    },
    getLocation() {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }
        },
        (err) => {
          console.error('Location error:', err)
        }
      )
    },
    autoResize(e) {
      const textarea = e.target
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    },
    async handleSubmit() {
      if (this.isSubmitting) return // ป้องกันส่งซ้ำ

      if (!this.description.trim()) {
        await Swal.fire('ข้อความว่าง', 'กรุณาพิมพ์ข้อความก่อนส่ง', 'warning')
        return
      }

      // ถ้ามี pendingContactReportId แปลว่ากำลังรออัปเดต contact
      if (this.pendingContactReportId) {
        // ดึงเบอร์โทร (รองรับเฉพาะเบอร์มือถือไทยขึ้นต้น 06, 08, 09)
        const phoneMatch = this.description.match(/(0[689]\d{8})/);
        const phone = phoneMatch ? phoneMatch[1] : '';
        let name = '';
        if (phone) {
          // กรณี "ชื่อ กร เบอร์ 0646630695"
          const nameMatch = this.description.match(/ชื่อ\s*([^\s]+)(?:\s*เบอร์|\s*0[689]\d{8})?/);
          if (nameMatch && nameMatch[1]) {
            name = nameMatch[1].trim();
          } else {
            // กรณี "กร 0646630695" หรือ "กร เบอร์0646630695"
            const beforePhone = this.description.split(phone)[0].trim();
            name = beforePhone.split(/\s+/).filter(w => !/^(ชื่อ|เบอร์|เบอร์โทร|โทร)$/.test(w)).pop();
          }
        }
        if (!name || !phone) {
          await Swal.fire('กรุณาพิมพ์ชื่อและเบอร์โทรในช่องข้อความ เช่น "ชื่อ สมชาย เบอร์ 0812345678" หรือ "สมชาย 0812345678"', '', 'warning')
          return
        }
        // ส่งเฉพาะ contact ไป backend
        const updateRes = await fetch(`${this.apiBase}/api/v1/report/report/${this.pendingContactReportId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact: { name, phone } })
        })
        const updateData = await updateRes.json()
        if (updateData.success || updateData.data) {
          await Swal.fire({
            icon: 'success',
            title: 'รายงานของคุณถูกส่งเรียบร้อยแล้ว',
            showConfirmButton: true,
            confirmButtonText: 'ตกลง'
          })
          await Swal.fire({
            icon: 'info',
            title: 'เจ้าหน้าที่กำลังดำเนินการ',
            html: '<div style="font-size:1.1rem;">โปรดรอสักครู่ เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด</div>',
            showConfirmButton: false,
            showCloseButton: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            willOpen: () => {
              Swal.showLoading()
            }
          })
          this.pendingContactReportId = null
          this.description = ''
          this.media = []
          this.contact = { name: '', phone: '' }
        } else {
          await Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลติดต่อได้', 'error')
        }
        return
      }

      this.isSubmitting = true // เริ่มส่งข้อมูล

      const result = await Swal.fire({
        title: this.t('confirmReportTitle'),
        text: this.t('confirmReportText'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: this.t('confirmReportButton'),
        cancelButtonText: this.t('cancelReportButton'),
        reverseButtons: true
      })

      if (!result.isConfirmed) {
        await Swal.fire(this.t('cancel'), this.t('reportCanceled'), 'info')
        this.isSubmitting = false // รีเซ็ต flag
        return
      }

      // Loading modal
      Swal.fire({
        title: 'กำลังประมวลผล...',
        html: '<div style="font-size:1rem;">เรากำลังส่งข้อมูลของคุณให้เจ้าหน้าที่ กรุณารอสักครู่...</div>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading()
        }
      })

      try {
        const payload = {
          text: this.description,
          media: this.media,
          location: this.location
            ? { coordinates: [this.location.lng, this.location.lat] }
            : undefined,
          contact: this.contact
        }

        const res = await fetch(`${this.apiBase}/api/v1/report/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()

        if (data.code === 20000 || data.httpcode === 200 || data.data) {
          const report = data.data || {}

          // ถ้า contact ไม่ครบ
          if (!report.contact || !report.contact.phone) {
            // แจ้งเตือน user ให้กรอก contact ในช่องเดิม
            this.pendingContactReportId = report._id
            await Swal.fire({
              icon: 'warning',
              title: 'กรุณากรอกข้อมูลติดต่อ',
              text: 'พิมพ์ชื่อและเบอร์โทรในช่องข้อความด้านล่าง หรือพูดเพื่อรายงาน',
              confirmButtonText: 'ตกลง'
            })
            this.isSubmitting = false
            return
          }

          // ถ้า contact ว่างหลังส่ง report ให้แจ้งเตือน user ให้กรอก contact ในช่องข้อความเดิม (หรือพูด) แล้ว set pendingContactReportId = report._id
          // ถ้า contact ว่างหลังส่ง report ให้แจ้งเตือน user ให้กรอก contact ในช่องข้อความเดิม (หรือพูด) แล้ว set pendingContactReportId = report._id

          // แสดง waiting modal (ปิดได้ด้วย X)
          await Swal.fire({
            icon: 'success',
            title: 'รายงานของคุณถูกส่งเรียบร้อยแล้ว',
            showConfirmButton: true,
            confirmButtonText: 'ตกลง'
          })

          await Swal.fire({
            icon: 'info',
            title: 'เจ้าหน้าที่กำลังดำเนินการ',
            html: '<div style="font-size:1.1rem;">โปรดรอสักครู่ เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด</div>',
            showConfirmButton: false,
            showCloseButton: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            willOpen: () => {
              Swal.showLoading()
            }
          })

          // Reset form
          this.description = ''
          this.media = []
          this.contact = { name: '', phone: '' }
        } else {
          throw new Error(data.message || 'เกิดข้อผิดพลาดบางอย่าง')
        }
      } catch (e) {
        await Swal.fire(
          this.t('reportErrorTitle'),
          this.t('reportErrorMessage') + e.message,
          'error'
        )
      } finally {
        this.isSubmitting = false // ส่งเสร็จ รีเซ็ต flag
        Swal.close()
      }
    },
    startListening() {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        Swal.fire({
          icon: 'warning',
          title: this.t('reportErrorTitle'),
          text: this.t('yourBrowserNotSupportVoiceRecognition')
        })
        return
      }

      const recognition = new SpeechRecognition()
      recognition.lang = this.language === 'th' ? 'th-TH' : 'en-US'
      recognition.interimResults = true
      let baseDescription = this.description

      this.isListening = true
      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }
        if (finalTranscript) {
          baseDescription = baseDescription + ' ' + finalTranscript
          this.description = baseDescription
        }
      }
      recognition.onerror = (e) => {
        Swal.fire(this.t('cannotListen') + e.error)
        this.isListening = false
      }
      recognition.onend = () => {
        this.isListening = false
        // ลบ this.handleSubmit() ออก เพื่อป้องกันส่งซ้ำ
      }
      recognition.start()
    },
    onMediaChange(e) {
      const files = Array.from(e.target.files)
      // จำกัดจำนวนรูปสูงสุด 5 รูป
      if (this.media.length + files.length > 5) {
        Swal.fire('อัปโหลดได้สูงสุด 5 รูป', 'กรุณาลบรูปเก่าออกก่อนอัปโหลดเพิ่ม', 'warning')
        this.$refs.fileInput.value = ''
        return
      }
      files.forEach((file) => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = (ev) => {
          this.media.push({
            type: file.type,
            src: ev.target.result
          })
        }
        reader.readAsDataURL(file)
      })
      this.$refs.fileInput.value = ''
    },
    triggerCamera() {
      if (!this.isSubmitting) {
        this.fileInput.click()
      }
    },
    removeMedia(index) {
      this.media.splice(index, 1)
    }
  }
}
</script>

<style>
.report-chat-copilot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 65vh;
  border-radius: 2rem;
  background: #f1ece3;
}
@media (max-width: 900px) {
  .report-chat-copilot {
    min-height: 50vh;
    padding: 1.2rem 0.5rem 1rem 0.5rem;
  }
}
@media (max-width: 600px) {
  .welcome-title {
    font-size: 1.2rem;
  }
  .welcome-desc {
    font-size: 1rem;
  }
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  color: #222;
  text-align: center;
}

.welcome-desc {
  font-size: 1.15rem;
  color: #888;
  margin-bottom: 2.5rem;
  text-align: center;
  max-width: 600px;
}

.copilot-input-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 2rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  padding: 0.5rem 1.2rem;
  width: 100%;
  max-width: 540px;
  margin-top: 10rem;
  margin-bottom: 1.5rem;
}

.copilot-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1.15rem;
  background: transparent;
  padding: 0.7rem 0.5rem;
  min-height: 2.2rem;
  max-height: 8rem;
  line-height: 1.5;
  overflow-y: auto;
  resize: none;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  margin-left: 0.2rem;
  color: #888;
  cursor: pointer;
  transition: color 0.15s;
}
.icon-btn:hover {
  color: #1976d2;
}
.send-btn {
  color: #fff;
  background: #1976d2;
  border-radius: 50%;
  width: 2.2rem;
  height: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.4rem;
  font-size: 1.3rem;
  transition: background 0.2s;
}
.send-btn:hover {
  background: #125ea7;
}

.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  justify-content: center;
  margin-top: 0.5rem;
}
.suggestion-tag {
  background: #fff;
  border-radius: 1.2rem;
  padding: 0.5rem 1.1rem;
  font-size: 1rem;
  color: #1976d2;
  border: 1px solid #e0e7ff;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(25, 118, 210, 0.04);
  transition: background 0.15s, color 0.15s;
}
.suggestion-tag:hover {
  background: #e3f2fd;
  color: #125ea7;
}
.media-preview-list {
  display: flex;
  gap: 0.7rem;
  margin: 0.5rem 0 1.2rem 0;
  flex-wrap: wrap;
  justify-content: center;
}
.media-preview-item {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 0.7rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.08);
  background: #fff;
  border: 1px solid #e0e7ff;
}
.media-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.remove-media-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 1.1rem;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.remove-media-btn:hover {
  background: #d32f2f;
}
</style>