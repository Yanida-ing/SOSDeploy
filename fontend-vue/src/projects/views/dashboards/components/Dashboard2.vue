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
                <template v-if="caseDetail">
                  <p class="font-weight-bold mb-0 h5">{{ getTypeTitle(caseDetail) }}</p>
                  <p>{{ caseDetail.description }}</p>
                </template>
                <template v-else>
                  <p>กำลังโหลดข้อมูล...</p>
                </template>
              </CCol>
              <CCol>
                <template v-if="caseDetail">
                  <p class="font-weight-bold text-right mb-0">{{  formatDate(caseDetail.timeStamps) }}</p>
                </template>
              </CCol>
            </CRow>

            <CRow v-if="caseDetail">
              <CCol col="4">
                <CIcon name="cil-contact" size="lg"/> {{ caseDetail.contact && caseDetail.contact.name ? caseDetail.contact.name : 'ไม่ระบุ' }}
              </CCol>
              <CCol col="4">
                <CIcon name="cil-building" size="lg"/> {{ caseDetail.location && caseDetail.location.address ? caseDetail.location.address : 'ไม่ระบุ' }}
              </CCol>
              <CCol col="4">
                <CIcon name="cil-phone" size="lg"/> {{ caseDetail.contact && caseDetail.contact.phone ? caseDetail.contact.phone : 'ไม่ระบุ' }}
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
            <FoodAssest :item="item" caption="อาหาร"/>
          </CCol>

          <CCol col="12" class="mb-2">
            <FoodAssest :item="item" caption="ที่พัก" icon="cil-bed"/>
          </CCol>


          <CCol col="12" class="mb-2">
            <CarAssest :item="itemCar" caption="รถรับส่ง" icon="cil-bus-alt"/>
          </CCol>


        </CRow>

      </CCol>
      <CCol>
        <GoogleMaps
          v-if="caseDetail && caseDetail.location && Array.isArray(caseDetail.location.coordinates) && caseDetail.location.coordinates.length === 2"
          :lat="(caseDetail.location.coordinates[0] === 0 && caseDetail.location.coordinates[1] === 0) ? 20.045 : caseDetail.location.coordinates[1]"
          :lng="(caseDetail.location.coordinates[0] === 0 && caseDetail.location.coordinates[1] === 0) ? 99.893572 : caseDetail.location.coordinates[0]"
        />
        <GoogleMaps v-else />
      </CCol>
    </CRow>


    <CRow class="text-right mt-3 mb-3">
      <CCol>
        <CButton class="mr-2" size="sm" color="danger" shape="pill" variant="outline"  @click="goBack">
          <span class="font-weight-bold pr-1 pl-1"><CIcon name="cil-ban" size="lg"/> CANCEL </span>
        </CButton>
        <CButton size="sm" color="success" shape="pill" variant="outline">
          <span class="font-weight-bold pr-1 pl-1"><CIcon name="cil-save" size="lg"/> SUBMIT </span>
        </CButton>
      </CCol>
    </CRow>

  </div>
</template>
<script>
import {mapGetters} from 'vuex'
import FoodAssest from "@/projects/components/Util/FoodAssest.vue";
import CarAssest from "@/projects/components/Util/CarAssest.vue";
import GoogleMaps from "@/projects/views/dashboards/components/GoogleMaps.vue";
import axios from 'axios';

export default {
  name: 'Dashboard2',
  components: {GoogleMaps, CarAssest, FoodAssest},
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
      date: "",
      caseId: null, 
      caseDetail: null, 
      item: [{
        name: "น้ำดื่ม",
        total: 1000,
        request: 0
      }],
      itemCar: [{
        name: "รถพญาบาล",
        total: 1000,
        request: 0
      }],
    }
  },

  async mounted() {
    this.caseId = this.$route.query.id;
    if (this.caseId) {
      await this.fetchCaseDetail(this.caseId);
    }
  },

  created() {
    this.onInit();
  },

  beforeDestroy() {

  },

  methods: {
    async fetchCaseDetail(id) {
      try {
        const res = await axios.get(`https://sos.mfu.ac.th/api/v1/report/${id}`);
        if (res.data && res.data.data) {
          this.caseDetail = res.data.data;
        }
      } catch (e) {
        this.caseDetail = null;
      }
    },
    getTypeTitle(detail) {
      if (!detail || !detail.type || !detail.type.title) return '-';
      var th = detail.type.title.filter(function(t){ return t.key === 'th'; });
      return th.length > 0 ? th[0].value : '-';
    },
    getLevelTitle(detail) {
      if (!detail || !detail.level || !detail.level.title) return '-';
      var th = detail.level.title.filter(function(l){ return l.key === 'th'; });
      return th.length > 0 ? th[0].value : '-';
    },
    getStatusTitle(detail) {
      if (!detail || !detail.status || !detail.status.title) return '-';
      var th = detail.status.title.filter(function(s){ return s.key === 'th'; });
      return th.length > 0 ? th[0].value : '-';
    },
    formatDate(date) {
      if (!date) return '-';
      try {
        return new Date(date).toLocaleString();
      } catch (e) {
        return date;
      }
    },
    onInit() {

    },
    goBack() {
      this.$router.back();
    }
  },

  computed: {
    ...mapGetters({
      lang:'setting/lang'
    })
  },

  watch: {



  }
}

</script>

