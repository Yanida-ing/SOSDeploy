<template>
  <div>
    <CCard class="bg-style2">
      <CCardHeader class="bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
        <span class="font-weight-bold h6"> <CIcon class="mr-2" v-if="icon" :name="icon"/> {{ caption }} </span>
      </CCardHeader>
      <CCardBody  class=" pb-0">
        <CRow>
          <CCol>
            <CRow class="mb-3">
              <CCol>
                <label >สถานะ</label>
                <Multiselect class="os"
                             v-model="select.status"
                             :options="statusOptions"
                             label="label"
                             track-by="label"
                             :multiple="false"
                             :search="true"
                             @input="onFilterChange"
                >
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
                             :options="typeOptions"
                             label="label"
                             track-by="label"
                             :multiple="false"
                             :search="true"
                             @input="onFilterChange"
                >
                </Multiselect>
              </CCol>

            </CRow>
          </CCol>
          <CCol>
            <CRow class="mb-3">
              <CCol >
                <label >ความเร่งด่วน</label>
                <Multiselect class="os"
                             v-model="select.levels"
                             :options="levelOptions"
                             label="label"
                             track-by="label"
                             :multiple="false"
                             :search="true"
                             @input="onFilterChange"
                >
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
    typeOptions: { type: Array, default: () => [] },
    levelOptions: { type: Array, default: () => [] },
    statusOptions: { type: Array, default: () => [] },
  },
  data() {
    return {

      options: {
        status: [],
        type: [],
        levels: [],
      },


      select: {
        status: "",
        type:"",
        levels:""
      },
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
      var data = {};
      this.$store.dispatch("setting/status",data);


      // var data = {};
      this.$store.dispatch("setting/levels",data);
    },
    onFilterChange() {
      this.$emit('filter', {
        status: this.select.status ? this.select.status.value : null,
        type: this.select.type ? this.select.type.value : null,
        level: this.select.levels ? this.select.levels.value : null
      })
    }
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang',
      status: 'setting/status',
      levels: 'setting/levels',
    })
  },

  watch: {
    lang: function (value) {

    },

    status: function (value) {
      var lang = this.$store.getters['setting/lang'];
      this.options.status = [
        {
          label: '-',
          value: null
        },
        ...value.map(objs => ({
          ...objs,
          label: objs.title.filter(title => title.key === lang)[0]?.value || '',
          value: objs._id
        }))
      ];
    },

    levels: function (value) {
      var lang = this.$store.getters['setting/lang'];
      this.options.levels = [
        {
          label: '-',
          value: null
        },
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
