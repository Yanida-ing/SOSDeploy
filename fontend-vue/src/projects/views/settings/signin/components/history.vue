<template>
  <div>
    <CCard class="bg-style2">
      <CCardHeader class="bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
        <span class="font-weight-bold h6"> <CIcon v-if="icon" :name="icon"/> {{ caption }} </span>

        <div class="card-header-actions">
          Total : {{item.length}}
        </div>

      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol>
            <CDataTable
                :table-filter="{label:''}"
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
              <template #index="{item,index}">
                <td class="text-center"  @click="toggleDetails(item, index)"> {{ index + 1 }}</td>
              </template>




              <template #action="{item}">
                <td style="width: 140px">
                  <CRow>
                    <CCol class="text-center">
                      <CButton class="mr-1" v-c-tooltip.hover.click="'Detail'" size="sm" color="info" shape="pill" variant="outline" @click="onUpdate(item)"  >
                        <CIcon name="cil-description"/>
                      </CButton>


                    </CCol>
                  </CRow>
                </td>
              </template>
            </CDataTable>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  </div>

</template>
<script>
  import {mapGetters} from 'vuex'
  export default {
    name: 'History',
    props: {
      icon: {
        type: String,
        default: 'cil-user'
      },
      caption: {
        type: String,
        default: 'Create / Update'
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
            {key: "index", label: "ลำดับ",  _style: 'width:50px; text-align: center'},
            {key:"title", label:"Title",},
            {key:"action", label: "#", _style: 'width:100px; text-align: center'}
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
        history : [],
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
      onInit(){

      },

      toggleDetails (item) {
        item._toggled = !item._toggled
        this.collapseDuration = 300
        this.$nextTick(() => { this.collapseDuration = 0})
      },

      onUpdate(item) {
        this.$emit('update', item);
      },

    },

    computed:{
      ...mapGetters({
        lang:'setting/lang',
      })
    },

    watch: {
      lang:function (value) {
      },


    }
  }

</script>
