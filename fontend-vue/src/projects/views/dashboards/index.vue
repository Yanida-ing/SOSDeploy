<template>
  <div>
<!--    <Dashobard2/>-->
    <ECase class="mb-4" :item="filteredItems" />
     <FilterOptions class="mb-4"
        :type-options="filterTypeOptions"
        :level-options="filterLevelOptions"
        :status-options="filterStatusOptions"
        @filter="onFilter"
      />
    <History class="mb-4" :item="filteredItems" @info="onReadInfo" />

    <MIcon name="mfu-address"/>
<!--    <MultiLanguage caption="Title" :items="title"/>-->
    <div class="position-fixed" style="bottom: 60px; right: 30px">
      <CButton class="mr-1" v-c-tooltip.hover.click="'Create'" size="sm" color="info" shape="pill" variant="outline" @click="onCreate" >
        <CIcon name="cil-plus"/>
      </CButton>
    </div>

    <CDisasters />
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
import Dashboard from "@/views/Dashboard.vue";
import ECase from "@/projects/views/dashboards/components/case.vue";
import FilterOptions from "@/projects/views/dashboards/components/options.vue";
import ListsNotifile from "@/projects/views/dashboards/components/lists.vue";
import History from "@/projects/views/dashboards/components/history.vue";
import MultiLanguage from "@/projects/components/Util/MultiLanguage.vue";
import Dashboard2 from "@/projects/views/dashboards/components/Dashboard2.vue";
import CDisasters from "@/projects/components/dialog/CDisasters.vue";
import axios from 'axios'
import MIcon from "@/projects/components/Util/MIcon.vue";


export default {
  name: 'Dashborads',
  components: {MIcon, CDisasters, Dashboard2, MultiLanguage, History, ListsNotifile, FilterOptions, ECase, Dashboard},
  props: {
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
  data() {
    return {
      title: [{key: "th", value: ""}, {key: "en", value: ""}],
      his: "",
      horizontal: { label:'col-3', input:'col-9' },
      options:{
        type:['Option 1', 'Option 2', 'Option 3'],
      },
      reportItems: [], // รายงานที่ดึงมา
      fields: [
        {key:"type", label: "ประเภท" ,},
        {key:"limit", label: "ขั้นต่ำ" ,},
        {key:"max", label: "สูงสุด" ,},
        {key:"maxByOrder", label: "สูงสุดต่อเลข" ,}
      ],
      item:[{
        type:"3 ตัวบน",
        limit:1,
        max:10000,
        maxByOrder:10000
      },{
        type:"3 ตัวล่าง",
        limit:1,
        max:10000,
        maxByOrder:10000
      },{
        type:"3 ตัวโต๊ด",
        limit:1,
        max:10000,
        maxByOrder:10000
      },{
        type:"2 ตัวบน",
        limit:1,
        max:10000,
        maxByOrder:10000
      },{
        type:"2 ตัวล่าง",
        limit:1,
        max:10000,
        maxByOrder:10000
      },{
        type:"2 ตัวโต๊ด",
        limit:1,
        max:10000,
        maxByOrder:10000
      },{
        type:"วิ่งบน",
        limit:1,
        max:10000,
        maxByOrder:10000
      },{
        type:"วิ่งล่าง",
        limit:1,
        max:10000,
        maxByOrder:10000
      }],
      filterStatusOptions: [],
      filterTypeOptions: [],
      filterLevelOptions: [],
      filter: { status: null, type: null, level: null }
    }
  },

  async mounted() {
    await this.onInit();
  },

  created() {
    // this.onInit(); // ย้ายไป mounted เพื่อรองรับ async
  },

  beforeDestroy() {

  },

  methods: {
    onInit() {
      this.$store.dispatch("report/dashboard", {})
      Promise.all([
        axios.get('https://sos.mfu.ac.th/api/v1/report/'),
        axios.get('https://sos.mfu.ac.th/api/v1/report/type'),
        axios.get('https://sos.mfu.ac.th/api/v1/report/level'),
        axios.get('https://sos.mfu.ac.th/api/v1/report/status')
      ])
      .then(([reportRes, typeRes, levelRes, statusRes]) => {
        if(reportRes.data && reportRes.data.data) {
          this.reportItems = reportRes.data.data.map((r, idx) => ({
            _id: r._id, 
            taxTd: r._id && r._id.slice ? r._id.slice(-6) : `RPT-${idx+1}`,
            title: r.type && r.type.title ? (r.type.title.find(function(t){ return t.key === 'th'; }) || {}).value : 'ไม่ระบุ',
            description: r.description || 'ไม่ระบุ',
            date: r.timeStamps || r.createdAt || 'ไม่ระบุ',
            name: r.contact && r.contact.name ? r.contact.name : 'ไม่ระบุ',
            mobile: r.contact && r.contact.phone ? r.contact.phone : 'ไม่ระบุ',
            location: r.location && r.location.address ? r.location.address : 'ไม่ระบุ',
            user: r.user && r.user.title ? (r.user.title.find(function(t){ return t.key === 'th'; }) || {}).value : 'ไม่ระบุ',
            status: r.status && r.status.title ? (r.status.title.find(function(t){ return t.key === 'th'; }) || {}).value : 'ไม่ระบุ',
            level: r.level && r.level.title ? (r.level.title.find(function(t){ return t.key === 'th'; }) || {}).value : 'ไม่ระบุ'
          }))
        }
        this.filterTypeOptions = (typeRes.data?.data || [])
          .map(t => {
            const label = t.title.find(tt => tt.key === 'th')?.value
            return label ? { label, value: label } : null
          })
          .filter(Boolean)
        this.filterLevelOptions = (levelRes.data?.data || [])
          .map(l => {
            const label = l.title.find(ll => ll.key === 'th')?.value
            return label ? { label, value: label } : null
          })
          .filter(Boolean)
        this.filterStatusOptions = (statusRes.data?.data || [])
          .map(s => {
            const label = s.title.find(ss => ss.key === 'th')?.value
            return label ? { label, value: label } : null
          })
          .filter(Boolean)
      })
      .catch((e) => {
        this.reportItems = []
        this.filterTypeOptions = []
        this.filterLevelOptions = []
        this.filterStatusOptions = []
      });
    },

    onCreate() {
      this.$store.commit("dialog/isDisaters", true)
    },
    onFilter(filter) {
      this.filter = filter
    }
  },

  computed: {
    filteredItems() {
      return this.reportItems.filter(item => {
        const matchStatus = !this.filter.status || item.status === this.filter.status
        const matchType = !this.filter.type || item.title === this.filter.type
        const matchLevel = !this.filter.level || item.level === this.filter.level
        return matchStatus && matchType && matchLevel
      })
    }
  },

  ...mapGetters({
      reprots :"report/item"
    }),

  watch: {
    lang: function (value) {

    },

    reprots : function(value) {
      console.log(value);
    } 
  }
}
</script>
