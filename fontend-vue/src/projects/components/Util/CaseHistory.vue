<template>
  <div>
    <CCard class="bg-style2">
      <CCardHeader class="bg-gradient-dark text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
        <span class="font-weight-bold h6"><CIcon :name="icon" size="lg"/> {{ caption }} </span>
        <div class="card-header-actions">
        </div>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol>
            <CDataTable
                :hover="hover"
                :striped="striped"
                :bordered="bordered"
                :small="small"
                :fixed="fixed"
                :fields="fields"
                :items="caseHistoryItems"
                :items-per-page="small ? 50 : 20"
                :dark="dark"
                pagination
            >
              <template #index="{item,index}">
                <td class="mt-3">
                  <label>{{index+1}} </label>
                </td>
              </template>

              <template #action="{item,index}">
                <td class="mt-3">
                  <label>
                    
                    {{ item.action === 'opened' ? 'เปิดเคส' : 'ปิดเคส' }}
                  </label>
                </td>
              </template>

              <template #by="{item,index}">
                <td class="mt-3">
                  <label>{{ item.by || 'ไม่ระบุ' }} </label>
                </td>
              </template>

              <template #at="{item,index}">
                <td class="mt-3">
                  <label>{{ formatDate(item.at) }} </label>
                </td>
              </template>

              <template #reason="{item,index}">
                <td class="mt-3">
                  <label>{{ item.reason || '-' }} </label>
                </td>
              </template>
            </CDataTable>
          </CCol>
        </CRow>

        <!-- ปุ่มเปิดปิดเคส -->
        <CaseControl 
          :case-data="caseData"
          :case-id="caseId"
          @case-opened="$emit('case-opened', $event)"
          @case-closed="$emit('case-closed', $event)"
        />

      </CCardBody>
    </CCard>
  </div>
</template>
<script>
import {mapGetters} from 'vuex'
import CaseControl from './CaseControl.vue'
import moment from 'moment'

export default {
  name: 'CaseHistory',
  components: { CaseControl },
  props: {
    icon: {
      type: String,
      default: 'cil-history'
    },
    caption: {
      type: String,
      default: 'ประวัติการเปิดปิดเคส'
    },
    caseData: {
      type: Object,
      default() {
        return {}
      }
    },
    caseId: {
      type: String,
      default: ''
    },
    fields:{
      type: Array,
      default() {
        return [
          {key: "index", label: "#", _style: 'width:50px; text-align: center'},
          {key: "action", label: "รายการ"},
          {key: "by", label: "ผู้ดำเนินการ"},
          {key: "at", label: "วันที่/เวลา"},
          {key: "reason", label: "เหตุผล"},
        ]
      }
    },
    hover: Boolean,
    striped: Boolean,
    bordered: Boolean,
    small: Boolean,
    fixed: Boolean,
    dark: Boolean,
  },
  data() {
    return {
      caseHistory: []
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
        this.caseHistory = this.caseData.caseHistory || [];
      }
    },

    formatDate(date) {
      if (!date) return '-';
      try {
        return moment(date).locale('th').format('DD/MM/YYYY HH:mm:ss');
      } catch (e) {
        return date;
      }
    }
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang'
    }),

    caseHistoryItems() {
      if (!this.caseHistory) {
        return [];
      }
      return this.caseHistory.map((history, index) => ({
        ...history,
        id: index + 1
      }));
    }
  },

  watch: {
    caseData: {
      handler(newVal) {
        this.loadCaseData();
        // รีเฟรช Dashboard เมื่อ caseData มีการเปลี่ยนแปลง
        this.$emit('case-updated');
      },
      deep: true
    },

    lang: function (value) {
      this.onInit();
    },

    caseHistory: function (value) {
      this.$emit('history-updated', value);
    }
  }
}
</script>