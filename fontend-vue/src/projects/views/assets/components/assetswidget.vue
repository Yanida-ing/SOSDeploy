<template>
  <CCard class="bg-style2">
    <CCardHeader class="bg-gradient-primary text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
      <span class="font-weight-bold h6"> 
        <CIcon class="mr-2" v-if="icon" :name="icon"/> {{ caption }} 
      </span>
    </CCardHeader>
    <CCardBody class="pb-0">
      <CRow>
        <CCol md="3" sm="6">
          <CWidgetBrand
            color="primary"
            right-header="รายการ"
            right-footer="ทั้งหมด"
            :left-header="assetsCount.toString()"
            left-footer="สินทรัพย์"
          >
            <CIcon
              name="cil-inbox"
              height="52"
              class="my-4"
            />
          </CWidgetBrand>
        </CCol>

        <!-- Categories Widget -->
        <CCol md="3" sm="6">
          <CWidgetBrand
            color="info"
            right-header="ประเภท"
            right-footer="หมวดหมู่"
            :left-header="categories.length.toString()"
            left-footer="ประเภท"
          >
            <CIcon
              name="cil-tags"
              height="52"
              class="my-4"
            />
          </CWidgetBrand>
        </CCol>

        <!-- Subtypes Widget -->
        <CCol md="3" sm="6">
          <CWidgetBrand
            color="success"
            right-header="ประเภทย่อย"
            right-footer="หมวดหมู่ย่อย"
            :left-header="subtypes.length.toString()"
            left-footer="ประเภทย่อย"
          >
            <CIcon
              name="cil-list"
              height="52"
              class="my-4"
            />
          </CWidgetBrand>
        </CCol>
        
        <CCol md="3" sm="6">
          <CWidgetBrand
            right-header="กิจกรรม"
            right-footer="ล่าสุด"
            left-header="12"
            left-footer="รายการ"
            color="gradient-warning"
          >
            <CIcon
              name="cil-clock"
              height="52"
              class="my-4"
            />
          </CWidgetBrand>
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>
</template>

<script>
import {mapGetters} from 'vuex'

export default {
  name: 'Assetswidget',
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
      topCategories: [],
      categoryColors: ['primary', 'info', 'success', 'warning', 'danger', 'secondary'],
      categoryIcons: ['cil-inbox', 'cil-tags', 'cil-list', 'cil-clock', 'cil-star', 'cil-heart']
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
      var data = {};
      this.$store.dispatch("Assets/categories", data);
      this.$store.dispatch("Assets/subtypes", data);
      this.$store.dispatch("Assets/assetsCount", data);
      this.$store.dispatch("Assets/assetsByCategory", data);
      this.$store.dispatch("Assets/assetsBySubtype", data);
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

    getCategoryColor(categoryId) {
      const index = this.categories.findIndex(cat => cat._id === categoryId);
      return this.categoryColors[index % this.categoryColors.length];
    },

    getCategoryIcon(categoryId) {
      const index = this.categories.findIndex(cat => cat._id === categoryId);
      return this.categoryIcons[index % this.categoryIcons.length];
    },

    updateTopCategories() {
      if (this.assetsByCategory && this.categories) {
        this.topCategories = Object.keys(this.assetsByCategory)
          .map(categoryId => ({
            _id: categoryId,
            count: this.assetsByCategory[categoryId]
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4); // Top 4 categories
      }
    }
  },

  computed: {
    ...mapGetters({
      lang: 'setting/lang',
      categories: 'Assets/categories',
      subtypes: 'Assets/subtypes',
      assetsCount: 'Assets/assetsCount',
      assetsByCategory: 'Assets/assetsByCategory',
      assetsBySubtype: 'Assets/assetsBySubtype',
    })
  },

  watch: {
    lang: function (value) {
      var lang = this.$store.getters['setting/lang'];
      this.updateTopCategories();
    },

    categories: function (value) {
      this.updateTopCategories();
    },

    assetsByCategory: function (value) {
      this.updateTopCategories();
    }
  }
}

</script>
  