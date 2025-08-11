'use strict'

import Service from '@/service/api'

const module = {
  namespaced: true,
  state: {
    assets: [],
    category: [],
    subtype: [],
    loading: false,
    error: null,
  },

  mutations: {
    assets(state, payload) {
      state.assets = payload
    },
    category(state, payload) {
      state.category = payload
    },
    subtype(state, payload) {
      state.subtype = payload
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    },
  },

  actions: {
    assets({ commit }, data) {
      commit('setLoading', true)
      commit('setError', null)
      return Service.assets('assets', data, {})
        .then((response) => {
          commit('assets', response.data.data)
          commit('setLoading', false)
        })
        .catch((err) => {
          console.error('Error fetching assets:', err)
          commit('setError', err.message || 'Error fetching assets')
          commit('setLoading', false)
        })
    },
    category({ commit }, data) {
      commit('setLoading', true)
      commit('setError', null)
      return Service.assets('category', data, {})
        .then((response) => {
          commit('category', response.data.data)
          commit('setLoading', false)
        })
        .catch((err) => {
          console.error('Error fetching asset categories:', err)
          commit('setError', err.message || 'Error fetching categories')
          commit('setLoading', false)
        })
    },
    subtype({ commit }, data) {
      commit('setLoading', true)
      commit('setError', null)
      return Service.assets('subtype', data, {})
        .then((response) => {
          commit('subtype', response.data.data)
          commit('setLoading', false)
        })
        .catch((err) => {
          console.error('Error fetching asset subtypes:', err)
          commit('setError', err.message || 'Error fetching subtypes')
          commit('setLoading', false)
        })
    },

    create({ dispatch }, data) {
      return Service.assets('create', data, {})
        .then(() => dispatch('assets'))
        .catch((err) => {
          console.error('Error creating asset:', err)
          throw err
        })
    },
    update({ dispatch }, data) {
      return Service.assets('update', data, {})
        .then(() => dispatch('assets'))
        .catch((err) => {
          console.error('Error updating asset:', err)
          throw err
        })
    },
    remove({ dispatch }, payload) {
      // payload can be a single id (string) or an array of ids
      const requestData = Array.isArray(payload) ? { id: payload } : { id: payload }
      return Service.assets('delete', requestData, {})
        .then(() => dispatch('assets'))
        .catch((err) => {
          console.error('Error deleting asset(s):', err)
          throw err
        })
    },
  },

  getters: {
    assets(state) {
      return state.assets
    },
    category(state) {
      return state.category
    },
    subtype(state) {
      return state.subtype
    },
    loading(state) {
      return state.loading
    },
    error(state) {
      return state.error
    },
  },
}

export default module


