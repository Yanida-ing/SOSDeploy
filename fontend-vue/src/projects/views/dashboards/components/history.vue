<template>
  <div>
    <CRow>
      <CCol>
        <CDataTable
            :header="false"
            :footer="false"
            :table-filter="{label:'Search'}"
            :hover="hover"
            :striped="striped"
            :bordered="bordered"
            :small="small"
            :fixed="fixed"
            :items="history"
            :fields="fields"
            :items-per-page="small ? 50 : 20"
            :dark="dark"
            pagination
            :loading="loading"
        >

          <template #description="{item}">
            <CCard class="bg-style2 mt-2" @click="onClick(item)">
              <CCardHeader class="bg-gradient-dark text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
                <span class="font-weight-bold h6"><CIcon name="cil-tags" size="lg"/> # {{ item.taxTd }}</span>
              </CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol>
                    <p class="font-weight-bold mb-0 h5">{{ item.title }}</p>
                    <p>{{ item.description }}</p>
                  </CCol>
                  <CCol>
                    <Countup name="" :start="item.date"  />
                  </CCol>
                </CRow>
                <CRow>
                  <CCol col="4">
                    <CIcon name="cil-contact" size="lg"/> {{ item.name }} ({{item.user || 'ไม่ระบุ'}})
                  </CCol>
                  <CCol col="4">
                    <CIcon name="cil-building" size="lg"/> {{ item.location }}
                  </CCol>
                  <CCol col="4">
                    <CIcon name="cil-phone" size="lg"/> {{ item.mobile }}
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </template>


          <template #taxTd="{item}"><span style="display:none">{{ item.title }}</span></template>
          <template #title="{item}"><span style="display:none">{{ item.title }}</span></template>
          <template #name="{item}"><span style="display:none">{{ item.name }}</span></template>
          <template #location="{item}"><span style="display:none">{{ item.location }}</span></template>
          <template #mobile="{item}"><span style="display:none">{{ item.mobile }}</span></template>
          <template #status="{item}"><span style="display:none">{{ item.status }}</span></template>
          <template #level="{item}"><span style="display:none">{{ item.level }}</span></template>
          <template #user="{item}"><span style="display:none">{{ item.user }}</span></template>


<!--              <template ##="{item}">-->
<!--                <td style="width: 140px">-->
<!--                  <CRow>-->
<!--                    <CCol class="text-right">-->
<!--                      <CButton class="mr-1" v-c-tooltip.hover.click="'Remove'" size="sm" color="danger" shape="pill" variant="outline" @click="onRemove(item)"  >-->
<!--                        <CIcon name="cil-trash"/>-->
<!--                      </CButton>-->

<!--                      <CButton class="mr-1" v-c-tooltip.hover.click="'Detail'" size="sm" color="info" shape="pill" variant="outline" @click="onUpdate(item)"  >-->
<!--                        <CIcon name="cil-description"/>-->
<!--                      </CButton>-->


<!--                    </CCol>-->
<!--                  </CRow>-->
<!--                </td>-->
<!--              </template>-->
            </CDataTable>
          </CCol>
        </CRow>
<!--      </CCardBody>-->
<!--    </CCard>-->
  </div>

</template>
<script>
  import {mapGetters} from 'vuex'
  import moment from "moment";
  import Countup from "@/projects/components/custom/Countup.vue";
  export default {
    name: 'History',
    components: {Countup},
    props: {
      icon: {
        type: String,
        default: 'cil-settings',
      },
      caption: {
        type: String,
        default: 'Historys'
      },

      item:{
        type: Array,
        default() {
          return []
        }
      },

      fields: {
        type: Array,
        default() {
          return [
            {key: "taxTd", label: "#"},
            {key: "title", label: "หัวข้อ"},
            {key: "user", label: "ประเภทผู้ใช้"},
            {key: "name", label: "ชื่อ"},
            {key: "location", label: "สถานที่"},
            {key: "mobile", label: "เบอร์โทร"},
            {key: "status", label: "สถานะ"},
            {key: "level", label: "ระดับ"},
            {key: "description", label: "รายละเอียด"}
          ]
        }
      },
      type: {
        type: String,
        default: 'cil-user'
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
    data () {
      return {
        history: [],
      }
    },

    mounted() {

    },

    created() {
      this.history = this.item
    },

    beforeDestroy() {

    },

    methods: {
      onInit(){
        var data = {};
        this.$store.dispatch("account/config",data);
      },

      toggleDetails (item) {
        item._toggled = !item._toggled
        this.collapseDuration = 300
        this.$nextTick(() => { this.collapseDuration = 0})
      },

      onUpdate(item) {
        this.$emit('update', item);
      },

      onRemove(item) {
        this.$emit('remove', item);
      },

      onSetHistory(){
        try {
          this.history = this.item.map(objs => {
            return {
              value: objs,
              taxTd: objs.taxTd || '',
              title: objs.title || '',
              name: objs.name || '',
              user: objs.user || '',
              location: objs.location || '',
              mobile: objs.mobile || '',
              status: objs.status || '',
              level: objs.level || '',
              startDate: objs.startDate || '',
              endDate: objs.endDate || '',
              description: Array.isArray(objs.description) ? (objs.description.find(obj => obj.key === this.lang)?.value || '') : (objs.description || '')
            };
          });
        }catch (e) {

        }

      },

      onClick(item){
        console.log(item);
        this.$router.push({ path: '/case', query: { id: item._id } })
      }


    },

    computed:{
      ...mapGetters({
        lang:'setting/lang',
      })
    },

    watch: {
      lang:function (value) {
        this.onSetHistory();
      },

      item(value){
        this.history = value
      }

    }
  }

</script>
<style scoped>

</style>
