<template>
  <div>
    <CTabs class=" pb-0"  fill >
      <CTab >
        <template slot="title">
          <CIcon name="cil-speech"/> AI Report
        </template>
        <CRow>
          <CCol>
            <ReportChat />
          </CCol>
        </CRow>
      </CTab>
      <CTab >
        <template slot="title">
          <CIcon name="cil-clipboard"/> แบบฟอร์ม
        </template>
        <CRow>
          <CCol>
            <ReportForm/>
          </CCol>
        </CRow>
      </CTab>
    </CTabs>
  </div>
</template>

<script>
import ReportForm from './components/ReportForm.vue'
import ReportChat from './components/ReportChat.vue'

export default {
  name: 'Report',
  components: {
    ReportForm,
    ReportChat,
  },
  data() {
    return {
      mode: 'form' // เริ่มต้นเป็นแบบ form
    }
  }
}
</script>

<style scoped>
.report-page {
  max-width: 700px;
  margin: auto;
  padding: 20px;
}

.card-header-tabs {
  border-bottom: none;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  gap: 1.5rem;
}

.nav-tabs .nav-link {
  border: none;
  background: none;
  color: #b71c1c;
  font-size: 1.15rem;
  font-weight: 500;
  padding: 0.7rem 1.6rem;
  border-radius: 1rem 1rem 0 0;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  margin-right: 0.5rem;
  box-shadow: none;
  position: relative;
}

.nav-tabs .nav-link.active {
  background: #fff;
  color: #d32f2f;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(211,47,47,0.08);
  border-bottom: 3px solid #d32f2f;
  z-index: 2;
}

.nav-tabs .nav-link:not(.active):hover {
  background: #fbe9e7;
  color: #b71c1c;
  box-shadow: 0 2px 8px rgba(211,47,47,0.06);
}

CCard {
  border-radius: 1.2rem;
  box-shadow: 0 6px 32px rgba(211,47,47,0.10);
  border: none;
  background: #fafafa;
}

CCardHeader {
  background: linear-gradient(90deg, #d32f2f 0%, #b71c1c 100%);
  color: #fff;
  border-radius: 1.2rem 1.2rem 0 0;
  padding: 1.2rem 2rem 0.7rem 2rem;
  border-bottom: none;
  box-shadow: 0 2px 8px rgba(211,47,47,0.10);
}

CCardBody {
  padding: 2.2rem 2rem 2rem 2rem;
  background: #fff;
  border-radius: 0 0 1.2rem 1.2rem;
  min-height: 65vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

h4 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.7rem;
  color: #fff;
  letter-spacing: 0.5px;
}

@media (max-width: 900px) {
  .report-page {
    padding: 8px;
  }
  .card-header-tabs {
    gap: 0.5rem;
    /* flex-direction: row; */
    /* align-items: center; */
    /* ไม่เปลี่ยนเป็น column */
  }
  CCardBody {
    padding: 1.2rem 0.5rem 1rem 0.5rem;
    min-height: 50vh;
  }
  CCardHeader {
    padding: 1rem 0.5rem 0.5rem 0.5rem;
  }
}
@media (max-width: 600px) {
  h4 {
    font-size: 1.2rem;
  }
  .card-header-tabs {
    gap: 0.2rem;
    padding-left: 0.2rem;
    padding-right: 0.2rem;
  }
  .nav-tabs .nav-link {
    padding: 0.5rem 0.7rem;
    font-size: 1rem;
    min-width: 90px;
  }
}
</style>
