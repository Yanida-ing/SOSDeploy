import axios from 'axios';
import store from '@/store/store'
const instance = axios.create();

// ใช้ baseURL จาก environment variable ถ้ามี ไม่งั้น fallback เป็น localhost
instance.defaults.baseURL = process.env.VUE_APP_API_BASE_URL || 'http://127.0.0.1:8081';
// instance.defaults.timeout = 5000;

instance.defaults.headers = {
  "Content-Type": "application/json",
  // "Api-version": "1.0",
  // "X-Access-Token": "12e8ab2bb3eba6295fe28cb989f7d8973ccf0840a67973fda2d1206a2191c3b6",
}




// เพิ่ม request interceptor
// instance.interceptors.request.use(
//     (config) => {
//       const token = `${store.state.XAccessToken}`;
//       if (token) {
//         config.headers.Authorization = `Bearer ${store.state.XAccessToken}`;
//       }
//
//       config.headers.lang  = `${store.getters['setting/lang']}`;
//       return config;
//     },
//     (error) => {
//       return Promise.reject(error);
//     }
// );

// เพิ่ม Interceptor สำหรับ Response
instance.interceptors.response.use(
    (response) => {
      // คืนค่าปกติหาก response สำเร็จ
      return response;
    },
    (error) => {
      // ตรวจสอบสถานะ 401
      if (error.response && error.response.status === 401) {
        // แสดง Dialog หรือ Popup
        router.push('/login');
      }
      return Promise.reject(error);
    }
);

export default {

  onSetToken: (token) => {

  },


  campus(method, data, configs) {
    switch (method){
      case 'exp':
        return instance.post("/api/v1/setting/explore/campus", data);
      case 'get':
        return instance.get("/api/v1/setting/campus", data);
      case 'post':
        delete data._id;
        return instance.post("/api/v1/setting/campus", data);
      case 'put':
        return instance.put("/api/v1/setting/campus", data);
      case 'delete':
        return instance.delete("/api/v1/setting/campus", data);
      default:
        break;
    }
  },

  facultys(method, data, configs) {
    switch (method){
      case 'get':
        return instance.get("/api/v1/setting/faculty", data);
      case 'post':
        delete data._id;
        return instance.post("/api/v1/setting/faculty", data);
      case 'put':
        return instance.put("/api/v1/setting/faculty", data);
      case 'delete':
        return instance.delete("/api/v1/setting/faculty", data);
      default:
        break;
    }
  },

  departments(method, data, configs) {
    switch (method){
      case 'exp':
        return instance.post("/api/v1/explore/departments", data);
      case 'get':
        return instance.get("/api/v1/setting/department", data);
      case 'post':
        delete data._id;
        return instance.post("/api/v1/setting/department", data);
      case 'put':
        return instance.put("/api/v1/setting/department", data);
      case 'delete':
        return instance.delete("/api/v1/setting/department", data);
      default:
        break;
    }
  },



  members(method, data, configs) {
    switch (method){
      case 'exp':
        return instance.post("/api/v1/explore/profile",data);

      default:
        break;
    }
  },


  //
  roles(method, data, configs) {
    switch (method){
      case 'exp':
        return instance.get("/api/v1/setting/role",data);
      case 'post':
        return instance.post("/api/v1/setting/role",data);
      case 'put':
        return instance.put("/api/v1/setting/role",data);

      default:
        break;
    }
  },


  authenticated(method, data, configs) {
    switch (method){
      case 'signin':
        return instance.get("/api/v1/signin",data);
      case 'message':
        return instance.get("/api/v1/setting/auth/message",data);
      case 'create-message':
        return instance.post("/api/v1/setting/auth/message",data);
      case 'update-message':
        return instance.put("/api/v1/setting/auth/message",data);
      case 'remove-message':
        return instance.delete("/api/v1/setting/auth/message", data);


      default:
        break;
    }
  },
  
  // Chat APIs
  chat(userId, message) {
    return instance.post('/api/v1/chat/chat', { userId, message });
  },

  // Case Management APIs
  caseManagement(method, data, configs) {
    switch (method){
      case 'get-detail':
        return instance.get(`/api/v1/report/${data.id}`, data);
      case 'open-case':
        return instance.post(`/api/v1/report/${data.caseId}/open`, data);
      case 'close-case':
        return instance.post(`/api/v1/report/${data.caseId}/close`, data);
      case 'get-history':
        return instance.get(`/api/v1/case/history/${data.caseId}`, data);
      case 'get-case-status':
        return instance.get(`/api/v1/case/status/${data.caseId}`, data);
      case 'set-assets':
        return instance.put(`/api/v1/report/${data.id}/assets`, { assets: data.assets });
      default:
        break;
    }
  },

  // Dashboard APIs
  reports(method, data, configs) {
    switch (method){
      case 'get-reports':
        return instance.get('/api/v1/report/', data);
      case 'get-types':
        return instance.get('/api/v1/report/type', data);
      case 'get-levels':
        return instance.get('/api/v1/report/level', data);
      case 'get-statuses':
        return instance.get('/api/v1/report/status', data);
      default:
        break;
    }
  },

  // Assets APIs
  assets(method, data, configs) {
    switch (method){
      case 'assets':
        return instance.get('/api/v1/assets/assets', data);
      case 'category':
        return instance.get('/api/v1/assets/category', data);
      case 'subtype':
        return instance.get('/api/v1/assets/subtype', data);
      case 'create':
        return instance.post('/api/v1/assets/assets', data);
      case 'update':
        return instance.put('/api/v1/assets/assets', data);
      case 'delete':
        return instance.delete('/api/v1/assets/assets', { data: data });
      default:
        break;
    }
  },


}
