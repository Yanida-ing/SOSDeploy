<template>
  <div>
    <div v-for="cat in categoryRenderList" :key="cat.id" class="mb-4">
      <CCard class="bg-style2 position-relative">
      <CCardHeader class="bg-gradient-dark text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">
          <span class="font-weight-bold h6"><CIcon :name="icon" size="lg"/> {{ cat.label }}</span>
      </CCardHeader>
      <CCardBody>
          <div class="asset-table-wrapper">
        <CRow>
          <CCol>
            <CDataTable
                :hover="hover"
                :striped="striped"
                :bordered="bordered"
                :small="small"
                :fixed="false"
                :fields="fields"
                :items="rowsByCategory[cat.id] || []"
                :items-per-page="small ? 50 : 20"
                :dark="dark"
                pagination
            >
                <template #index="{index}">
                <td class="mt-3">
                    <label>{{ index + 1 }} </label>
                </td>
              </template>
                <template #name="{item}">
                <td class="mt-3">
                    <label>{{ itemTitle(item) }} </label>
                </td>
              </template>
                <template #total="{item}">
                <td>
                    <CInput v-model.number="editsByAssetId[item._id]" type="number" :max="totalAmount(item)" min="0" size="sm" class="qty-input-table">
                    <template #append>
                        <span class="input-group-text bg-dark text-white border-0">
                          / {{ Number(totalAmount(item)).toLocaleString('en-US') }}
                        </span>
                    </template>
                  </CInput>
                </td>
              </template>
                <template #action="{item}">
                  <td style="width: 180px">
                  <CRow>
                      <CCol class="text-center">
                        <CButton class="mr-1" size="sm" color="success" shape="pill" variant="outline" @click="onUpdateByAsset(item, editsByAssetId[item._id])">
                          <CIcon name="cil-save"/>
                        </CButton>
                        <CButton class="mr-1" size="sm" color="danger" shape="pill" variant="outline" @click="removeFromCategory(cat.id, item._id)">
                          <CIcon name="cil-trash"/>
                      </CButton>
                    </CCol>
                  </CRow>
                </td>
              </template>
            </CDataTable>
          </CCol>
        </CRow>
          </div>
          <!-- Bottom right action to match CaseControl history button -->
          <CRow class="mt-2">
            <CCol class="text-right">
              <CButton size="sm" color="success" class="add-btn" variant="outline" @click="openAddModal(cat.id)">
                <CIcon name="cil-plus" size="sm" class="mr-1"/> เพิ่มสินทรัพย์
              </CButton>
            </CCol>
          </CRow>
      </CCardBody>
    </CCard>
    </div>

    <!-- Add Assets Modal: mimic CaseControl style but flexible selection/qty -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem;">
          <h5 class="modal-title font-weight-bold h6">
            เพิ่มสินทรัพย์
          </h5>
          <button type="button" class="close text-white" @click="showAddModal = false">
            <span>&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="font-weight-bold">เลือกสินทรัพย์และระบุจำนวน</label>
            <div class="mb-2">
              <CInput v-model.trim="modalSearch" placeholder="ค้นหา..." size="sm" @input="filterModalList" />
            </div>
            <div v-if="modalAssetListFiltered.length === 0" class="text-muted small">ไม่มีสินทรัพย์ที่สามารถเลือกได้</div>
            <div v-for="row in modalAssetListFiltered" :key="row.id" class="modal-asset-row">
              <div class="modal-asset-name">
                <input type="checkbox" v-model="row.selected" class="modal-asset-checkbox" />
                <span class="asset-label">{{ row.label }}</span>
              </div>
              <div class="modal-asset-qty">
                <CInput
                  v-model.number="row.qty"
                  type="number"
                  :max="row.available"
                  min="0"
                  size="sm"
                  class="qty-input"
                >
                  <template #append>
                    <span class="input-group-text bg-dark text-white border-0">
                      / {{ Number(row.available).toLocaleString('en-US') }}
                    </span>
                  </template>
                </CInput>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <CButton size="sm" color="danger" variant="outline" @click="showAddModal = false" class="modal-btn">
            <CIcon name="cil-ban" size="sm" class="mr-1"/> ยกเลิก
          </CButton>
          <CButton size="sm" color="success" variant="outline" @click="confirmAdd" class="modal-btn">
            <CIcon name="cil-save" size="sm" class="mr-1"/> เพิ่ม
          </CButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import Service from '@/service/api'

export default {
  name: 'FoodAssest',
  components: {},
  props: {
    icon: {
      type: String,
      default: 'cil-fastfood'
    },
    caption: {
      type: String,
      default: 'อาหาร'
    },
    fields:{
      type: Array,
      default() {
        return [
          {key: "index", label: "#", _style: 'width:50px; text-align: center'},
          {key: "name", label: "รายการ"},
          {key: "total", label: "จำนวน"},
          {key: "action", label: "การทำงาน", _style: 'width:100px; text-align: center'},
        ]
      }
    },
    hover: Boolean,
    striped: Boolean,
    bordered: Boolean,
    small: Boolean,
    fixed: Boolean,
    dark: Boolean,

    caseKey: {
      type: String,
      default: 'default'
    },

    item: {
      type: Array,
      default() {
        return []
      }
    },



  },
  data () {
    return {
      selectedIdsByCategory: {}, 
      editsByAssetId: {},
      committedQtyByAssetId: {},
      rowsByCategory: {}, 
      options: {
        category: [],
        subtype: [],
      },
      selected: {
        category: { label: '-', value: 0 },
        subtype: { label: '-', value: 0 },
      },
      rawSubtypes: [],
      showAddModal: false,
      addModalCategory: null, 
      modalAssetList: [], 
      modalAssetListFiltered: [],
      modalSearch: '',
      categoryRenderList: [], 
      hydratedFromReport: false,
      hydrationCaseKey: null,
    }
  },

  mounted() {},

  created() {
    this.onInit()
    this.loadSelection()
  },

  beforeDestroy() {

  },

  methods: {
    onInit() {
      this.$store.dispatch('Assets/assets')
      this.$store.dispatch('Assets/category')
      this.$store.dispatch('Assets/subtype')
    },

    itemTitle(asset) {
      const lang = this.lang
      const found = (asset.title || []).find((t) => t.key === lang)
      return found ? found.value : ''
    },

    getLocalizedLabel(entity) {
      const lang = this.lang
      return (entity.title || []).find((t) => t.key === lang)?.value
    },

    allowedCategoryLabels() {
      return ['ใช้แล้วหมดไป', 'ใช้แล้วคงอยู่', 'Consumable', 'Durable']
    },

    buildCategoryOptions() {
      const lang = this.lang
      const allowed = this.allowedCategoryLabels()
      const base = { label: '-', value: 0 }
      const mapped = (this.category || [])
        .map((c) => ({ label: this.getLocalizedLabel(c), value: c._id }))
        .filter((c) => allowed.includes(c.label))
      this.options.category = [base, ...mapped]
      if (!this.options.category.find((c) => c.value === this.selected.category?.value)) {
        this.selected.category = base
      }
      this.categoryRenderList = mapped.map((m) => ({ id: String(m.value), label: m.label }))
    },

    saveSelection() {
      try {
        const key = `assetsSelection:${this.caseKey}`
        const payload = {
          selectedIdsByCategory: this.selectedIdsByCategory,
          editsByAssetId: this.editsByAssetId,
          committedQtyByAssetId: this.committedQtyByAssetId,
        }
        localStorage.setItem(key, JSON.stringify(payload))
      } catch (e) { /* ignore */ }
    },

    loadSelection() {
      try {
        const key = `assetsSelection:${this.caseKey}`
        const raw = localStorage.getItem(key)
        if (!raw) return
        const data = JSON.parse(raw)
        this.selectedIdsByCategory = data.selectedIdsByCategory || {}
        this.editsByAssetId = data.editsByAssetId || {}
        this.committedQtyByAssetId = data.committedQtyByAssetId || {}
        // หลังจากโหลดจาก localStorage ให้ compute rows ทันที
        this.computeRows()
      } catch (e) { /* ignore */ }
    },

    updateSubtypeOptions() {
      const lang = this.lang
      const base = { label: '-', value: 0 }
      const selectedCategoryId = this.selected.category?.value
      const list = (this.rawSubtypes || []).filter((s) => {
        const id = s.categoryId || s.category || s.category_id
        return id === selectedCategoryId
      })
      const mapped = list.map((s) => ({ label: this.getLocalizedLabel(s), value: s._id }))
      this.options.subtype = [base, ...mapped]
      if (!this.options.subtype.find((s) => s.value === this.selected.subtype?.value)) {
        this.selected.subtype = base
      }
    },

    totalAmount(asset) {
      if (!Array.isArray(asset.history)) return 0
      let incoming = 0
      let outgoing = 0
      for (const h of asset.history) {
        const amt = Number(h.amount || 0)
        if (h.state === true) incoming += amt
        else outgoing += amt
      }
      return Math.max(0, incoming - outgoing)
    },

    computeRows() {
      // derive visible rows per category based on current assets and user selection
      const assets = Array.isArray(this.assets) ? this.assets : []
      const toCategoryId = (asset) => String(asset?.category?._id || asset?.category || '')
      const assetsByCategory = {}
      for (const asset of assets) {
        const categoryId = toCategoryId(asset)
        if (!assetsByCategory[categoryId]) assetsByCategory[categoryId] = []
        assetsByCategory[categoryId].push(asset)
      }
      const rows = {}
      Object.keys(assetsByCategory).forEach((categoryId) => {
        const selectedSet = new Set(this.selectedIdsByCategory[categoryId] || [])
        rows[categoryId] = assetsByCategory[categoryId].filter((asset) => selectedSet.has(asset._id))
      })
      this.rowsByCategory = rows
    },

    onUpdateByAsset(asset, amount) {
      if (!asset?._id) return
      const newQty = Number(amount || 0)
      const prevQty = Number(this.committedQtyByAssetId[asset._id] || 0)
      const delta = newQty - prevQty
      if (delta === 0) return
      const payload = {
        _id: asset._id,
        amount: Math.abs(delta),
        state: delta < 0 ? true : false,
      }
      this.$store.dispatch('Assets/update', payload).then(() => {
        this.$set(this.committedQtyByAssetId, asset._id, newQty)
        this.syncReportAssets()
        // Refresh assets data after update
        this.$store.dispatch('Assets/assets')
      })
    },

    removeFromCategory(categoryId, assetId) {
      const list = this.selectedIdsByCategory[categoryId] || []
      const qty = Number(this.committedQtyByAssetId[assetId] || this.editsByAssetId[assetId] || 0)
      if (qty > 0) {
        const payload = { _id: assetId, amount: qty, state: true }
        this.$store.dispatch('Assets/update', payload)
      }
      this.selectedIdsByCategory = { ...this.selectedIdsByCategory, [categoryId]: list.filter((id) => id !== assetId) }
      this.$delete(this.editsByAssetId, assetId)
      this.$delete(this.committedQtyByAssetId, assetId)
      this.syncReportAssets()
    },

    openAddModal(categoryId) {
      this.addModalCategory = String(categoryId)
      this.modalAssetList = this.buildModalList(this.addModalCategory)
      this.modalSearch = ''
      this.filterModalList()
      this.showAddModal = true
    },

    buildModalList(categoryId) {
      const cid = String(categoryId)
      const assets = Array.isArray(this.assets) ? this.assets : []
      const selectedIds = new Set(this.selectedIdsByCategory[cid] || [])
      const list = assets.filter((a) => String(a?.category?._id || a?.category || '') === cid)
      return list
        .filter((a) => !selectedIds.has(a._id))
        .map((a) => ({
          id: a._id,
          label: this.itemTitle(a),
          available: this.totalAmount(a),
          selected: false,
          qty: 0,
        }))
    },
    filterModalList() {
      const term = (this.modalSearch || '').toString().toLowerCase().trim()
      if (!term) {
        this.modalAssetListFiltered = [...this.modalAssetList]
        return
      }
      this.modalAssetListFiltered = this.modalAssetList.filter((x) => (x.label || '').toLowerCase().includes(term))
    },
    confirmAdd() {
      const cid = String(this.addModalCategory)
      const curr = this.selectedIdsByCategory[cid] || []
      const chosen = this.modalAssetList.filter((x) => x.selected && Number(x.qty) > 0)
      const ids = chosen.map((x) => x.id)
      const updates = chosen.map((x) => {
        const qty = Math.max(0, Math.min(Number(x.qty), Number(x.available)))
        return this.$store.dispatch('Assets/update', { _id: x.id, amount: qty, state: false }).then(() => {
          this.$set(this.editsByAssetId, x.id, qty)
          this.$set(this.committedQtyByAssetId, x.id, qty)
        })
      })
      Promise.all(updates).then(() => {
        this.selectedIdsByCategory = { ...this.selectedIdsByCategory, [cid]: [...new Set([...curr, ...ids])] }
        this.showAddModal = false
        this.computeRows()
        this.saveSelection()
        this.syncReportAssets()
        // Refresh assets data after updates
        this.$store.dispatch('Assets/assets')
      })
    },

    hydrateFromReport() {
      if (!this.caseKey) return
      if (this.hydratedFromReport && this.hydrationCaseKey === this.caseKey) return
      
      const report = this.caseData
      const assetList = Array.isArray(report && report.assets) ? report.assets : []
      
      // ถ้าไม่มี assets ในรายงาน และยังไม่เคย hydrate ให้ hydrate เป็น empty state
      if (!assetList.length) { 
        this.hydratedFromReport = true; 
        this.hydrationCaseKey = this.caseKey; 
        return 
      }
      
      const assetsById = new Map((Array.isArray(this.assets) ? this.assets : []).map(a => [a._id, a]))
      const nextSelected = { ...this.selectedIdsByCategory }
      const nextEdits = { ...this.editsByAssetId }
      const nextCommitted = { ...this.committedQtyByAssetId }
      
      for (const entry of assetList) {
        const assetId = entry.id || entry._id || entry.assetId
        const amount = Number(entry.amount || 0)
        if (!assetId || amount <= 0) continue
        const asset = assetsById.get(assetId)
        if (!asset) continue
        const categoryId = String(asset?.category?._id || asset?.category || '')
        if (!categoryId) continue
        if (!nextSelected[categoryId]) nextSelected[categoryId] = []
        if (!nextSelected[categoryId].includes(assetId)) nextSelected[categoryId].push(assetId)
        nextEdits[assetId] = amount
        nextCommitted[assetId] = amount
      }
      
      this.selectedIdsByCategory = nextSelected
      this.editsByAssetId = nextEdits
      this.committedQtyByAssetId = nextCommitted
      this.computeRows()
      this.saveSelection()
      this.hydratedFromReport = true
      this.hydrationCaseKey = this.caseKey
    },

    getCurrentReportAssets() {
      const result = []
      const seen = new Set()
      const add = (assetId) => {
        if (!assetId || seen.has(assetId)) return
        const qty = Number(this.committedQtyByAssetId[assetId] || this.editsByAssetId[assetId] || 0)
        if (qty > 0) {
          result.push({ id: assetId, amount: qty })
          seen.add(assetId)
        }
      }
      Object.values(this.selectedIdsByCategory || {}).forEach(arr => (arr || []).forEach(add))
      return result
    },

    syncReportAssets() {
      if (!this.caseKey) return
      const payload = { id: this.caseKey, assets: this.getCurrentReportAssets() }
      Service.caseManagement('set-assets', payload).catch(() => {})
    },
  },

  computed:{
    ...mapGetters({
      lang:'setting/lang',
      assets: 'Assets/assets',
      category: 'Assets/category',
      subtype: 'Assets/subtype',
      caseData: 'Dashboard2/case',
    }),
  },

  watch: {
    lang: function (value) {
      var lang = this.$store.getters['setting/lang']
      this.onInit()
      this.$emit('language-changed', value)
    },

    caseKey: {
    immediate: true,
    handler(newKey, oldKey) {
      if (newKey !== oldKey) {
        // Clear all states
        this.selectedIdsByCategory = {}
        this.editsByAssetId = {}
        this.committedQtyByAssetId = {}
        this.hydratedFromReport = false
        this.hydrationCaseKey = null

        // Reset modal states
        this.showAddModal = false
        this.addModalCategory = null
        this.modalAssetList = []
        this.modalAssetListFiltered = []
        this.modalSearch = ''

        // Compute rows with cleared data
        this.computeRows()

        // Load new case data
        this.$nextTick(() => {
          this.loadSelection()
          if (this.caseData) {
            this.hydrateFromReport()
          }
        })
      }
    }
  },

    caseData: {
    immediate: true,
    handler(newData) {
      if (!this.hydratedFromReport || this.hydrationCaseKey !== this.caseKey) {
        this.$nextTick(() => {
          this.hydrateFromReport()
        })
      }
    }
  },

    assets: {
    immediate: true,
    handler(newAssets) {
      this.$nextTick(() => {
        this.computeRows()
        if (!this.hydratedFromReport && this.caseData) {
          this.hydrateFromReport()
        }
      })
    }
  },

    
    category(value) {
      this.buildCategoryOptions()
      this.computeRows()
    },
    subtype(value) {
      this.rawSubtypes = Array.isArray(value) ? value : []
      this.updateSubtypeOptions()
    },
    'selected.category': function () {
      this.updateSubtypeOptions()
    },
    selectedIdsByCategory: {
      deep: true,
      handler() { this.computeRows(); this.saveSelection() }
    },
    editsByAssetId: {
      deep: true,
      handler() { this.saveSelection() }
    },
    committedQtyByAssetId: {
      deep: true,
      handler() { this.saveSelection() }
    },
    caseData: function () {
      // Hydrate จาก report เฉพาะเมื่อยังไม่เคย hydrate สำหรับ caseKey นี้
      if (!this.hydratedFromReport || this.hydrationCaseKey !== this.caseKey) {
        this.hydrateFromReport()
      }
    }

  }
}

</script>

<style scoped>
.add-btn {
  background-color: #28a745;
  color: white;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: modalSlideIn 0.3s ease-out;
  border: none;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  min-height: 60px;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.modal-title {
  margin: 0;
  font-weight: bold;
  font-size: 1rem;
  flex: 1;
  margin-right: 4rem;
  display: flex;
  align-items: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: white;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-left: auto;
}

.close:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
  align-items: center;
  background: white;
}

.form-group {
  margin-bottom: 1rem;
  background: transparent;
  padding: 0;
  border: none;
}

.form-group label {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  line-height: 1.2;
  border-radius: 20px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: 1px solid;
}

.modal-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-btn.btn-outline-danger {
  border-color: #dc3545;
  color: #dc3545;
  background-color: transparent;
}

.modal-btn.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}

.modal-btn.btn-outline-success {
  border-color: #28a745;
  color: #28a745;
  background-color: transparent;
}

.modal-btn.btn-outline-success:hover {
  background-color: #28a745;
  color: white;
}

/* Modal asset row alignment */
.modal-asset-row {
  display: grid;
  grid-template-columns: 1fr 140px;
  align-items: center;
  gap: 16px;
  padding: 6px 8px;
}

.modal-asset-name {
  display: flex;
  align-items: center;
}

.modal-asset-checkbox {
  margin-right: 8px;
}

.asset-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qty-input {
  width: 120px;
}

.qty-input-table {
  max-width: 240px;
}

:deep(.qty-input-table .form-control) {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  height: calc(1.5em + 0.5rem + 2px);
  font-size: 0.8rem;
}

:deep(.qty-input-table .input-group-text) {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  height: calc(1.5em + 0.5rem + 2px);
  font-size: 0.8rem;
}

.asset-table-wrapper {
  position: relative;
  padding-bottom: 10px;
}

</style>
