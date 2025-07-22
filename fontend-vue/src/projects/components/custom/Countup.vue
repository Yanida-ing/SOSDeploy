<template>
  <div>
    <p class="font-weight-bold text-right"> ️ ผ่านไปแล้ว: {{ elapsedTime }} </p>
  </div>
</template>

<script>

import moment from 'moment';
export default {
  name: 'Countup',
  props: {
    start: { type: Date, required: true, default: Date.now }, // กำหนดเวลาต้นทาง
    name: { type: String, required: true }, // เช่น 'mfu-home'
    size: { type: String, default: 'md' }
  },
  data () {
    return {
      now: moment(),
      timer: null
    }
  },
  computed: {
    elapsedTime() {
      const duration = moment.duration(this.now.diff(this.start));
      const minutes = Math.floor(duration.asMinutes());
      const seconds = duration.seconds();
      return `${minutes} นาที ${seconds} วินาที`;
    }
  },
  mounted() {
    this.timer = setInterval(() => {
      this.now = moment();
    }, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
  }
}
</script>
