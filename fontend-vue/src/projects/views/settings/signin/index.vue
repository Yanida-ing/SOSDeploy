<template>
  <div>
    <CRow>
      <CCol>
        <span class="font-weight-bold"> Preview Authen </span>
      </CCol>
    </CRow>
    <CDropdownDivider/>
    <CRow class="justify-content-center ">
      <CCol>
        <CCard class="bg-login p-2">
          <CCardBody>
            <CForm>
              <CRow>
                <CCol class="text-center">
                  <img src="@/assets/logo.svg" height="150px"/>
                </CCol>
              </CRow>

              <CRow class=" mt-2">
                <CCol>
                  {{description}}
                  <div class="ql-editor " style="min-height: 240px">
                    <div v-html="description.filter(item => { return (item.key === 'en') }).at(-1).value"></div>
                  </div>
                </CCol>
              </CRow>
              <CRow>
                <CCol class="text-center">
                  <div style="cursor: pointer">
                    <CButton color="danger" shape="pill">
                      <samp class="pl-2 pr-2">Login with MFU Mail</samp>
                    </CButton>
                  </div>
                </CCol>
              </CRow>

            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol>
        <CCard class="bg-style2">
          <CCardHeader class="bg-gradient-dark text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
            <span class="font-weight-bold h6"> Setting</span>

            <div class="card-header-actions">
            </div>
          </CCardHeader>
          <CCardBody>

            <CRow>
              <CCol col="3">
                <label class="font-weight-bold">
                  Start Date
                </label>
              </CCol>
              <CCol>
                <CInput type="datetime-local" v-model="startDate"/>
              </CCol>
              <label class="mt-2">-</label>
              <CCol>
                <CInput type="datetime-local" v-model="endDate"/>
              </CCol>
            </CRow>
            <MLEditor caption="Description" :items="description" :disable="false"/>

            <CRow class="mt-4 float-right">
              <CCol>
                <CButton color="dark" variant="outline" shape="pill" class="mr-2" @click="onClear">
                  <samp class="pl-2 pr-2">CANCEL</samp>
                </CButton>
                <CButton color="success" variant="outline" shape="pill" @click="onCreateMessage">
                  <samp class="pl-2 pr-2">SUBMIT</samp>
                </CButton>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
    <CDropdownDivider/>

    <CRow>
      <CCol>
        <History :item="messages"  @update="onUpdate" @remove="onRemove"/>
      </CCol>
    </CRow>
  </div>
</template>
<script>
import {mapGetters} from 'vuex'
import MLEditor from "@/projects/components/Util/MLEditor.vue";
import 'quill/dist/quill.snow.css'
import History from "@/projects/views/dashboards/components/history.vue";
import moment from "moment";

export default {
  name: 'Applications',
  components: {History, MLEditor},
  props: {
    icon: {
      type: String,
      default: 'cil-user'
    },
    caption: {
      type: String,
      default: 'Sign In'
    },
    application: {
      type: String,
      default: '0'
    }
  },
  data() {
    return {
      _id:null,
      startDate:'',
      endDate:'',
      description: [{key: "th", value: ""}, {key: "en", value: ""}],
      objs: {
        title: [{key: "th", value: ""}, {key: "en", value: ""}],
        description: [{key: "th", value: ""}, {key: "en", value: ""}],
      }
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

    onCreateMessage(){
      var data = {};
      data._id = this._id;
      data.startDate = this.startDate;
      data.endDate = this.endDate;
      data.description = this.description;

      if(data._id == null){
        this.$store.dispatch("auth/createMessage",data)
      }else {
        this.$store.dispatch("auth/updateMessage",data)
      }
      this.onClear();
    },

    onUpdate(value){
      this._id = value.value._id;
      this.startDate = new moment(value.value.startDate).format('YYYY-MM-DD HH:mm:ss');
      this.endDate = new moment(value.value.endDate).format('YYYY-MM-DD HH:mm:ss');
      this.description = value.value.description;

      // this.onClear();
    },

    onRemove(value){
      var data = {};
      data._id = value.value._id;

      var configs = {};
      configs.params = data

      this.$store.dispatch("auth/removeMessage", configs)

      this.onClear();
    },

    onClear(){
      this._id = null;
      this.startDate = '';
      this.endDate = '';
      this.description = [{key: "th", value: ""}, {key: "en", value: ""}];
    }
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang',
      messages: 'auth/message',
    })
  },

  watch: {
    lang: function (value) {

    },


  }
}

</script>
