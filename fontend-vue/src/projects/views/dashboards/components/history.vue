<template>
  <div>
    <CRow>
      <CCol>
        <CDataTable
            :header="false"
            :footer="false"
            :table-filter="{label:'Search'}"
            :hover="hover"
            :striped="striped"
            :bordered="bordered"
            :small="small"
            :fixed="fixed"
            :items="item"
            :fields="fields"
            :items-per-page="small ? 50 : 20"
            :dark="dark"
            pagination
            :loading="loading"
        >

          <template #description="{item}">
            <CCard class="bg-style2 mt-2 position-relative" @click="onClick(item)">
              <CCardHeader :class="getSLAHeaderClass(item)" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
                <span class="font-weight-bold h6"><CIcon name="cil-tags" size="lg"/> # {{ item.taxTd }}</span>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol>
                    <p class="font-weight-bold mb-0 h5">{{ item.title }}</p>
                    <p>{{ item.description }}</p>
                  </CCol>
                  <CCol>
                    <!-- แสดง Countup หรือ "ปิดเคส" ตามสถานะ -->
                    <!-- แสดง "ปิดเคส" เฉพาะเมื่อเคสปิดแล้ว (closedBy !== null) -->
                    <!-- แสดง Countup สำหรับเคสที่ยังไม่ปิด (รวมถึงกำลังดำเนินการและรอดำเนินการ) -->
                    <div v-if="isCaseClosed(item)" class="font-weight-bold text-right text-success">
                      <CIcon name="cil-check-circle" size="sm" class="mr-1"/>
                      ปิดเคส
                    </div>
                    <Countup v-else name="" :start="item.date" />
                  </CCol>
                </CRow>
                
                <CRow>
                  <CCol col="4">
                    <CIcon name="cil-contact" size="lg"/> {{ item.name }} ({{item.user || 'ไม่ระบุ'}})
                  </CCol>
                  <CCol col="4">
                    <CIcon name="cil-building" size="lg"/> {{ item.location }}
                  </CCol>
                  <CCol col="4">
                    <CIcon name="cil-phone" size="lg"/> {{ item.mobile }}
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </template>

          <template #taxTd="{item}"><span style="display:none">{{ item.title }}</span></template>
          <template #title="{item}"><span style="display:none">{{ item.title }}</span></template>
          <template #name="{item}"><span style="display:none">{{ item.name }}</span></template>
          <template #location="{item}"><span style="display:none">{{ item.location }}</span></template>
          <template #mobile="{item}"><span style="display:none">{{ item.mobile }}</span></template>
          <template #status="{item}"><span style="display:none">{{ item.status }}</span></template>
          <template #level="{item}"><span style="display:none">{{ item.level }}</span></template>
          <template #user="{item}"><span style="display:none">{{ item.user }}</span></template>

        </CDataTable>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from "moment";
import Countup from "@/projects/components/custom/Countup.vue";

export default {
  name: 'History',
  components: {Countup},
  props: {
    icon: {
      type: String,
      default: 'cil-settings',
    },
    caption: {
      type: String,
      default: 'ประวัติรายงาน'
    },
    hover: Boolean,
    striped: Boolean,
    bordered: Boolean,
    small: Boolean,
    fixed: Boolean,
    dark: Boolean,
    loading: {
      type: Boolean,
      default: false
    },
    item: {
      type: Array,
      default() {
        return []
      }
    }
  },

  data() {
    return {
      fields: [
        { key: 'description', label: 'รายละเอียด' },
        { key: 'taxTd', label: 'รหัส' },
        { key: 'title', label: 'หัวข้อ' },
        { key: 'name', label: 'ชื่อ' },
        { key: 'location', label: 'สถานที่' },
        { key: 'mobile', label: 'เบอร์โทร' },
        { key: 'status', label: 'สถานะ' },
        { key: 'level', label: 'ระดับ' },
        { key: 'user', label: 'ผู้ใช้' }
      ]
    }
  },

  created() {
    this.onInit();
  },

  beforeDestroy() {
    this.cleanup();
  },

  methods: {
    onInit() {
      this.$store.dispatch("History/startSlaTimer");
    },

    cleanup() {
      this.$store.dispatch("History/stopSlaTimer");
    },

    onClick(item) {
      this.$router.push({ path: '/case', query: { id: item._id } });
      this.$emit('item-click', item);
    },

    getSLAHeaderClass(item) {
      if (this.isCaseClosed(item)) {
        return 'bg-gradient-success text-white';
      }
      
      // ใช้ computed currentTime เพื่อให้สีเปลี่ยนตามเวลาอัตโนมัติ
      const startTime = moment(item.date);
      const elapsedMinutes = this.currentTime.diff(startTime, 'minutes');
      
      let slaLimit = 15;
      if (item.level === 'ระดับกลาง') {
        slaLimit = 20;
      } else if (item.level === 'ระดับสูง') {
        slaLimit = 25;
      }
      
      if (elapsedMinutes > slaLimit) {
        return 'bg-gradient-danger text-white';
      } else if (elapsedMinutes > slaLimit * 0.8) {
        return 'bg-gradient-warning text-white';
      } else {
        return 'bg-gradient-dark text-white';
      }
    },

    isCaseClosed(item) {
      return item.caseManagement && item.caseManagement.closedBy !== null;
    }
  },

  computed: {
    ...mapGetters({
      // lang: 'setting/lang',
      history: 'History/history',
      slaTimer: 'History/slaTimer',
      timerValue: 'History/timerValue',
    }),
    
    // เพิ่ม computed property ที่จะทำให้สีเปลี่ยนตามเวลาอัตโนมัติ
    currentTime() {
      // ใช้ timerValue เพื่อ trigger reactivity
      this.timerValue;
      return moment();
    }
  },

  watch: {
    item: {
      handler(newVal) {
        this.$emit('history-changed', newVal);
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
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.modal-title {
  margin: 0;
  font-weight: bold;
}

.close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}
</style>
