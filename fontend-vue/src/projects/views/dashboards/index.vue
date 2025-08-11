<template>
  <div>
    <ECase class="mb-4" />
    <FilterOptions class="mb-4" @select="onFilterSelect" />
    <History class="mb-4" :item="filteredItems" @info="onReadInfo" @case-updated="onCaseUpdated" />

    <MIcon name="mfu-address"/>
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
import ECase from "@/projects/views/dashboards/components/case.vue";
import FilterOptions from "@/projects/views/dashboards/components/options.vue";
import ListsNotifile from "@/projects/views/dashboards/components/lists.vue";
import History from "@/projects/views/dashboards/components/history.vue";
import MultiLanguage from "@/projects/components/Util/MultiLanguage.vue";
import Dashboard2 from "@/projects/views/dashboards/components/Dashboard2.vue";
import CDisasters from "@/projects/components/dialog/CDisasters.vue";
import MIcon from "@/projects/components/Util/MIcon.vue";

export default {
  name: 'Dashborads',
  components: {
    MIcon, 
    CDisasters, 
    Dashboard2, 
    MultiLanguage, 
    History, 
    ListsNotifile, 
    FilterOptions, 
    ECase
  },
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
      // Local data if needed
    }
  },

  created() {
    this.onInit();
  },

  methods: {
    onInit() {
      this.$emit('initializing');
      var data = {};
      this.$store.dispatch("Dashboard/reports", data);
      this.$store.dispatch("Dashboard/status", data);
      this.$store.dispatch("Dashboard/type", data);
      this.$store.dispatch("Dashboard/levels", data);
      this.$emit('data-loaded');
    },

    onCreate() {
      this.$store.commit("dialog/isDisaters", true);
      this.$emit('create-requested');
    },

    onFilterSelect(filterData) {
      this.$store.dispatch("Dashboard/filter", filterData);
      this.$emit('filter-applied', filterData);
    },

    onCaseUpdated() {
      // รีเฟรชข้อมูล reports เมื่อมีการอัพเดทเคส
      this.$store.dispatch("Dashboard/reports", {});
      this.$emit('case-updated');
    },

    onReadInfo(item) {
      this.$emit('info', item);
    }
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang',
      reports: 'Dashboard/reports',
      status: 'Dashboard/status',
      type: 'Dashboard/type',
      levels: 'Dashboard/levels',
      filter: 'Dashboard/filter',
      loading: 'Dashboard/loading',
      error: 'Dashboard/error',
      filteredItems: 'Dashboard/filteredItems',
    }),
  },

  watch: {
    lang: function (value) {
      var lang = this.$store.getters['setting/lang'];
      this.onInit();
      this.$emit('language-changed', value);
    }
  }
}
</script>
