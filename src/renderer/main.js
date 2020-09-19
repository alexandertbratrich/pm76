import Vue from 'vue'

import App from './App'
import router from './router'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

Vue.mixin({
  methods: {
    dateDifference (date1, date2) {
      // in days
      let d1 = new Date(date1)
      let d2 = new Date(date2)
      if ((date1 === undefined || date1 === '') && (date2 === undefined || date2 === '')) return undefined
      if (date1 === undefined || date1 === '') d1 = new Date()
      if (date2 === undefined || date2 === '') d2 = new Date()
      let diff = d2 - d1
      return Math.floor(diff / 1000 / 60 / 60 / 24)
    },
    textualDateDifference (date1, date2) {
      let d1 = new Date(date1)
      let d2 = new Date(date2)
      if (date1 === undefined && date2 === undefined) return ''
      if (date1 === undefined) d1 = new Date()
      if (date2 === undefined) d2 = new Date()
      let diff = d2 - d1

      // date
      if (Math.floor(diff / 1000 / 60 / 60 / 24) >= 7) return 'on ' + d1.toLocaleDateString()
      // days
      if (Math.floor(diff / 1000 / 60 / 60 / 24) > 1) return Math.floor(diff / 1000 / 60 / 60 / 24) + ' days ago'
      // day
      if (Math.floor(diff / 1000 / 60 / 60 / 24) > 0) return 'a day ago'
      // hours
      if (Math.floor(diff / 1000 / 60 / 60) > 1) return Math.floor(diff / 1000 / 60 / 60) + ' hours ago'
      // hour
      if (Math.floor(diff / 1000 / 60 / 60) > 0) return 'an hour ago'
      // minutes
      if (Math.floor(diff / 1000 / 60) > 0) return 'a minute ago'
      // minute
      if (Math.floor(diff / 1000 / 60) > 1) return Math.floor(diff / 1000 / 60) + ' minutes ago'
      // moment
      return 'a moment ago'
    },
    clamp (val, min, max) {
      // if none given, pretend (0..1)
      if (min === undefined && max === undefined) max = 1
      // if only max given, pretend (0..max)
      if (min === undefined) min = 0
      // if only min given, pretend (min..Infinity)
      if (max === undefined) max = Infinity
      return Math.min(Math.max(val, min), max)
    }
  }
})

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>'
}).$mount('#app')
