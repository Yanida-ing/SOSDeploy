<template>
  <CCard class="bg-style2">
    <CCardBody>
      <GmapMap
        :center="mapCenter"
        :zoom="14"
        style="height: 400px"
        @click='addMarker'
        :options="{
         zoomControl: false,
         mapTypeControl: false,
         scaleControl: true,
         streetViewControl: true,
         rotateControl: false,
         fullscreenControl: true,
         disableDefaultUI: false
       }"
      >
        <GmapMarker
          :key="index"
          v-for="(m, index) in mapMarkers"
          :position="m.position"
          :label="m.label"
          :title="m.title"
          :clickable="true"
          :draggable="m.draggable"
          @click="handleToggleInfoWindow(m, index)"
        />
        
        <GmapInfoWindow
          :options="infoOptions"
          :position="infoWindowPos"
          :opened="infoWinOpen"
          @closeclick="closeInfoWindow"
        >
          <div>
            <h6>{{ infoContent }}</h6>
            <p>{{ displayAddress }}</p>
            <a v-if="infoLink" :href="infoLink" target="_blank">ดูรายละเอียด</a>
          </div>
        </GmapInfoWindow>
      </GmapMap>
    </CCardBody>
  </CCard>
</template>

<script>
import * as VueGoogleMaps from 'vue2-google-maps'
import Vue from 'vue'
import { mapGetters } from 'vuex';

Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyASyYRBZmULmrmw_P9kgr7_266OhFNinPA'
  }
})

export default {
  name: 'google-maps',
  props: {

  },

  data() {
    return {
      geocoder: null,
      mapMarkers: [],
      infoContent: '',
      infoLink: '',
      infoWindowPos: { lat: 0, lng: 0 },
      infoWinOpen: false,
      currentMidx: null,
      infoOptions: {
        pixelOffset: { width: 0, height: -35 }
      },
      mapCenter: { lng: 99.893572, lat: 20.045000 },
      displayAddress: 'ไม่ระบุที่อยู่'
    }
  },

  created() {
    this.onInit();
  },

  methods: {
    onInit() {
      this.updateMapFromCaseData();
    },

    updateMapFromCaseData() {
      this.updateDisplayData();
      this.updateMapMarkers();
      this.$emit('map-updated', { 
        location: this.caseData?.location 
      });
    },

    // อัพเดท local data จาก caseData
    updateDisplayData() {
      if (this.caseData && this.caseData.location) {
        const location = this.caseData.location;
        if (location.coordinates && location.coordinates.length === 2) {
          this.mapCenter = {
            lng: location.coordinates[0],
            lat: location.coordinates[1]
          };
        } else {
          this.mapCenter = { lng: 99.893572, lat: 20.045000 };
        }
        this.displayAddress = location.address || 'ไม่ระบุที่อยู่';
      } else {
        this.mapCenter = { lng: 99.893572, lat: 20.045000 };
        this.displayAddress = 'ไม่ระบุที่อยู่';
      }
    },

    updateMapMarkers() {
      if (this.caseData && this.caseData.location && this.caseData.location.coordinates && this.caseData.location.coordinates.length === 2) {
        const coordinates = this.caseData.location.coordinates;
        this.mapMarkers = [{
          position: { 
            lat: coordinates[1], 
            lng: coordinates[0] 
          },
          label: 'C',
          draggable: false,
          title: 'ตำแหน่งเหตุการณ์',
        }];
      } else {
        this.mapMarkers = [];
      }
    },

    handleToggleInfoWindow(marker, idx) {
      this.infoWindowPos = marker.position;
      this.infoContent = marker.title;
      this.infoLink = marker.www;
      
      if (this.currentMidx === idx) {
        this.infoWinOpen = !this.infoWinOpen;
      } else {
        this.currentMidx = idx;
        this.infoWinOpen = true;
      }
      
      this.$emit('info-window-toggled', { marker, idx });
    },

    closeInfoWindow() {
      this.infoWinOpen = false;
      this.currentMidx = null;
    },

    addMarker(event) {
      const marker = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      console.log(marker);
      this.geocoder = new google.maps.Geocoder();
      this.geocoder.geocode({'location': event.latLng}, (results, status) => {
        if (status === 'OK') {
          if (results[0]) {
            console.log('Address:', results[0].formatted_address);
            this.$emit('marker-added', {
              position: marker,
              address: results[0].formatted_address
            });
          }
        } else {
          console.error('Geocoder failed due to:', status);
        }
      });
    }
  },

  computed: {
    ...mapGetters({
      // lang: 'setting/lang',
      // รับข้อมูลโดยตรงจาก Dashboard2 store
      caseData: 'Dashboard2/case',
    })
  },

  watch: {
    caseData: function (value) {
      var lang = this.$store.getters['setting/lang'];
      this.updateMapFromCaseData();
    },

    // lang: function (value) {
    //   var lang = this.$store.getters['setting/lang'];
    //   this.$emit('language-changed', value);
    // }
  }
}
</script>
