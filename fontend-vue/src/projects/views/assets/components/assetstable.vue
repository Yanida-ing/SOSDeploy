<template>
  <div>
    <CCard class="bg-style2">
      <CCardHeader class="bg-gradient-dark text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
        <span class="font-weight-bold h6">
          <CIcon :name="icon" size="lg"/> {{ caption }}
        </span>
        <div class="card-header-actions">
          <CButton color="light" size="sm" @click="showAddModal = true">
            <CIcon name="cil-plus"/> เพิ่มสินทรัพย์
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol>
            <CDataTable
                :hover="hover"
                :striped="striped"
                :bordered="bordered"
                :small="small"
                :fixed="fixed"
                :fields="fields"
                :items="assetsList"
                :items-per-page="small ? 50 : 20"
                :dark="dark"
                pagination
            >
              <template #index="{item,index}">
                <td class="mt-3">
                  <label>{{index+1}}</label>
                </td>
              </template>

              <template #title="{item,index}">
                <td class="mt-3">
                  <label>{{ getAssetTitle(item) }}</label>
                </td>
              </template>

              <template #description="{item,index}">
                <td class="mt-3">
                  <label>{{ getAssetDescription(item) }}</label>
                </td>
              </template>

              <template #category="{item,index}">
                <td class="mt-3">
                  <CBadge :color="getCategoryColor(item.category)" shape="pill">
                    {{ getCategoryName(item.category) }}
                  </CBadge>
                </td>
              </template>

              <template #subtype="{item,index}">
                <td class="mt-3">
                  <CBadge color="info" shape="pill">
                    {{ getSubtypeName(item.subtype) }}
                  </CBadge>
                </td>
              </template>

              <template #status="{item,index}">
                <td class="mt-3">
                  <CBadge :color="getStatusColor(item)" shape="pill">
                    {{ getStatusText(item) }}
                  </CBadge>
                </td>
              </template>

              <template #action="{item,index}">
                <td style="width: 140px">
                  <CRow>
                    <CCol class="text-center">
                      <CButton class="mr-1" size="sm" color="info" shape="pill" variant="outline" @click="editAsset(item)">
                        <CIcon name="cil-pencil"/>
                      </CButton>
                      <CButton class="mr-1" size="sm" color="danger" shape="pill" variant="outline" @click="deleteAsset(item)">
                        <CIcon name="cil-trash"/>
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

    <!-- Add/Edit Asset Modal -->
    <CModal
      :show.sync="showAddModal"
      :no-close-on-backdrop="true"
      :title="isEditing ? 'แก้ไขสินทรัพย์' : 'เพิ่มสินทรัพย์'"
      size="lg"
      color="primary"
    >
      <CForm>
        <CRow>
          <CCol md="6">
            <CInput
              label="ชื่อสินทรัพย์"
              v-model="formData.title"
              placeholder="กรอกชื่อสินทรัพย์"
              required
            />
          </CCol>
          <CCol md="6">
            <CSelect
              label="ประเภท"
              :options="categoryOptions"
              v-model="formData.category"
              placeholder="เลือกประเภท"
              required
            />
          </CCol>
        </CRow>
        <CRow>
          <CCol md="6">
            <CSelect
              label="ประเภทย่อย"
              :options="subtypeOptions"
              v-model="formData.subtype"
              placeholder="เลือกประเภทย่อย"
              required
            />
          </CCol>
          <CCol md="6">
            <CTextarea
              label="รายละเอียด"
              v-model="formData.description"
              placeholder="กรอกรายละเอียดสินทรัพย์"
              rows="3"
            />
          </CCol>
        </CRow>
      </CForm>
      <template #footer>
        <CButton color="secondary" @click="showAddModal = false">ยกเลิก</CButton>
        <CButton color="primary" @click="saveAsset">บันทึก</CButton>
      </template>
    </CModal>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'

export default {
  name: 'Assetstable',
  props: {
    icon: {
      type: String,
      default: 'cil-inbox'
    },
    caption: {
      type: String,
      default: 'รายการสินทรัพย์'
    },
    fields:{
      type: Array,
      default() {
        return [
          {key: "index", label: "#", _style: 'width:50px; text-align: center'},
          {key: "title", label: "ชื่อสินทรัพย์"},
          {key: "description", label: "รายละเอียด"},
          {key: "category", label: "ประเภท"},
          {key: "subtype", label: "ประเภทย่อย"},
          {key: "status", label: "สถานะ"},
          {key: "action", label: "จัดการ", _style: 'width:140px; text-align: center'},
        ]
      }
    },
    hover: Boolean,
    striped: Boolean,
    bordered: Boolean,
    small: Boolean,
    fixed: Boolean,
    dark: Boolean,
  },
  data() {
    return {
      assetsList: [],
      showAddModal: false,
      formData: {
        title: '',
        description: '',
        category: '',
        subtype: ''
      },
      isEditing: false,
      editingId: null
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
      this.loadAllData();
    },

    loadAllData() {
      var data = {};
      // โหลด categories และ subtypes ก่อน
      this.$store.dispatch("Assets/category", data);
      this.$store.dispatch("Assets/subtype", data);
      this.$store.dispatch("Assets/assets", data);
    },

    loadAssets() {
      var data = {};
      this.$store.dispatch("Assets/assets", data);
    },

    getAssetTitle(asset) {
      if (asset.title && asset.title.length > 0) {
        const lang = this.$store.getters['setting/lang'];
        const titleObj = asset.title.find(title => title.key === lang);
        return titleObj ? titleObj.value : 'ไม่มีชื่อ';
      }
      return 'ไม่มีชื่อ';
    },

    getAssetDescription(asset) {
      if (asset.description && asset.description.length > 0) {
        const lang = this.$store.getters['setting/lang'];
        const descObj = asset.description.find(desc => desc.key === lang);
        return descObj ? descObj.value : 'ไม่มีรายละเอียด';
      }
      return 'ไม่มีรายละเอียด';
    },

    getCategoryName(categoryId) {
      const category = this.categories.find(cat => cat._id === categoryId);
      if (category && category.title) {
        const lang = this.$store.getters['setting/lang'];
        const titleObj = category.title.find(title => title.key === lang);
        return titleObj ? titleObj.value : categoryId;
      }
      return categoryId;
    },

    getSubtypeName(subtypeId) {
      const subtype = this.subtypes.find(sub => sub._id === subtypeId);
      if (subtype && subtype.title) {
        const lang = this.$store.getters['setting/lang'];
        const titleObj = subtype.title.find(title => title.key === lang);
        return titleObj ? titleObj.value : subtypeId;
      }
      return subtypeId;
    },

    getCategoryColor(categoryId) {
      const colors = ['primary', 'success', 'warning', 'danger', 'info', 'secondary'];
      const index = this.categories.findIndex(cat => cat._id === categoryId);
      return colors[index % colors.length];
    },

    getStatusColor(asset) {
      // Check if asset has history and is currently in use
      if (asset.history && asset.history.length > 0) {
        const lastHistory = asset.history[asset.history.length - 1];
        return lastHistory.state ? 'success' : 'warning';
      }
      return 'secondary';
    },

    getStatusText(asset) {
      if (asset.history && asset.history.length > 0) {
        const lastHistory = asset.history[asset.history.length - 1];
        return lastHistory.state ? 'ใช้งาน' : 'ไม่ใช้งาน';
      }
      return 'ไม่ระบุ';
    },

    editAsset(asset) {
      this.isEditing = true;
      this.editingId = asset._id;
      this.formData = {
        title: this.getAssetTitle(asset),
        description: this.getAssetDescription(asset),
        category: asset.category,
        subtype: asset.subtype
      };
      this.showAddModal = true;
    },

    deleteAsset(asset) {
      console.log('Deleting asset:', asset);
      if (confirm('คุณต้องการลบสินทรัพย์นี้หรือไม่?')) {
        console.log('Deleting asset with ID:', asset._id);
        this.$store.dispatch("Assets/remove", asset._id);
      }
    },

    saveAsset() {
      console.log('Saving asset:', this.formData);
      
      const assetData = {
        title: [{
          key: this.$store.getters['setting/lang'],
          value: this.formData.title
        }],
        description: [{
          key: this.$store.getters['setting/lang'],
          value: this.formData.description
        }],
        category: this.formData.category,
        subtype: this.formData.subtype
      };

      console.log('Asset data to save:', assetData);

      if (this.isEditing) {
        assetData._id = this.editingId;
        console.log('Updating asset with ID:', this.editingId);
        this.$store.dispatch("Assets/update", assetData);
      } else {
        console.log('Creating new asset');
        this.$store.dispatch("Assets/create", assetData);
      }
      
      this.showAddModal = false;
      this.resetForm();
    },

    resetForm() {
      this.formData = {
        title: '',
        description: '',
        category: '',
        subtype: ''
      };
      this.isEditing = false;
      this.editingId = null;
    }
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang',
      categories: 'Assets/category',
      subtypes: 'Assets/subtype',
      assets: 'Assets/assets',
    }),

    categoryOptions() {
      if (!this.categories) return [];
      return this.categories.map(cat => ({
        value: cat._id,
        label: this.getCategoryName(cat._id)
      }));
    },

    subtypeOptions() {
      if (!this.subtypes) return [];
      return this.subtypes.map(sub => ({
        value: sub._id,
        label: this.getSubtypeName(sub._id)
      }));
    }
  },

  watch: {
    lang: function (value) {
      var lang = this.$store.getters['setting/lang'];
    },

    assets: function (value) {
      this.assetsList = value || [];
    }
  }
}

</script>
  