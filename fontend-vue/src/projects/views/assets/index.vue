<template>
  <div>
    <Assetswidget :icon="icon" :caption="caption" />
    <Assetstable/>
  </div>
</template>
<script>
import {mapGetters} from 'vuex'
import Assetswidget from './components/assetswidget.vue'
import Assetstable from './components/assetstable.vue'

export default {
  name: 'Assets',
  components: {
    Assetswidget,Assetstable
  },
  props: {
    icon: {
      type: String,
      default: 'cil-inbox'
    },
    caption: {
      type: String,
      default: 'จัดการสินทรัพย์'
    },
  },
  data() {
    return {

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
      // Initialize store data for assets
      var data = {};
      this.$store.dispatch("Assets/categories", data);
      this.$store.dispatch("Assets/subtypes", data);
      this.$store.dispatch("Assets/assetsCount", data);
      this.$store.dispatch("Assets/assetsByCategory", data);
      this.$store.dispatch("Assets/assetsBySubtype", data);
    },
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang',
    })
  },

  watch: {
    lang: function (value) {
      var lang = this.$store.getters['setting/lang'];
      // Re-initialize when language changes
      this.onInit();
    }
  }
}

</script>
