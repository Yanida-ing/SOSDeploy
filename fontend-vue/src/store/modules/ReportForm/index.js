import axios from 'axios'
const module = {
  namespaced: true,
  state: {
    options: {
      type: [],
      disasterTypes: [],
      levels: []
    },
    select: {
      userType: '',
      disasterType: ''
    },
    form: {
      name: '',
      phone: '',
      description: '',
      location: ''
    },
    media: [],
    statusId: '',
    levelId: '',
    lat: null,
    lng: null,
    loadingUserType: false,
    loadingDisasterType: false
  },
  mutations: {
    setOptions(state, options) { state.options = { ...state.options, ...options } },
    setSelect(state, select) { state.select = { ...state.select, ...select } },
    setForm(state, form) { state.form = { ...state.form, ...form } },
    setMedia(state, media) { state.media = media },
    addMedia(state, mediaItem) { state.media.push(mediaItem) },
    removeMedia(state, idx) { state.media.splice(idx, 1) },
    setStatusId(state, id) { state.statusId = id },
    setLevelId(state, id) { state.levelId = id },
    setLat(state, lat) { state.lat = lat },
    setLng(state, lng) { state.lng = lng },
    setLoadingUserType(state, val) { state.loadingUserType = val },
    setLoadingDisasterType(state, val) { state.loadingDisasterType = val },
    resetForm(state) {
      state.select = { userType: '', disasterType: '' }
      state.form = { name: '', phone: '', description: '', location: '' }
      state.media = []
      state.lat = null
      state.lng = null
    }
  },
  actions: {
    async fetchUserTypes({ commit }) {
      commit('setLoadingUserType', true)
      try {
        const res = await axios.get('https://sos.mfu.ac.th/api/v1/report/usertype')
        const data = res.data
        commit('setOptions', {
          type: (data.data || []).map(t => ({
            label: t.title.find(tt => tt.key === 'th')?.value,
            value: t._id
          }))
        })
      } catch (e) {
        commit('setOptions', { type: [] })
      }
      commit('setLoadingUserType', false)
    },
    async fetchDisasterTypes({ commit }) {
      commit('setLoadingDisasterType', true)
      try {
        const res = await axios.get('https://sos.mfu.ac.th/api/v1/report/type')
        const data = res.data
        commit('setOptions', {
          disasterTypes: (data.data || []).map(t => ({
            label: t.title.find(tt => tt.key === 'th')?.value,
            value: t._id
          }))
        })
      } catch (e) {
        commit('setOptions', { disasterTypes: [] })
      }
      commit('setLoadingDisasterType', false)
    },
    async fetchStatus({ commit }) {
      try {
        const res = await axios.get('https://sos.mfu.ac.th/api/v1/report/status')
        const data = res.data
        const pending = (data.data || []).find(s =>
          s.title.find(t => t.key === 'th' && t.value === 'รอดำเนินการ')
        )
        if (pending) {
          commit('setStatusId', pending._id)
        } else {
          commit('setStatusId', '')
        }
      } catch (e) {
        commit('setStatusId', '')
      }
    },
    async fetchLevel({ commit }) {
      try {
        const res = await axios.get('https://sos.mfu.ac.th/api/v1/report/level')
        const data = res.data
        const medium = (data.data || []).find(l =>
          l.title.find(t => t.key === 'th' && t.value.trim() === 'ระดับกลาง')
        )
        if (medium) {
          commit('setLevelId', medium._id)
        } else if ((data.data || []).length > 0) {
          commit('setLevelId', data.data[0]._id)
        } else {
          commit('setLevelId', '')
        }
      } catch (e) {
        commit('setLevelId', '')
      }
    }
  },
  getters: {
    options: state => state.options,
    select: state => state.select,
    form: state => state.form,
    media: state => state.media,
    statusId: state => state.statusId,
    levelId: state => state.levelId,
    lat: state => state.lat,
    lng: state => state.lng,
    loadingUserType: state => state.loadingUserType,
    loadingDisasterType: state => state.loadingDisasterType
  }
}
export default module 