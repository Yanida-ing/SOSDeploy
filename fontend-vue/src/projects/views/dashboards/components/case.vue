<template>
  <div>
    <CCard class="bg-style2">
      <CCardHeader class="bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
        <span class="font-weight-bold h6"> <CIcon class="mr-2" v-if="icon" :name="icon"/> {{ caption }} </span>
      </CCardHeader>
      <CCardBody  class="pt-0 pb-0">
        <CRow>
          <CCol >
            <CCallout color="info">
              <small class="text-muted">เคสทั้งหมด</small><br>
              <strong class="h4">{{ item ? item.length : 0 }}</strong>
            </CCallout>
          </CCol>
          <CCol >
            <CCallout color="warning">
              <small class="text-muted ">กำลังดำเนินการ</small><br>
              <strong class="h4">{{ inProgressCount }}</strong>
            </CCallout>
          </CCol>

          <CCol >
            <CCallout color="danger">
              <small class="text-muted">เกิน SLA</small><br>
              <strong class="h4">{{ overSLACount }}</strong>
            </CCallout>
          </CCol>
          <CCol >
            <CCallout color="success">
              <small class="text-muted ">ปิดเคสแล้ว</small><br>
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

export default {
  name: 'ECase',
  components: { },
  props: {
    item: {
      type: Array,
      default: () => []
    },
    icon: {
      type: String,
      default: 'cil-bell'
    },
    caption: {
      type: String,
      default: 'ศูนย์แจ้งเหตุฉุกเฉิน'
    },
    application: {
      type: String,
      default: '0'
    },
    hover: Boolean,
    striped: Boolean,
    bordered: Boolean,
    small: Boolean,
    fixed: Boolean,
    dark: Boolean,
    loading:{
      type: Boolean,
      default() {
        return false
      }
    },

  },
  computed: {
    ...mapGetters({
    }),
    inProgressCount() {
      // นับเคสที่ status เป็น "กำลังดำเนินการ"
      return this.item.filter(i => i.status === 'กำลังดำเนินการ').length
    },
    overSLACount() {
      // ตัวอย่าง: นับเคสที่ status เป็น "เกิน SLA" (ถ้ามี field นี้)
      return this.item.filter(i => i.status === 'เกิน SLA').length
    },
    closedCount() {
      // ตัวอย่าง: นับเคสที่ status เป็น "ปิดเคสแล้ว" (ถ้ามี field นี้)
      return this.item.filter(i => i.status === 'ปิดเคสแล้ว').length
    }
  }
}
</script>
