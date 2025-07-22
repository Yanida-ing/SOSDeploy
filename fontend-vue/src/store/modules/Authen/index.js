import store from "@/store/store";
import Service from "@/service/api";
// ในไฟล์ store/modules/auth.js (หรือที่คุณเก็บ action อยู่)
import { setItem, getItem } from '@/utils/db';   // ← ดึงฟังก์ชันที่เพิ่งสร้างมาใช้
import router from "../../../router/index.js";


const ServerModule = {
    namespaced: true,
    state: {
        authenticated: {
            isAuthen: false,
            isOAuth: false,
        },
        message:[],
    },

    modules: {

    },

    mutations: {

        message(state, obj) {
            state.message = obj;
        },

    },

    actions: {
        message({commit}, data) {

            Service.authenticated('message', data, {})
                .then((response) => {
                    store.commit("auth/message", response.data.data)
                }).catch((err) => {

            });
        },

        createMessage({commit}, data) {

            Service.authenticated('create-message', data, {})
                .then((response) => {
                    store.commit("auth/message", response.data.data);
                    store.dispatch("auth/message",{});
                }).catch((err) => {
            });
        },


        updateMessage({commit}, data) {
            Service.authenticated('update-message', data, {})
                .then((response) => {
                    store.commit("auth/message", response.data.data);
                    store.dispatch("auth/message",{});
                }).catch((err) => {
            });
        },

        removeMessage({commit}, data) {
            Service.authenticated('remove-message', data)
                .then((response) => {
                    store.commit("auth/message", response.data.data);
                    store.dispatch("auth/message",{});
                }).catch((err) => {
            });
        },


        signIn({commit}, data) {
            store.commit("dialog/loading", true);


            Service.authenticated('signin', data, {})
                .then(async (response) => {
                    // 1. เซฟข้อมูลลง IndexedDB แทน localStorage
                    const objs = response.data.data;         // ไม่ต้อง JSON.stringify ก็ได้ idb จะ serialize ให้
                    await setItem('objs', objs);
                    store.commit("dialog/loading", false);

                    router.push('/dashboard');

                }).catch((err) => {


                store.commit("dialog/loading",false)

                // var dialog = {
                //     message: "Username และ Password ไม่ถูกต้อง",
                //     code:"40100",
                //     number :"1",
                //     status:true
                // }
                // store.commit("dialog/dialog",dialog)

            });
        },

        signOut({commit}, data) {
            Service.authen('signOut', data, {})
                .then((response) => {
                    store.commit("authen/profile", {})
                }).catch((err) => {

            });
        },

    },

    getters: {

        message(state) {
            return state.message;
        },

        authenticated(state) {
            return state.authenticated;
        },
    },
};

export default ServerModule;
