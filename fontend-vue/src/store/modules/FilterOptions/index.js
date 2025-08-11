import Service from "@/service/api";

const module = {
    namespaced: true,
    state: {
        status: [],
        type: [],
        levels: [],
    },

    mutations: {
        status(state, obj) {
            state.status = obj;
        },
        type(state, obj) {
            state.type = obj;
        },
        levels(state, obj) {
            state.levels = obj;
        },
    },

    actions: {
        status({commit}, data) {
            Service.reports('get-statuses', data, {})
                .then((response) => {
                    commit("status", response.data.data)
                }).catch((err) => {
                    console.error('Error fetching status:', err);
                });
        },
        type({commit}, data) {
            Service.reports('get-types', data, {})
                .then((response) => {
                    commit("type", response.data.data)
                }).catch((err) => {
                    console.error('Error fetching type:', err);
                });
        },
        levels({commit}, data) {
            Service.reports('get-levels', data, {})
                .then((response) => {
                    commit("levels", response.data.data)
                }).catch((err) => {
                    console.error('Error fetching levels:', err);
                });
        },
    },

    getters: {
        status(state) {
            return state.status;
        },
        type(state) {
            return state.type;
        },
        levels(state) {
            return state.levels;
        },
    },
};
export default module; 