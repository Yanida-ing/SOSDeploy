import Service from "@/service/api";
import store from "@/store/store";

const getTitle = (obj) => obj?.title?.find(t => t.key === 'th')?.value || 'ไม่ระบุ';
const getValue = (obj, key) => obj?.[key] || 'ไม่ระบุ';

const filterReports = (reports, filter) => {
    return reports.filter(item => {
        const matchStatus = !filter.status || item.statusId === filter.status;
        const matchType = !filter.type || item.typeId === filter.type;
        const matchLevel = !filter.level || item.levelId === filter.level;
        if (!filter.status && !filter.type && !filter.level) {
            return matchStatus && matchType && matchLevel;
        }
        return matchStatus && matchType && matchLevel;
    });
};

const module = {
    namespaced: true,
    state: {
        reports: [],
        status: [],
        type: [],
        levels: [],
        filter: { status: null, type: null, level: null },
        loading: false,
        error: null
    },

    mutations: {
        reports(state, obj) {
            state.reports = obj;
        },
        status(state, obj) {
            state.status = obj;
        },
        type(state, obj) {
            state.type = obj;
        },
        levels(state, obj) {
            state.levels = obj;
        },
        filter(state, obj) {
            state.filter = obj;
        },
        loading(state, obj) {
            state.loading = obj;
        },
        error(state, obj) {
            state.error = obj;
        },
    },

    actions: {
        reports({commit}, data) {
            commit("loading", true);
            commit("error", null);
            
            Service.reports('get-reports', data, {})
                .then((response) => {
                    if(response.data && response.data.data) {
                        const reportItems = response.data.data.map((r, idx) => ({
                            _id: r._id,
                            taxTd: r._id?.slice(-6) || `RPT-${idx+1}`,
                            title: getTitle(r.type),
                            typeId: r.type?._id,
                            description: getValue(r, 'description'),
                            date: r.timeStamps || r.createdAt || 'ไม่ระบุ',
                            name: getValue(r.contact, 'name'),
                            mobile: getValue(r.contact, 'phone'),
                            location: getValue(r.location, 'address'),
                            user: getTitle(r.user),
                            status: getTitle(r.status),
                            statusId: r.status?._id,
                            level: getTitle(r.level),
                            levelId: r.level?._id,
                            caseManagement: r.caseManagement || {
                                isOpen: false,
                                openedBy: null,
                                openedAt: null,
                                openedReason: null,
                                closedBy: null,
                                closedAt: null,
                                closedReason: null,
                                caseHistory: []
                            }
                        }));
                        commit("reports", reportItems);
                    }
                }).catch((err) => {
                    console.error('Error fetching reports:', err);
                    commit("error", err);
                    commit("reports", []);
                }).finally(() => {
                    commit("loading", false);
                });
        },
        status({commit}, data) {
            Service.reports('get-statuses', data, {})
                .then((response) => {
                    store.commit("Dashboard/status", response.data.data)
                }).catch((err) => {
                    console.error('Error fetching status:', err);
                });
        },
        type({commit}, data) {
            Service.reports('get-types', data, {})
                .then((response) => {
                    store.commit("Dashboard/type", response.data.data)
                }).catch((err) => {
                    console.error('Error fetching type:', err);
                });
        },
        levels({commit}, data) {
            Service.reports('get-levels', data, {})
                .then((response) => {
                    store.commit("Dashboard/levels", response.data.data)
                }).catch((err) => {
                    console.error('Error fetching levels:', err);
                });
        },
        filter({commit}, data) {
            commit("filter", data);
        },
    },

    getters: {
        reports(state) {
            return state.reports;
        },
        status(state) {
            return state.status;
        },
        type(state) {
            return state.type;
        },
        levels(state) {
            return state.levels;
        },
        filter(state) {
            return state.filter;
        },
        loading(state) {
            return state.loading;
        },
        error(state) {
            return state.error;
        },
        filteredItems(state) {
            return filterReports(state.reports, state.filter);
        },
    },
};
export default module; 