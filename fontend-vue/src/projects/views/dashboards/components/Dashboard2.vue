<template>
  <div>
    <CRow>
      <CCol>
        <CCard class="bg-style2">
          <CCardHeader class="bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
            <span class="font-weight-bold h6"><CIcon name="cil-tags" size="lg"/> {{ caption }}</span>
            <div class="card-header-actions" @click="goBack" style="cursor: pointer">
              <CIcon name="cil-x" size="lg" />
            </div>
          </CCardHeader>

          <CCardBody>
            <CRow>
              <CCol>
                <template v-if="caseData">
                  <p class="font-weight-bold mb-0 h5">{{ title }}</p>
                  <p>{{ caseData.description }}</p>
                </template>
                <template v-else>
                  <p>กำลังโหลดข้อมูล...</p>
                </template>
              </CCol>
              <CCol>
                <template v-if="caseData">
                  <p class="font-weight-bold text-right mb-0">{{ date }}</p>
                </template>
              </CCol>
            </CRow>
            <CRow v-if="caseData">
              <CCol col="4">
                <CIcon name="cil-contact" size="lg"/> {{ contact }}
              </CCol>
              <CCol col="4">
                <CIcon name="cil-building" size="lg"/> {{ address}}
              </CCol>
              <CCol col="4">
                <CIcon name="cil-phone" size="lg"/> {{ phone }}
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CRow class="mt-2">
      <CCol>
        <CRow>
          <CCol col="12" class="mb-2">
            <FoodAssest :item="items" caption="#" icon="cil-fastfood" :caseKey="caseData && caseData._id ? caseData._id : 'default'"/>
          </CCol>

          <CCol col="12" class="mb-2">
            <CarAssest :item="cars" caption="รถรับส่ง" icon="cil-bus-alt"/>
          </CCol>

          <CCol col="12" class="mb-2">
            <CaseHistory 
              :case-data="caseData && caseData.caseManagement ? caseData.caseManagement : {}"
              :case-id="caseData && caseData._id"
              caption="ประวัติการเปิดปิดเคส"
              icon="cil-history"
              @case-opened="handleCaseOpened"
              @case-closed="handleCaseClosed"
              @case-updated="handleCaseUpdated"
            />
          </CCol>
        </CRow>
      </CCol>
      <CCol>
        <GoogleMaps
          v-if="hasValidCoordinates()"
        />
        <GoogleMaps v-else />
      </CCol>
    </CRow>

    <CRow class="text-right mt-3 mb-3">
      <CCol>
        <CButton class="mr-2" size="sm" color="danger" shape="pill" variant="outline"  @click="goBack">
          <span class="font-weight-bold pr-1 pl-1"><CIcon name="cil-ban" size="sm"/> CANCEL </span>
        </CButton>
        <CButton size="sm" color="success" shape="pill" variant="outline">
          <span class="font-weight-bold pr-1 pl-1"><CIcon name="cil-save" size="sm"/> SUBMIT </span>
        </CButton>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import FoodAssest from '@/projects/components/Util/FoodAssest.vue'
import CarAssest from '@/projects/components/Util/CarAssest.vue'
import CaseHistory from '@/projects/components/Util/CaseHistory.vue'
import GoogleMaps from './GoogleMaps.vue'

export default {
  name: 'Dashboard2',
  components: {
    FoodAssest,
    CarAssest,
    CaseHistory,
    GoogleMaps
  },
  props: {
    caption: {
      type: String,
      default: 'รายละเอียดเคส'
    }
  },

  data() {
    return {
      title: '',
      date: '',
      contact: '',
      address: '',
      phone: ''
    }
  },

  created() {
    this.onInit();
  },

  methods: {
    onInit() {
      const caseId = this.$route.query.id;
      if (caseId) {
        this.$store.dispatch("Dashboard2/case", { id: caseId });
      }
    },

    goBack() {
      this.$router.go(-1);
    },

    formatDate(date) {
      return moment(date).format('DD/MM/YYYY HH:mm');
    },

    updateDisplayData() {
      if (this.caseData) {
        this.title = this.caseData.type && this.caseData.type.title 
          ? this.caseData.type.title.find(t => t.key === 'th')?.value || 'ไม่ระบุ'
          : 'ไม่ระบุ';
        
        this.date = this.caseData.timeStamps 
          ? this.formatDate(this.caseData.timeStamps) 
          : 'ไม่ระบุ';
        
        this.contact = this.caseData.contact && this.caseData.contact.name 
          ? this.caseData.contact.name 
          : 'ไม่ระบุ';
        
        this.address = this.caseData.location && this.caseData.location.address 
          ? this.caseData.location.address 
          : 'ไม่ระบุ';
        
        this.phone = this.caseData.contact && this.caseData.contact.phone 
          ? this.caseData.contact.phone 
          : 'ไม่ระบุ';
      }
    },

    hasValidCoordinates() {
      return this.caseData && 
             this.caseData.location && 
             this.caseData.location.coordinates && 
             this.caseData.location.coordinates.length === 2;
    },

    handleCaseOpened(data) {
      // จัดการหลังจากเปิดเคสสำเร็จ - store ได้อัพเดทแล้ว
      console.log('Case opened successfully:', data);
    },

    handleCaseClosed(data) {
      // จัดการหลังจากปิดเคสสำเร็จ - store ได้อัพเดทแล้ว
      console.log('Case closed successfully:', data);
    },

    handleCaseUpdated() {
      // ส่งสัญญาณให้ parent component ทราบว่ามีการอัพเดทเคส
      this.$emit('case-updated');
    }
  },

  computed: {
    ...mapGetters({
      // lang: 'setting/lang',
      caseData: 'Dashboard2/case', // ใช้ caseData ใน template แต่ map กับ case ใน store
      items: 'Dashboard2/items',
      cars: 'Dashboard2/cars',
    })
  },

  watch: {
    caseData: {
      handler(newVal, oldVal) {
        this.updateDisplayData();
        this.$emit('case-changed', newVal);
        // ถ้ามีการเปลี่ยนแปลง caseManagement ให้รีเฟรช Dashboard
        if (newVal && oldVal && 
            JSON.stringify(newVal.caseManagement) !== JSON.stringify(oldVal.caseManagement)) {
          this.$store.dispatch("Dashboard/reports", {});
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: modalSlideIn 0.3s ease-out;
  border: none;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  min-height: 60px;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.modal-title {
  margin: 0;
  font-weight: bold;
  font-size: 1rem;
  flex: 1;
  margin-right: 4rem;
  display: flex;
  align-items: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: white;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-left: auto;
}

.close:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
  align-items: center;
  background: white;
}

.form-group {
  margin-bottom: 1.25rem;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
}

.form-group label {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.form-control:focus {
  outline: none;
  border-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
  background: white;
}

.form-control::placeholder {
  color: #6c757d;
  opacity: 0.7;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

/* ควบคุมขนาดปุ่ม CANCEL และ SUBMIT */
.text-right .btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  line-height: 1.2;
  border-radius: 20px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.text-right .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.text-right .btn.btn-outline-danger {
  border-color: #dc3545;
  color: #dc3545;
  background-color: transparent;
}

.text-right .btn.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}

.text-right .btn.btn-outline-success {
  border-color: #28a745;
  color: #28a745;
  background-color: transparent;
}

.text-right .btn.btn-outline-success:hover {
  background-color: #28a745;
  color: white;
}

.text-right .btn .c-icon {
  font-size: 0.75rem;
  margin-right: 0.2rem;
  vertical-align: middle;
}

.text-right .btn span {
  font-size: 0.75rem;
  font-weight: 600;
  vertical-align: middle;
}

.modal-btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  line-height: 1.2;
  border-radius: 20px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: 1px solid;
}

.modal-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-btn.btn-outline-secondary {
  border-color: #6c757d;
  color: #6c757d;
  background-color: transparent;
}

.modal-btn.btn-outline-secondary:hover {
  background-color: #6c757d;
  color: white;
}

.modal-btn.btn-outline-success {
  border-color: #28a745;
  color: #28a745;
  background-color: transparent;
}

.modal-btn.btn-outline-success:hover {
  background-color: #28a745;
  color: white;
}

.modal-btn.btn-outline-danger {
  border-color: #dc3545;
  color: #dc3545;
  background-color: transparent;
}

.modal-btn.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}
</style>

