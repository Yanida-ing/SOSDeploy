<template>
    <div>
        <CModal
            :show.sync="isDisaters"
            add-content-classes="test"
            color="danger"
            :centered="true"
            :close-on-backdrop="false"
        >
          <template #header-wrapper>
            <div ></div>
          </template>
          <template #body-wrapper>
          </template>
          <template #footer-wrapper>
            <div class=""></div>
          </template>
        </CModal>
    </div>
</template>

<script>

import {mapGetters} from 'vuex'
import QEditor from "@/projects/components/Util/QEditor.vue";
import VueQuillEditor from 'vue-quill-editor'
import 'quill/dist/quill.snow.css'

import Vue from 'vue'
import Multiselect from "vue-multiselect";
import 'vue-multiselect/dist/vue-multiselect.min.css'
Vue.use(VueQuillEditor)

export default {
  name: 'CDisasters',
  components: { Multiselect, QEditor},
    data: function () {
        return {
        }
    },
    mounted() {

    },

    created() {
    },

    beforeDestroy() {

    },

    methods: {


    },

    computed: {
        ...mapGetters({
          isDisaters: "dialog/isDisaters",
        })
    },

    watch: {

    }
}
</script>

