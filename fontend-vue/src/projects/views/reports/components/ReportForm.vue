<template>
  <div>
    <CCard class="bg-style2" style="border-radius: 0rem 0px 1rem 1rem">
      <CCardBody class="bg-secondary" style="border-radius: 0rem 0px 1rem 1rem">
        <CRow class="mt-4">
          <CCol>
            <CSelect label="ประเภทผู้แจ้ง *"
              :options="options && options.type ? options.type : []"
              :value="select.userType"
              @input="onUserTypeChange"
              :disabled="loadingUserType"
              required
            />
          </CCol>
          <CCol>
            <CSelect label="ประเภทภัยพิบัติ *"
              :options="options && options.disasterTypes ? options.disasterTypes : []"
              :value="select.disasterType"
              @input="onDisasterTypeChange"
              :disabled="loadingDisasterType"
              required
            />
          </CCol>
        </CRow>
        <CRow>
          <CCol>
            <CInput label="ชื่อผู้แจ้ง *" v-model="form.name" required></CInput>
          </CCol>
          <CCol>
            <CInput label="เบอร์ติดต่อ *" v-model="form.phone" required></CInput>
          </CCol>
        </CRow>
        <CRow class="mb-3">
          <CCol col="12">

            <CInput
              label="รายละเอียด *"
              v-model="form.description"
              type="textarea"
              rows="4"
              required
            />
            <div class="mt-2">
              <label>อัปโหลดรูปภาพ (สูงสุด 1 รูป, ขนาดไม่เกิน 5MB) : </label>
              <input
                type="file"
                accept="image/*"
                multiple
                @change="onMediaChange"
                :disabled="media.length >= 1"
              />
              <div v-if="media.length" class="media-preview-list mt-2">
                <div v-for="(img, idx) in media" :key="idx" class="media-preview-item" style="display:inline-block; margin-right:8px; position:relative;">
                  <img v-if="isFile(img)" :src="getObjectURL(img)" :alt="'รูปที่ '+(idx+1)" style="width:84px; height:84px; object-fit:cover; border-radius:8px; border:1px solid #ccc;" />
                  <div v-else style="color:red; font-size:0.9em;">ไม่สามารถแสดงรูปนี้ได้</div>
                  <button @click="removeMedia(idx)" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;">&times;</button>
                </div>
              </div>
            </div>
          </CCol>
        </CRow>

        <CRow>
          <CCol>
            <CInput label="สถานที่เกิดเหตุ " placeholder="อาคาร ห้อง หรือตำแหน่งที่เกิดเหตุ" v-model="form.location"> </CInput>
          </CCol>
        </CRow>

        <CDropdownDivider/>
        <CRow class="text-right mt-3">
          <CCol>
            <CButton class="mr-1" size="sm" color="danger" shape="pill" variant="outline" @click="handleClose">
              <span class="font-weight-bold pr-1 pl-1"><CIcon name="cil-ban"/> CANCEL </span>
            </CButton>
            <CButton size="sm" color="success" shape="pill" variant="outline" @click="onSubmit" :disabled="isSubmitting">
              <span class="font-weight-bold pr-1 pl-1">
                <CIcon name="cil-save"/>
                <span v-if="isSubmitting"><CSpinner size="sm" color="light" /> กำลังส่ง...</span>
                <span v-else>SUBMIT</span>
              </span>
            </CButton>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>

import {mapGetters} from 'vuex'
import QEditor from "@/projects/components/Util/QEditor.vue";
import VueQuillEditor from 'vue-quill-editor'
import 'quill/dist/quill.snow.css'

import Vue from 'vue'
import Multiselect from "vue-multiselect";
import 'vue-multiselect/dist/vue-multiselect.min.css'
import Swal from 'sweetalert2'
import { CIcon } from '@coreui/icons-vue'
import axios from 'axios'
Vue.use(VueQuillEditor)

export default {
  name: 'ReportForm',
  components: {Multiselect, QEditor, CIcon},
  data() {
    return {
      isSubmitting: false,
    }
  },
  computed: {
    ...mapGetters({
      options: 'ReportForm/options',
      selectStore: 'ReportForm/select',
      formStore: 'ReportForm/form',
      media: 'ReportForm/media',
      statusId: 'ReportForm/statusId',
      levelId: 'ReportForm/levelId',
      lat: 'ReportForm/lat',
      lng: 'ReportForm/lng',
      loadingUserType: 'ReportForm/loadingUserType',
      loadingDisasterType: 'ReportForm/loadingDisasterType',
    }),
    select: {
      get() { return this.selectStore },
      set(val) { this.$store.commit('ReportForm/setSelect', val) }
    },
    form: {
      get() { return this.formStore },
      set(val) { this.$store.commit('ReportForm/setForm', val) }
    }
  },
  async mounted() {
    await this.$store.dispatch('ReportForm/fetchUserTypes')
    await this.$store.dispatch('ReportForm/fetchDisasterTypes')
    await this.$store.dispatch('ReportForm/fetchStatus')
    await this.$store.dispatch('ReportForm/fetchLevel')
    
    // ตั้งค่าเริ่มต้นสำหรับ dropdown
    this.$nextTick(() => {
      if (this.options && this.options.type && this.options.type.length > 0) {
        const firstUserType = this.options.type[0];
        this.onUserTypeChange(firstUserType);
      }
      if (this.options && this.options.disasterTypes && this.options.disasterTypes.length > 0) {
        const firstDisasterType = this.options.disasterTypes[0];
        this.onDisasterTypeChange(firstDisasterType);
      }
    });
    
    // fetch levels, status, location ตาม logic เดิม (เพิ่ม action ใน store ได้)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.$store.commit('ReportForm/setLat', pos.coords.latitude)
          this.$store.commit('ReportForm/setLng', pos.coords.longitude)
        },
        err => {
          this.$store.commit('ReportForm/setLat', null)
          this.$store.commit('ReportForm/setLng', null)
        }
      );
    }
  },

  created() {
  },

  beforeDestroy() {

  },

  methods: {
    isFile(obj) {
      try {
        return typeof File === 'function' && obj instanceof File;
      } catch (e) {
        return false;
      }
    },
    getObjectURL(file) {
      return (window.URL && file) ? window.URL.createObjectURL(file) : '';
    },
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    async compressImage(file, maxSize) {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions (maintain aspect ratio)
          let { width, height } = img;
          const maxDimension = 1024; // Max width/height
          
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels
          let quality = 0.8;
          let compressedFile;
          
          const tryCompress = () => {
            canvas.toBlob((blob) => {
              if (blob.size <= maxSize || quality <= 0.1) {
                compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            }, 'image/jpeg', quality);
          };
          
          tryCompress();
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    },
    async onMediaChange(e) {
      const files = Array.from(e.target.files);
       // จำกัดจำนวนรูปสูงสุด 1 รูป
      if (this.media.length + files.length > 1) {
        Swal.fire({
          icon: 'warning',
          title: 'จำนวนรูปเกินขีดจำกัด',
          text: 'อัปโหลดได้สูงสุด 1 รูปเท่านั้น',
          confirmButtonText: 'ตกลง'
        });
        e.target.value = '';
        return;
      }
      
      for (let file of files) {
        if (!file.type.startsWith('image/')) continue;
        
        const targetSize = 1 * 1024 * 1024; // 1MB target for ReportForm
        
        // บีบอัดทุกไฟล์ให้ต่ำกว่า 1MB
        if (file.size > targetSize) {
          try {
            Swal.fire({
              icon: 'info',
              title: 'กำลังบีบอัดรูปภาพให้ต่ำกว่า 1MB...',
              text: 'กรุณารอสักครู่',
              allowOutsideClick: false,
              showConfirmButton: false
            });
            file = await this.compressImage(file, targetSize);
            Swal.close();
            Swal.fire({
              icon: 'success',
              title: 'บีบอัดรูปภาพสำเร็จ!',
              timer: 1500,
              showConfirmButton: false
            });
          } catch (error) {
            Swal.close();
                          Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถบีบอัดไฟล์ได้',
                text: 'กรุณาเลือกรูปที่มีขนาดไม่เกิน 1MB',
                confirmButtonText: 'ตกลง'
              });
            continue;
          }
        } else if (file.size > maxFileSize) {
          Swal.fire({
            icon: 'error',
            title: 'ขนาดไฟล์ใหญ่เกินไป',
            text: 'ขนาดไฟล์รูปภาพต้องไม่เกิน 1MB',
            confirmButtonText: 'ตกลง'
          });
          continue;
        }
        
        this.$store.commit('ReportForm/addMedia', file);
      }
      
      e.target.value = '';
    },
    removeMedia(index) {
      this.$store.commit('ReportForm/removeMedia', index);
    },

    onUserTypeChange(val) {
      let userType = '';
      if (val && val.target && val.target.value) {
        userType = val.target.value;
      } else if (val && val.value) {
        userType = val.value;
      } else if (typeof val === 'string') {
        userType = val;
      } else if (Array.isArray(val) && val[0] && val[0].value) {
        userType = val[0].value;
      }
      this.$store.commit('ReportForm/setSelect', { userType });
    },
    onDisasterTypeChange(val) {
      let disasterType = '';
      if (val && val.target && val.target.value) {
        disasterType = val.target.value;
      } else if (val && val.value) {
        disasterType = val.value;
      } else if (typeof val === 'string') {
        disasterType = val;
      } else if (Array.isArray(val) && val[0] && val[0].value) {
        disasterType = val[0].value;
      }
      this.$store.commit('ReportForm/setSelect', { disasterType });
    },

    async onSubmit(){
      if (this.isSubmitting) return;
      this.isSubmitting = true;
      
      console.log('Debug - select.userType:', this.select.userType);
      console.log('Debug - select.disasterType:', this.select.disasterType);
      
      // ตรวจสอบประเภทผู้แจ้ง
      let userType = this.select.userType;
      if (typeof userType === 'object' && userType && userType.value) {
        userType = userType.value;
      } else if (typeof userType === 'object' && userType && userType.label) {
        userType = userType.label;
      }
      console.log('Debug - processed userType:', userType);
      if (!userType) {
        alert('กรุณาเลือกประเภทผู้แจ้ง');
        return;
      }
      
      // ตรวจสอบประเภทภัยพิบัติ
      let disasterType = this.select.disasterType;
      if (typeof disasterType === 'object' && disasterType && disasterType.value) {
        disasterType = disasterType.value;
      } else if (typeof disasterType === 'object' && disasterType && disasterType.label) {
        disasterType = disasterType.label;
      }
      console.log('Debug - processed disasterType:', disasterType);
      if (!disasterType) {
        alert('กรุณาเลือกประเภทภัยพิบัติ');
        return;
      }
      if (!this.form.name || !this.form.phone || !this.form.description) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      if (!this.statusId) {
        alert('ไม่สามารถดึงสถานะเริ่มต้นได้');
        return;
      }
      if (!this.levelId) {
        alert('ไม่สามารถดึงระดับความรุนแรงเริ่มต้นได้');
        return;
      }
      const location = { address: this.form.location };
      if (this.lat !== null && this.lng !== null) {
        location.coordinates = [this.lng, this.lat];
      } else {
        location.coordinates = [0, 0];
      }
      const formData = new FormData();
      formData.append('type', disasterType);
      formData.append('user', userType);
      formData.append('description', this.form.description);
      formData.append('location', JSON.stringify(location));
      formData.append('contact', JSON.stringify({
        name: this.form.name,
        phone: this.form.phone
      }));
      formData.append('status', this.statusId);
      formData.append('level', this.levelId);
      formData.append('intent', 'report');
      if (this.media && this.media.length > 0) {
        this.media.forEach((img) => {
          if (this.isFile(img)) {
            formData.append('media', img);
          }
        });
      }
      for (let pair of formData.entries()) {
        console.log(pair[0]+ ':', pair[1]);
      }
      // SweetAlert loading
      Swal.fire({
        title: 'กำลังส่งข้อมูล...',
        html: '<div style="font-size:1.1rem;">เรากำลังส่งข้อมูลของคุณไปยังเจ้าหน้าที่</div>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => { Swal.showLoading(); }
      });
      try {
        //http://localhost:8081/api/v1/report/report,https://sos.mfu.ac.th/api/v1/report/report
        const res = await axios.post('https://sos.mfu.ac.th/api/v1/report/report', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        Swal.close();
        const result = res.data;
        if (
          result.code === 20000 ||
          result.success === true ||
          result.status === 'success' ||
          (result.data && result.data._id)
        ) {
          await Swal.fire({
            icon: 'success',
            title: 'รายงานของคุณถูกส่งเรียบร้อยแล้ว',
            showConfirmButton: true,
            confirmButtonText: 'ตกลง'
          });
          await Swal.fire({
            icon: 'info',
            title: 'เจ้าหน้าที่กำลังดำเนินการ',
            html: '<div style="font-size:1.1rem;">โปรดรอสักครู่ เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด</div>',
            showConfirmButton: false,
            showCloseButton: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            willOpen: () => { Swal.showLoading() }
          });
          this.$store.commit('ReportForm/resetForm');
        } else {
          await Swal.fire('เกิดข้อผิดพลาด', result.message || JSON.stringify(result) || 'ไม่สามารถส่งรายงานได้', 'error');
        }
      } catch (e) {
        Swal.close();
        await Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
      } finally {
        this.isSubmitting = false;
      }
    },

    selectStyle(opt) {
      this.select.levels = opt.value;
    },


    handleClose() {
        this.$store.commit("dialog/isDisaters", false)
    }

  },

  watch: {

  }
}
</script>

<style scoped>
CCardBody {
  min-height: 65vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
@media (max-width: 900px) {
  CCardBody {
    min-height: 50vh;
    padding: 1.2rem 0.5rem 1rem 0.5rem;
  }
}
</style>
