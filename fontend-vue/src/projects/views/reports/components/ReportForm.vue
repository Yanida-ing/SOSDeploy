<template>
  <div>
    <CCard class="bg-style2">
      <CCardHeader class="bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
        <span  class="font-weight-bold h6"><CIcon name="cil-bell" size="lg"/> แจ้งเหตุฉุกเฉิน </span>
        <div class="card-header-actions">

        </div>
      </CCardHeader>
      <CCardBody>
        <!-- ลบส่วนเลือกความเร่งด่วนออก -->
        <CRow class="mt-4">
          <CCol>
            <CSelect label="ประเภทผู้แจ้ง *"
              :options="options.type"
              :value="select.userType"
              @input="onUserTypeChange"
              :disabled="loadingUserType"
              required
            />
          </CCol>
          <CCol>
            <CSelect label="ประเภทภัยพิบัติ *"
              :options="options.disasterTypes"
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
            <!-- ช่องอัปโหลดรูป -->
            <div class="mt-2">
              <label>อัปโหลดรูปภาพ (สูงสุด 5 รูป) : </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                @change="onMediaChange"
                :disabled="media.length >= 5"
              />
              <div v-if="media.length" class="media-preview-list mt-2">
                <div v-for="(img, idx) in media" :key="idx" class="media-preview-item" style="display:inline-block; margin-right:8px; position:relative;">
                  <img :src="img.src" :alt="'รูปที่ '+(idx+1)" style="width:84px; height:84px; object-fit:cover; border-radius:8px; border:1px solid #ccc;" />
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
            <CButton class="mr-1" size="sm" color="danger" shape="pill" variant="outline" >
              <span class="font-weight-bold pr-1 pl-1"><i class="cil-ban"></i> CANCEL </span>
            </CButton>
            <CButton size="sm" color="success" shape="pill" variant="outline" @click="onSubmit">
              <span class="font-weight-bold pr-1 pl-1"><i class="cil-save"></i> SUBMIT </span>
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
Vue.use(VueQuillEditor)

export default {
  name: 'ReportForm',
  components: {Multiselect, QEditor},
  data() {
    return {
      options : {
        type : [], // userType
        disasterTypes: [] // disasterType
      },
      select:{
        userType: '',
        disasterType: ''
      },
      form: {
        name: '',
        phone: '',
        description: '',
        location: ''
      },
      loadingUserType: false,
      loadingDisasterType: false,
      statusId: '', // _id ของ status
      levelId: '',  // _id ของระดับความรุนแรง (ระดับกลาง)
      media: [],     // เก็บรูปภาพที่อัปโหลด
      lat: null,
      lng: null,
    }
  },
  async mounted() {
    // ดึง userType
    this.loadingUserType = true;
    try {
      const res = await fetch('https://sos.mfu.ac.th/api/v1/report/usertype');
      const data = await res.json();
      this.options.type = (data.data || []).map(t => ({
        label: t.title.find(tt => tt.key === 'th')?.value,
        value: t._id
      }));
    } catch (e) {
      this.options.type = [];
    }
    this.loadingUserType = false;

    // ดึง disasterType
    this.loadingDisasterType = true;
    try {
      const res = await fetch('https://sos.mfu.ac.th/api/v1/report/type');
      const data = await res.json();
      this.options.disasterTypes = (data.data || []).map(t => ({
        label: t.title.find(tt => tt.key === 'th')?.value,
        value: t._id
      }));
    } catch (e) {
      this.options.disasterTypes = [];
    }
    this.loadingDisasterType = false;

    // ดึงระดับความรุนแรง
    // this.loadingLevel = true; // ลบออก
    try {
      const res = await fetch('https://sos.mfu.ac.th/api/v1/report/level');
      const data = await res.json();
      this.options.levels = (data.data || []).map(l => ({
        label: l.title.find(tt => tt.key === 'th')?.value,
        value: l._id
      }));
    } catch (e) {
      this.options.levels = [];
    }
    // this.loadingLevel = false; // ลบออก

    // ดึง status 'รอดำเนินการ'
    try {
      const res = await fetch('https://sos.mfu.ac.th/api/v1/report/status');
      const data = await res.json();
      const pending = (data.data || []).find(s => s.title.find(t => t.key === 'th' && t.value === 'รอดำเนินการ'));
      if (pending) this.statusId = pending._id;
    } catch (e) {
      this.statusId = '';
    }
    // ดึงระดับความรุนแรง 'ระดับกลาง'
    try {
      const res = await fetch('https://sos.mfu.ac.th/api/v1/report/level');
      const data = await res.json();
      const medium = (data.data || []).find(l =>
        l.title.find(t => t.key === 'th' && t.value.trim() === 'ระดับกลาง')
      );
      if (medium) {
        this.levelId = medium._id;
      } else if ((data.data || []).length > 0) {
        this.levelId = data.data[0]._id;
      } else {
        this.levelId = '';
      }
    } catch (e) {
      this.levelId = '';
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.lat = pos.coords.latitude;
          this.lng = pos.coords.longitude;
        },
        err => {
          this.lat = null;
          this.lng = null;
          // อาจแจ้งเตือนผู้ใช้ถ้าต้องการ
        }
      );
    }
  },

  created() {
  },

  beforeDestroy() {

  },

  methods: {
    // onEditor({ html }) {
    //   this.form.description = html;
    // },

    onMediaChange(e) {
      const files = Array.from(e.target.files);
      // จำกัดจำนวนรูปสูงสุด 5 รูป
      if (this.media.length + files.length > 5) {
        alert('อัปโหลดได้สูงสุด 5 รูป');
        e.target.value = '';
        return;
      }
      files.forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.media.push({
            type: file.type,
            src: ev.target.result
          });
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    },
    removeMedia(index) {
      this.media.splice(index, 1);
    },

    onUserTypeChange(val) {
      console.log('onUserTypeChange', val, typeof val);
      if (val && val.target && val.target.value) {
        this.select.userType = val.target.value;
      } else if (val && val.value) {
        this.select.userType = val.value;
      } else if (typeof val === 'string') {
        this.select.userType = val;
      } else if (Array.isArray(val) && val[0] && val[0].value) {
        this.select.userType = val[0].value;
      } else {
        this.select.userType = '';
      }
      console.log('userType after set', this.select.userType, typeof this.select.userType);
    },
    onDisasterTypeChange(val) {
      if (val && val.target && val.target.value) {
        this.select.disasterType = val.target.value;
      } else if (val && val.value) {
        this.select.disasterType = val.value;
      } else if (typeof val === 'string') {
        this.select.disasterType = val;
      } else if (Array.isArray(val) && val[0] && val[0].value) {
        this.select.disasterType = val[0].value;
      } else {
        this.select.disasterType = '';
      }
    },

    async onSubmit(){
      console.log('userType before submit', this.select.userType, typeof this.select.userType);
      // ไม่ต้อง extract value แล้ว แค่เช็คว่าเป็น string
      if (!this.select.userType || typeof this.select.userType !== 'string') {
        alert('กรุณาเลือกประเภทผู้แจ้ง');
        return;
      }
      if (!this.select.disasterType || typeof this.select.disasterType !== 'string') {
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
      const payload = {
        type: this.select.disasterType,
        user: this.select.userType,
        description: this.form.description,
        location,
        contact: {
          name: this.form.name,
          phone: this.form.phone
        },
        status: this.statusId, 
        level: this.levelId,    
        media: this.media 
      };
      try {
        const res = await fetch('https://sos.mfu.ac.th/api/v1/report/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        console.log('submit result', result);
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
          this.select.userType = '';
          this.select.disasterType = '';
          this.form = { name: '', phone: '', description: '', location: '' };
          this.media = [];
        } else {
          await Swal.fire('เกิดข้อผิดพลาด', result.message || JSON.stringify(result) || 'ไม่สามารถส่งรายงานได้', 'error');
        }
      } catch (e) {
        await Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์', 'error');
      }
    },

    selectStyle(opt) {
      this.select.levels = opt.value;
    },


  },

  computed: {
    ...mapGetters({
      lang : "setting/lang",
      levels: 'setting/levels',
    })
  },

  watch: {

    levels: function (value) {
      var lang = this.$store.getters['setting/lang'];
      // console.log(value);
      this.options.levels = [
        ...value.map(objs => ({
          ...objs,
          label: objs.title.filter(title => title.key === lang)[0]?.value || '',
          value: objs._id
        }))
      ];
    }
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

