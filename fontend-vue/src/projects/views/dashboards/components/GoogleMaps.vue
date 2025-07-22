<template>
  <CCard class="bg-style2">
<!--    <CCardHeader class="bg-gradient-danger text-white" style="border-top-left-radius: 1rem; border-top-right-radius: 1rem ">-->
<!--      <span class="font-weight-bold h6"><CIcon name="cil-building" size="lg"/> {{ caption }}</span>-->
<!--      <div class="card-header-actions">-->
<!--      </div>-->
<!--    </CCardHeader>-->

    <CCardBody>
      <GmapMap
        :center="center"
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
<!--        <GmapInfoWindow :options="infoOptions" :position="infoWindowPos" :opened="infoWinOpen" @closeclick="infoWinOpen=false">-->
<!--          <CLink :href="infoLink" target="_blank">{{infoContent}}</CLink>-->
<!--        </GmapInfoWindow>-->
        <GmapMarker
          :key="index"
          v-for="(m, index) in markers"
          :position="m.position"
          :label="m.label"
          :title="m.title"
          :clickable="true"
          :draggable="m.draggable"
          @click="toggleInfoWindow(m, index)"
        />
      </GmapMap>
    </CCardBody>
  </CCard>
</template>

<script>
import * as VueGoogleMaps from 'vue2-google-maps'
import Vue from 'vue'

Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyASyYRBZmULmrmw_P9kgr7_266OhFNinPA'
    // key: ''
    // To use the Google Maps JavaScript API, you must register your app project on the Google API Console and get a Google API key which you can add to your app
    // v: 'OPTIONAL VERSION NUMBER',
    // libraries: 'places', //// If you need to use place input
  }
})

export default {
  name: 'google-maps',
  props: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    location: { type: Object, default: null }, // รองรับ object {lat, lng}
  },
  data () {
    return {
      center: {lng: 99.893572,lat: 20.045000},
      markers: [],
      infoContent: '',
      infoLink: '',
      infoWindowPos: {
        lat: 0,
        lng: 0
      },
      infoWinOpen: false,
      currentMidx: null,
      // optional: offset infowindow so it visually sits nicely on top of our marker
      infoOptions: {
        pixelOffset: {
          width: 0,
          height: -35
        }
      },
    }
  },
  watch: {
    lat: 'updateMap',
    lng: 'updateMap',
    location: {
      handler: 'updateMap',
      deep: true
    }
  },
  mounted() {
    this.updateMap();
  },
  methods: {
    updateMap() {
      let lat = this.lat;
      let lng = this.lng;
      if (this.location && typeof this.location.lat === 'number' && typeof this.location.lng === 'number') {
        lat = this.location.lat;
        lng = this.location.lng;
      }
      if (typeof lat === 'number' && typeof lng === 'number') {
        this.center = { lat, lng };
        this.markers = [{
          position: { lat, lng },
          label: 'C',
          draggable: false,
          title: 'ตำแหน่งเหตุการณ์',
        }];
      }
    },
    toggleInfoWindow (marker, idx) {
      this.infoWindowPos = marker.position
      this.infoContent = marker.title
      this.infoLink = marker.www
      // check if its the same marker that was selected if yes toggle
      if (this.currentMidx === idx) {
        this.infoWinOpen = !this.infoWinOpen
      } else {
        // if different marker set infowindow to open and reset current marker index
        this.currentMidx = idx
        this.infoWinOpen = true
      }
    },
    addMarker(event) {
      const marker = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),

      };
      console.log(marker);
      // this.markers.push({ position: marker });
      // this.$refs.mmm.panTo(marker);
      //this.center = marker;


      this.geocoder = new google.maps.Geocoder();
      this.geocoder.geocode({'location': event.latLng}, (results, status) => {
        // showing how you would grab the first address...
        const firstAddress = results[0].formatted_address;

        eventBus.$emit('mapAddress', results);
      });
    },
  }
}
</script>
