const module = {
  namespaced: true,
  state: {
    description: '',
    media: [],
    mediaToSend: [],
    mediaAlreadySent: false,
    location: null,
    chatHistory: [],
    llmContextHistory: [],
    contact: { name: '', phone: '' },
    language: 'th',
    isListening: false,
    isSubmitting: false,
    lastReportText: '',
    currentMode: 'chat', // Default mode: chat for query + chat, report for emergency reporting
  },
  mutations: {
    setDescription(state, val) { state.description = val },
    setMedia(state, val) { state.media = val },
    setMediaToSend(state, val) { state.mediaToSend = val },
    setMediaAlreadySent(state, val) { state.mediaAlreadySent = val },
    setLocation(state, val) { state.location = val },
    setChatHistory(state, val) { state.chatHistory = val },
    addChatHistory(state, msg) { state.chatHistory.push(msg) },
    setLlmContextHistory(state, val) { state.llmContextHistory = val },
    addLlmContextHistory(state, msg) { state.llmContextHistory.push(msg) },
    setContact(state, val) { state.contact = val },
    setLanguage(state, val) { state.language = val },
    setIsListening(state, val) { state.isListening = val },
    setIsSubmitting(state, val) { state.isSubmitting = val },
    setLastReportText(state, val) { state.lastReportText = val },
    setCurrentMode(state, val) { state.currentMode = val },
    resetReportChat(state) {
      state.description = '';
      state.media = [];
      state.mediaToSend = [];
      state.mediaAlreadySent = false;
      state.location = null;
      state.chatHistory = [];
      state.llmContextHistory = [];
      state.contact = { name: '', phone: '' };
      state.isListening = false;
      state.isSubmitting = false;
      state.lastReportText = '';
      state.currentMode = 'chat';
    }
  },
  actions: {
    // ตัวอย่าง async action
    async fetchLocation({ commit }) {
      if (!navigator.geolocation) return;
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            commit('setLocation', loc);
            resolve(loc);
          },
          err => reject(err)
        );
      });
    }
  },
  getters: {
    description: state => state.description,
    media: state => state.media,
    mediaToSend: state => state.mediaToSend,
    mediaAlreadySent: state => state.mediaAlreadySent,
    location: state => state.location,
    chatHistory: state => state.chatHistory,
    llmContextHistory: state => state.llmContextHistory,
    contact: state => state.contact,
    language: state => state.language,
    isListening: state => state.isListening,
    isSubmitting: state => state.isSubmitting,
    lastReportText: state => state.lastReportText,
    currentMode: state => state.currentMode,
  }
}
export default module 