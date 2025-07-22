const module = {
    namespaced: true,
    state: {
        lang : "en",


    },

    mutations: {
        lang(state, obj) {
            state.lang = obj;
        },
    },

    actions: {

    },

    getters: {
        lang(state, obj) {
            return state.lang;
        },

    },
};
export default module;
