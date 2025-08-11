import Service from "@/service/api";
import store from "@/store/store";
import moment from "moment";

const module = {
    namespaced: true,
    state: {
        history: [],
        slaTimer: null,
        timerValue: Date.now() // เพิ่ม state สำหรับ timer value
    },

    mutations: {
        history(state, obj) {
            state.history = obj;
        },
        slaTimer(state, obj) {
            state.slaTimer = obj;
        },
        timerValue(state, obj) {
            state.timerValue = obj;
        }
    },

    actions: {
        history({commit}, data) {
            commit("history", data);
        },
        startSlaTimer({ commit, dispatch }) {
            const timer = setInterval(() => {
                // อัพเดท timer value เพื่อ trigger reactivity
                commit('timerValue', Date.now());
            }, 10000); // ลดเป็น 10 วินาที เพื่อให้สีเปลี่ยนเร็วขึ้น
            commit('slaTimer', timer);
        },
        stopSlaTimer({ state, commit }) {
            if (state.slaTimer) {
                clearInterval(state.slaTimer);
                commit('slaTimer', null);
            }
        },
    },

    getters: {
        history(state) {
            return state.history;
        },
        slaTimer(state) {
            return state.slaTimer;
        },
        timerValue(state) {
            return state.timerValue;
        }
    },
};
export default module;