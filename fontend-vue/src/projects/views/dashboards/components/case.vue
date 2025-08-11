<template>
  <div>
    <CCard class="bg-style2">
      <CCardHeader class="bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
        <span class="font-weight-bold h6"> 
          <CIcon class="mr-2" v-if="icon" :name="icon"/> {{ caption }} 
        </span>
      </CCardHeader>
      <CCardBody class="pt-0 pb-0">
        <div v-if="loading" class="text-center py-4">
          <CSpinner size="sm" />
          <p class="mt-2">กำลังโหลดข้อมูล...</p>
        </div>
        <div v-else-if="error" class="text-center py-4 text-danger">
          <CIcon name="cil-warning" size="lg" />
          <p class="mt-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
        </div>
        <CRow v-else>
          <CCol>
            <CCallout color="info">
              <small class="text-muted">เคสทั้งหมด</small><br>
              <strong class="h4">{{ totalCount }}</strong>
            </CCallout>
          </CCol>
          <CCol>
            <CCallout color="warning">
              <small class="text-muted">กำลังดำเนินการ</small><br>
              <strong class="h4">{{ inProgressCount }}</strong>
            </CCallout>
          </CCol>
          <CCol>
            <CCallout color="danger">
              <small class="text-muted">เกิน SLA</small><br>
              <strong class="h4">{{ overSLACount }}</strong>
            </CCallout>
          </CCol>
          <CCol>
            <CCallout color="success">
              <small class="text-muted">ปิดเคสแล้ว</small><br>
              <strong class="h4">{{ closedCount }}</strong>
            </CCallout>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
import moment from 'moment'

export default {
  name: 'ECase',
  components: {},
  props: {
    icon: {
      type: String,
      default: 'cil-bell'
    },
    caption: {
      type: String,
      default: 'ศูนย์แจ้งเหตุฉุกเฉิน'
    },
  },

  data() {
    return {
      timer: null,
      currentTime: moment(),
      totalCount: 0,
      inProgressCount: 0,
      overSLACount: 0,
      closedCount: 0
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
      // อัพเดทเวลาทุก 1 นาที
      this.timer = setInterval(() => {
        this.currentTime = moment();
        this.updateStatistics(); 
      }, 60000);
      this.updateStatistics();
      
    },

    cleanup() {
      if (this.timer) {
        clearInterval(this.timer);
      }
    },

    updateStatistics() {
      
      if (!this.reports || this.reports.length === 0) {
        this.totalCount = 0;
        this.inProgressCount = 0;
        this.overSLACount = 0;
        this.closedCount = 0;
        return;
      }

      this.totalCount = this.reports.length;
      this.inProgressCount = this.reports.filter(i => i.status === 'กำลังดำเนินการ').length;
      
      // คำนวณ overSLACount
      const currentTime = new Date();
      this.overSLACount = this.reports.filter(i => {
        if (!i.date || i.status === 'ควบคุมได้แล้ว') {
          return false;
        }
        
        const startTime = new Date(i.date);
        const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
        
        let slaLimit = 15;
        if (i.level === 'ระดับกลาง') {
          slaLimit = 20;
        } else if (i.level === 'ระดับสูง') {
          slaLimit = 25;
        }
        
        return elapsedMinutes > slaLimit;
      }).length;

      this.closedCount = this.reports.filter(i => 
        i.status === 'ควบคุมได้แล้ว' || i.status === 'เสร็จสิ้น'
      ).length;
    }
  },

  computed: {
    ...mapGetters({
      // lang: 'setting/lang',
      // ใช้ Dashboard store call reports
      reports: 'Dashboard/reports',
      loading: 'Dashboard/loading',
      error: 'Dashboard/error',
    }),
  },

  watch: {
    reports: {
      handler: function (value) {
        var lang = this.$store.getters['setting/lang'];
        this.updateStatistics(); 
        this.$emit('reports-changed', value);
      },
      immediate: true 
    },
    // lang: function (value) {
    //   var lang = this.$store.getters['setting/lang'];
    //   var data = {};
    //   this.$store.dispatch("ECase/reports", data);
    // }
  }
}
</script> 