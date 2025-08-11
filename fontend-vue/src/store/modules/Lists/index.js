import Service from "@/service/api";
import store from "@/store/store";

const module = {
    namespaced: true,
    state: {
        campus: [],
        facultys: [],
    },

    mutations: {
        campus(state, obj) {
            state.campus = obj;
        },
        facultys(state, obj) {
            state.facultys = obj;
        },
    },

    actions: {
        campus({commit}, data) {
            Service.campus('get', data, {})
                .then((response) => {
                    store.commit("Lists/campus", response.data.data)
                }).catch((err) => {
                    console.error('Error fetching campus:', err);
                });
        },
        facultys({commit}, data) {
            Service.facultys('get', data, {})
                .then((response) => {
                    store.commit("Lists/facultys", response.data.data)
                }).catch((err) => {
                    console.error('Error fetching facultys:', err);
                });
        },
    },

    getters: {
        campus(state) {
            return state.campus;
        },
        facultys(state) {
            return state.facultys;
        },
    },
};
export default module; 