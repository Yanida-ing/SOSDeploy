import Service from "@/service/api";

const module = {
    namespaced: true,
    state: {
        case: null,
        items: [{
            name: "น้ำดื่ม",
            total: 1000,
            request: 0
        }],
        cars: [{
            name: "รถพญาบาล",
            total: 1000,
            request: 0
        }]
    },

    mutations: {
        case(state, obj) {
            state.case = obj;
        },
        items(state, obj) {
            state.items = obj;
        },
        cars(state, obj) {
            state.cars = obj;
        }
    },

    actions: {
        case({commit}, data) {
            if (data && data.id) {
                Service.caseManagement('get-detail', data, {})
                    .then((response) => {
                        if (response.data && response.data.data) {
                            commit("case", response.data.data);
                        }
                    }).catch((err) => {
                        console.error('Error fetching case detail:', err);
                        commit("case", null);
                    });
            } else {
                commit("case", data);
            }
        },
        openCase({commit, dispatch, rootDispatch}, data) {
            return Service.caseManagement('open-case', data, {})
                .then((response) => {
                    if (response.data.success) {
                        // อัพเดท case detail ปัจจุบัน
                        dispatch("case", { id: data.caseId });
                        // อัพเดท reports list ใน Dashboard
                        dispatch("Dashboard/reports", {}, { root: true });
                        return response;
                    }
                }).catch((err) => {
                    console.error('Error opening case:', err);
                    throw err;
                });
        },
        closeCase({commit, dispatch, rootDispatch}, data) {
            return Service.caseManagement('close-case', data, {})
                .then((response) => {
                    if (response.data.success) {
                        // อัพเดท case detail ปัจจุบัน
                        dispatch("case", { id: data.caseId });
                        // อัพเดท reports list ใน Dashboard
                        dispatch("Dashboard/reports", {}, { root: true });
                        return response;
                    }
                }).catch((err) => {
                    console.error('Error closing case:', err);
                    throw err;
                });
        },
        items({commit}, data) {
            commit("items", data);
        },
        cars({commit}, data) {
            commit("cars", data);
        }
    },

    getters: {
        case(state) {
            return state.case;
        },
        items(state) {
            return state.items;
        },
        cars(state) {
            return state.cars;
        }
    },
};
export default module;