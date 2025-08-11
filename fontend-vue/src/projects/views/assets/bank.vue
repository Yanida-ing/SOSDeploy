<template>
  <div>

  </div>
</template>
<script>
import {mapGetters} from 'vuex'

export default {
  name: 'Blank',
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



  }
}

</script>
