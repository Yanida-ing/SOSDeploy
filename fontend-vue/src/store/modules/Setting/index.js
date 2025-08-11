import Service from "@/service/api";
import store from "@/store/store";

const module = {
    namespaced: true,
    state: {
        lang: "th",
        loading: false,
        error: null
    },

    mutations: {
        lang(state, obj) {
            state.lang = obj;
        },
        loading(state, obj) {
            state.loading = obj;
        },
        error(state, obj) {
            state.error = obj;
        }
    },

    actions: {
        lang({commit}, data) {
            commit("lang", data);
        },
        loading({commit}, data) {
            commit("loading", data);
        },
        error({commit}, data) {
            commit("error", data);
        }
    },

    getters: {
        lang(state) {
            return state.lang;
        },
        loading(state) {
            return state.loading;
        },
        error(state) {
            return state.error;
        }
    },
};
export default module;
