<template>
  <div>
    <CCard class="bg-style2">
      <CCardHeader class="bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
        <span class="font-weight-bold h6"> 
          <CIcon class="mr-2" v-if="icon" :name="icon"/> {{ caption }} 
        </span>
      </CCardHeader>
      <CCardBody class="pb-0">
        <CRow>
          <CCol>
            <CRow class="mb-3">
              <CCol>
                <label>สถานะ</label>
                <Multiselect class="os"
                             v-model="select.status"
                             :options="options.status"
                             label="label"
                             track-by="label"
                             :multiple="false"
                             :search="true">
                </Multiselect>
              </CCol>
            </CRow>
          </CCol>
          <CCol>
            <CRow class="mb-3">
              <CCol>
                <label>ประเภท</label>
                <Multiselect class="os"
                             v-model="select.type"
                             :options="options.type"
                             label="label"
                             track-by="label"
                             :multiple="false"
                             :search="true">
                </Multiselect>
              </CCol>
            </CRow>
          </CCol>
          <CCol>
            <CRow class="mb-3">
              <CCol>
                <label>ความเร่งด่วน</label>
                <Multiselect class="os"
                             v-model="select.levels"
                             :options="options.levels"
                             label="label"
                             track-by="label"
                             :multiple="false"
                             :search="true">
                </Multiselect>
              </CCol>
            </CRow>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

export default {
  name: 'FilterOptions',
  components: {Multiselect},
  props: {
    icon: {
      type: String,
      default: 'cil-magnifying-glass'
    },
    caption: {
      type: String,
      default: 'ตัวกรอง'
    },
  },
  data() {
    return {
      options: {
        status: [],
        type: [],
        levels: [],
      },
      //ค่าที่เปลี่ยนแปลงของ present
      select: {
        status: {label: '-', value: 0},
        type: {label: '-', value: 0},
        levels: {label: '-', value: 0}
      },
      //ส่งออกข้อมูล
      objs: {
        status: "",
        type: "",
        levels: ""
      }
    }
  },

  created() {
    this.onInit();
  },

  methods: {
    onInit() {
      var data = {};
      this.$store.dispatch("FilterOptions/status", data);
      this.$store.dispatch("FilterOptions/type", data);
      this.$store.dispatch("FilterOptions/levels", data);
    },

    // ตั้งค่า default status เป็น "รอดำเนินการ"
    setDefaultStatus() {
      if (this.options.status && this.options.status.length > 0) {
        const pendingStatus = this.options.status.find(option => 
          option.label === 'รอดำเนินการ' || 
          option.label === 'Pending'
        );
        
        if (pendingStatus) {
          this.select.status = pendingStatus;
          this.objs.status = pendingStatus.value;
          this.$emit('select', this.objs);
        }
      }
    }
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang',
      status: 'FilterOptions/status',
      type: 'FilterOptions/type',
      levels: 'FilterOptions/levels',
    }),
  },

  watch: {
    lang: function (value) {
      var lang = this.$store.getters['setting/lang'];
      this.options.status = [...this.status.map(objs => ({ 
        label: objs.title.filter(title => { if (title.key === lang) { return title } })[0].value, 
        value: objs._id 
      }))];
      this.options.type = [...this.type.map(objs => ({ 
        label: objs.title.filter(title => { if (title.key === lang) { return title } })[0].value, 
        value: objs._id 
      }))];
      this.options.levels = [...this.levels.map(objs => ({ 
        label: objs.title.filter(title => { if (title.key === lang) { return title } })[0].value, 
        value: objs._id 
      }))];
      
      // ตั้งค่า default หลังจาก options อัพเดท
      this.$nextTick(() => {
        this.setDefaultStatus();
      });
    },

    status: function (value) {
      this.options.status = [];
      var lang = this.$store.getters['setting/lang'];
      var objs = {};
      objs.label = "-"
      objs.value = 0;
      this.options.status = [objs, ...value.map(objs => ({ 
        label: objs.title.filter(title => { if (title.key === lang) { return title } })[0].value, 
        value: objs._id 
      }))];
      
      // ตั้งค่า default หลังจาก options อัพเดท
      this.$nextTick(() => {
        this.setDefaultStatus();
      });
    },

    type: function (value) {
      this.options.type = [];
      var lang = this.$store.getters['setting/lang'];
      var objs = {};
      objs.label = "-"
      objs.value = 0;
      this.options.type = [objs, ...value.map(objs => ({ 
        label: objs.title.filter(title => { if (title.key === lang) { return title } })[0].value, 
        value: objs._id 
      }))];
    },

    levels: function (value) {
      this.options.levels = [];
      var lang = this.$store.getters['setting/lang'];
      var objs = {};
      objs.label = "-"
      objs.value = 0;
      this.options.levels = [objs, ...value.map(objs => ({ 
        label: objs.title.filter(title => { if (title.key === lang) { return title } })[0].value, 
        value: objs._id 
      }))];
    },

    "select.status": function (value) {
      this.objs.status = value.value;
      this.$emit('select', this.objs);
    },

    "select.type": function (value) {
      this.objs.type = value.value;
      this.$emit('select', this.objs);
    },

    "select.levels": function (value) {
      this.objs.levels = value.value;
      this.$emit('select', this.objs);
    }
  }
}
</script> 