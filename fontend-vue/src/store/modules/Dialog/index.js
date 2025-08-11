import router from "@/router";
import store from "@/store/store";

const DialogModule = {
  namespaced: true,
  state: {
    dialog: {
      message: "asdsadsad",
      code:"20000",
      number :"1",
      status:false
    },
    loading:false,
    message:0,
    isDisaters: false, // เพิ่ม state สำหรับ disaster dialog

  },

  mutations: {

    loading(state, data) {
      state.loading = data
    },

    message(state, data) {
      state.message = data
    },

    dialog(state, data) {
      state.dialog = data
    },

    isDisaters(state, data) {
      state.isDisaters = data
    },
  },

  actions: {

  },

  getters: {

    loading(state) {
      return state.loading
    },

    message(state) {
      return state.message
    },

    dialog(state) {
      return state.dialog
    },

    isDisaters(state) {
      return state.isDisaters
    }
  },
};

export default DialogModule;
