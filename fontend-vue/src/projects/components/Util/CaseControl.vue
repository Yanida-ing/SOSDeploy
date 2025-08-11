<template>
  <div>
    <CRow class="mt-3">
      <CCol class="text-right">
        <CButton 
          v-if="!isCaseClosed()"
          :color="isCaseOpen() ? 'danger' : 'success'" 
          size="sm" 
          @click="isCaseOpen() ? showCloseDialog = true : showOpenDialog = true"
          class="mr-2"
        >
          <CIcon :name="isCaseOpen() ? 'cil-ban' : 'cil-save'" size="sm" class="mr-1"/>
          {{ isCaseOpen() ? 'ปิดเคส' : 'เปิดเคส' }}
        </CButton>
        
        <span v-if="isCaseClosed()" class="text-muted">
          <CIcon name="cil-lock" size="sm" class="mr-1"/>
          เคสปิดแล้ว
        </span>
      </CCol>
    </CRow>

    <!-- Open Case Dialog -->
    <div v-if="showOpenDialog" class="modal-overlay" @click="showOpenDialog = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem;">
          <h5 class="modal-title font-weight-bold h6">
             เปิดเคส
          </h5>
          <button type="button" class="close text-white" @click="showOpenDialog = false">
            <span>&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="openUserName" class="font-weight-bold">
              ชื่อผู้เปิดเคส *
            </label>
            <input 
              id="openUserName"
              type="text" 
              class="form-control" 
              v-model="openForm.userName" 
              placeholder="กรอกชื่อผู้เปิดเคส"
              required
            />
          </div>
          <div class="form-group">
            <label for="openReason" class="font-weight-bold">
              เหตุผล (ไม่บังคับ)
            </label>
            <textarea 
              id="openReason"
              class="form-control" 
              v-model="openForm.reason" 
              placeholder="เหตุผลในการเปิดเคส (ถ้ามี)"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <CButton size="sm" color="danger" variant="outline" @click="showOpenDialog = false" class="modal-btn">
            <CIcon name="cil-ban" size="sm" class="mr-1"/> ยกเลิก
          </CButton>
          <CButton size="sm" color="success" variant="outline" @click="confirmOpenCase" class="modal-btn">
            <CIcon name="cil-save" size="sm" class="mr-1"/> เปิดเคส
          </CButton>
        </div>
      </div>
    </div>

    <!-- Close Case Dialog -->
    <div v-if="showCloseDialog" class="modal-overlay" @click="showCloseDialog = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem;">
          <h5 class="modal-title font-weight-bold h6">
            <CIcon name="cil-stop" size="lg" class="mr-2"/> ปิดเคส
          </h5>
          <button type="button" class="close text-white" @click="showCloseDialog = false">
            <span>&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="closeUserName" class="font-weight-bold">
              ชื่อผู้ปิดเคส *
            </label>
            <input 
              id="closeUserName"
              type="text" 
              class="form-control" 
              v-model="closeForm.userName" 
              placeholder="กรอกชื่อผู้ปิดเคส"
              required
            />
          </div>
          <div class="form-group">
            <label for="closeReason" class="font-weight-bold">
              เหตุผล (ไม่บังคับ)
            </label>
            <textarea 
              id="closeReason"
              class="form-control" 
              v-model="closeForm.reason" 
              placeholder="เหตุผลในการปิดเคส (ถ้ามี)"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <CButton size="sm" color="danger" variant="outline" @click="showCloseDialog = false" class="modal-btn">
            <CIcon name="cil-ban" size="sm" class="mr-1"/> ยกเลิก
          </CButton>
          <CButton size="sm" color="success" variant="outline" @click="confirmCloseCase" class="modal-btn">
            <CIcon name="cil-CheckAlt" size="sm" class="mr-1"/> ปิดเคส
          </CButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
import Swal from 'sweetalert2'

export default {
  name: 'CaseControl',
  props: {
    caseData: {
      type: Object,
      default() {
        return {}
      }
    },
    caseId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isOpen: false,
      isClosed: false,
      showOpenDialog: false,
      showCloseDialog: false,
      openForm: { 
        userName: '', 
        reason: '' 
      },
      closeForm: { 
        userName: '', 
        reason: '' 
      }
    }
  },

  mounted() {
    
  },

  created() {
    this.onInit();
  },

  beforeDestroy() {
    
  },

  methods: {
    onInit() {
      this.loadCaseData();
    },

    loadCaseData() {
      if (this.caseData) {
        this.isOpen = this.caseData.isOpen || false;
        this.isClosed = this.caseData.closedBy || false;
      }
    },

    openCase() {
      this.showOpenDialog = true;
    },

    closeCase() {
      this.showCloseDialog = true;
    },

    isCaseOpen() {
      return this.isOpen;
    },

    isCaseClosed() {
      return this.isClosed;
    },

    async confirmOpenCase() {
      if (this.openForm.userName) {
        this.showOpenDialog = false;
        try {
          const response = await this.$store.dispatch('Dashboard2/openCase', {
            caseId: this.caseId,
            userName: this.openForm.userName,
            reason: this.openForm.reason
          });
          if (response.data.success) {
            this.openForm = { userName: '', reason: '' };
            // อัพเดทสถานะ local
            this.isOpen = true;
            this.isClosed = false;
            // emit ข้อมูลกลับไปหา parent
            this.$emit('case-opened', {
              caseId: this.caseId,
              success: true,
              data: response.data
            });
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'เปิดเคสสำเร็จ', confirmButtonColor: '#28a745' });
          }
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'ไม่สามารถเปิดเคสได้', confirmButtonColor: '#dc3545' });
        }
      } else {
        Swal.fire({ icon: 'warning', title: 'ข้อความแจ้งเตือน', text: 'กรุณากรอกชื่อผู้เปิดเคส', confirmButtonColor: '#28a745' });
      }
    },

    async confirmCloseCase() {
      if (this.closeForm.userName) {
        this.showCloseDialog = false;
        try {
          const response = await this.$store.dispatch('Dashboard2/closeCase', {
            caseId: this.caseId,
            userName: this.closeForm.userName,
            reason: this.closeForm.reason
          });
          if (response.data.success) {
            this.closeForm = { userName: '', reason: '' };
            // อัพเดทสถานะ local
            this.isOpen = false;
            this.isClosed = true;
            // emit ข้อมูลกลับไปหา parent
            this.$emit('case-closed', {
              caseId: this.caseId,
              success: true,
              data: response.data
            });
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'ปิดเคสสำเร็จ', confirmButtonColor: '#28a745' });
          }
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'ไม่สามารถปิดเคสได้', confirmButtonColor: '#dc3545' });
        }
      } else {
        Swal.fire({ icon: 'warning', title: 'ข้อความแจ้งเตือน', text: 'กรุณากรอกชื่อผู้ปิดเคส', confirmButtonColor: '#dc3545' });
      }
    }
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang'
    })
  },

  watch: {
    caseData: {
      handler(newVal) {
        this.loadCaseData();
      },
      deep: true
    },

    lang: function (value) {
      this.onInit();
    },

    isOpen: function (value) {
      this.$emit('case-status-changed', { isOpen: value });
    },

    isClosed: function (value) {
      this.$emit('case-status-changed', { isClosed: value });
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

.modal-btn.btn-outline-danger {
  border-color: #dc3545;
  color: #dc3545;
  background-color: transparent;
}

.modal-btn.btn-outline-danger:hover {
  background-color: #dc3545;
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
</style> 