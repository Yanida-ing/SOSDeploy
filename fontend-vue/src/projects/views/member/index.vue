<template>
  <div>
    <CRow>
      <CCol>
        <CCard>
          <CCardBody>
            <CWidgetProgress footer="Lorem ipsum dolor sit amet enim.">
              <div class="h4 m-0">89.9%</div>
              <div class="card-header-actions">
                <a
                    href="https://coreui.io/vue/docs/components/widgets"
                    class="card-header-action position-absolute"
                    style="right:5px; top:5px"
                    rel="noreferrer noopener"
                    target="_blank"
                >
                  <small class="text-muted">docs</small>
                </a>
              </div>
              <div>Lorem ipsum...</div>
              <CProgress
                  color="gradient-success"
                  :value="25"
                  class="progress-xs my-3 mb-0"
              />
            </CWidgetProgress>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
    {{messages}}
  </div>
</template>
<script>
import {mapGetters} from 'vuex'

export default {
  name: 'member',
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

      this.$store.dispatch("auth/message",{})
    },
  },

  computed: {
    ...mapGetters({
      messages: 'auth/message',
    })
  },

  watch: {



  }
}

</script>
