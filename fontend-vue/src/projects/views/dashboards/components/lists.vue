<template>
  <div>
    <CCard class="bg-style2">
      <CCardHeader class="bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
        <span class="font-weight-bold h6"> <CIcon class="mr-2" v-if="icon" :name="icon"/> {{ caption }} </span>
      </CCardHeader>
      <CCardBody  class="">
      </CCardBody>
    </CCard>
  </div>
</template>
<script>
import {mapGetters} from 'vuex'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import History from "@/projects/views/dashboards/components/history.vue";

export default {
  name: 'ListsNotifile',
  components: {History, Multiselect},
  props: {
    icon: {
      type: String,
      default: 'cil-list-rich'
    },
    caption: {
      type: String,
      default: 'รายการ'
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
  data() {
    return {

      options: {
        campus: [],
        facultys: [],
      },


      select: {
        campus:"",
        facultys:""
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

    },
  },

  computed: {
    ...mapGetters({
    })
  },

  watch: {
    lang: function (value) {

    },


  }
}

</script>
