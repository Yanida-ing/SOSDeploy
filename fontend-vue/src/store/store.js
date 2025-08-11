import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import DialogMessages from "./modules/Dialog/index";
import Setting from './modules/Setting/index'
import Auth from "./modules/Authen/index";
import ReportChat from "./modules/ReportChat/index";
import ReportForm from "./modules/ReportForm/index";
import Dashboard2 from './modules/Dashboard2/Dashboard2';
import Dashboard from './modules/Dashboard/Dashboard';
import History from './modules/History/History';
import FilterOptions from './modules/FilterOptions/index';
import Lists from './modules/Lists/index';
import Assets from './modules/Assets/index';

const state = {
  sidebarShow: 'responsive',
  sidebarMinimize: false,
  asideShow: false,
  darkMode: false
}

const mutations = {
  toggleSidebarDesktop (state) {
    const sidebarOpened = [true, 'responsive'].includes(state.sidebarShow)
    state.sidebarShow = sidebarOpened ? false : 'responsive'
  },
  toggleSidebarMobile (state) {
    const sidebarClosed = [false, 'responsive'].includes(state.sidebarShow)
    state.sidebarShow = sidebarClosed ? true : 'responsive'
  },
  set (state, [variable, value]) {
    state[variable] = value
  },
  toggle (state, variable) {
    state[variable] = !state[variable]
  }
}


export default new Vuex.Store({
  state,
  mutations,
  modules : {
    dialog: DialogMessages,
    setting : Setting,
    ReportChat : ReportChat,
    ReportForm : ReportForm,
    auth : Auth,
    Dashboard2 :Dashboard2,
    Dashboard : Dashboard,
    History : History,
    FilterOptions : FilterOptions,
    Lists : Lists,
    Assets: Assets,
  }
});
