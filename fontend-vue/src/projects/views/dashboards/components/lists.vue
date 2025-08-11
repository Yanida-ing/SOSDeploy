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
                <label>วิทยาเขต</label>
                <Multiselect class="os"
                             v-model="select.campus"
                             :options="options.campus"
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
                <label>คณะ</label>
                <Multiselect class="os"
                             v-model="select.facultys"
                             :options="options.facultys"
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
  name: 'ListsNotifile',
  components: {Multiselect},
  props: {
    icon: {
      type: String,
      default: 'cil-list-rich'
    },
    caption: {
      type: String,
      default: 'รายการ'
    },
  },

  data() {
    return {
      options: {
        campus: [],
        facultys: [],
      },
      //ค่าที่เปลี่ยนแปลงของ present
      select: {
        campus: {label: '-', value: 0},
        facultys: {label: '-', value: 0}
      },
      //ส่งออกข้อมูล
      objs: {
        campus: "",
        facultys: ""
      }
    }
  },

  created() {
    this.onInit();
  },

  methods: {
    onInit() {
      var data = {};
      this.$store.dispatch("Lists/campus", data);
      this.$store.dispatch("Lists/facultys", data);
    },
    
    mapOptions(data, lang) {
      if (!data || !Array.isArray(data)) return [];
      
      const defaultOption = { label: '-', value: 0 };
      const mappedData = data.map(item => ({
        label: item.title?.find(t => t.key === lang)?.value || 'ไม่ระบุ',
        value: item._id
      }));
      
      return [defaultOption, ...mappedData];
    }
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang',
      campus: 'Lists/campus',
      facultys: 'Lists/facultys',
    }),
  },

  watch: {
    lang: function (value) {
      var lang = this.$store.getters['setting/lang'];
      this.options.campus = this.mapOptions(this.campus, lang);
      this.options.facultys = this.mapOptions(this.facultys, lang);
    },

    campus: function (value) {
      var lang = this.$store.getters['setting/lang'];
      this.options.campus = this.mapOptions(value, lang);
    },

    facultys: function (value) {
      var lang = this.$store.getters['setting/lang'];
      this.options.facultys = this.mapOptions(value, lang);
    },

    "select.campus": function (value) {
      this.objs.campus = value.value;
      this.$emit('select', this.objs);
    },

    "select.facultys": function (value) {
      this.objs.facultys = value.value;
      this.$emit('select', this.objs);
    }
  }
}
</script>
