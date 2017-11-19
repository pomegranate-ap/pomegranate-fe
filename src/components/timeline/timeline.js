import Status from '../status/status.vue'
import timelineFetcher from '../../services/timeline_fetcher/timeline_fetcher.service.js'
import StatusOrConversation from '../status_or_conversation/status_or_conversation.vue'
import UserCard from '../user_card/user_card.vue'

const Timeline = {
  props: [
    'timeline',
    'timelineName',
    'title',
    'userId',
    'groupName',
    'tag'
  ],
  data () {
    return {
      paused: false
    }
  },
  computed: {
    timelineError () { return this.$store.state.statuses.error },
    followers () {
      return this.timeline.followers
    },
    friends () {
      return this.timeline.friends
    },
    members () {
      return this.timeline.members
    },
    viewing () {
      return this.timeline.viewing
    },
    newStatusCount () {
      return this.timeline.newStatusCount
    }
  },
  components: {
    Status,
    StatusOrConversation,
    UserCard
  },
  created () {
    const store = this.$store
    const credentials = store.state.users.currentUser.credentials
    const showImmediately = this.timeline.visibleStatuses.length === 0

    window.addEventListener('scroll', this.scrollLoad)

    timelineFetcher.fetchAndUpdate({
      store,
      credentials,
      timeline: this.timelineName,
      showImmediately,
      userId: this.userId,
      identifier: this.tag || this.groupName
    })

    // don't fetch followers for public, friend, twkn
    if (this.timelineName === 'user') {
      this.fetchFriends()
      this.fetchFollowers()
    }
    if (this.timelineName === 'group') {
      this.fetchGroup()
    }
  },
  destroyed () {
    window.removeEventListener('scroll', this.scrollLoad)
  },
  methods: {
    showNewStatuses () {
      this.$store.commit('showNewStatuses', { timeline: this.timelineName })
      this.paused = false
    },
    fetchOlderStatuses () {
      const store = this.$store
      const credentials = store.state.users.currentUser.credentials
      store.commit('setLoading', { timeline: this.timelineName, value: true })
      timelineFetcher.fetchAndUpdate({
        store,
        credentials,
        timeline: this.timelineName,
        older: true,
        showImmediately: true,
        userId: this.userId,
        identifier: this.tag || this.groupName
      }).then(() => store.commit('setLoading', { timeline: this.timelineName, value: false }))
    },
    fetchFollowers () {
      const id = this.userId
      this.$store.state.api.backendInteractor.fetchFollowers({ id })
        .then((followers) => this.$store.dispatch('addFollowers', { followers }))
    },
    fetchFriends () {
      const id = this.userId
      this.$store.state.api.backendInteractor.fetchFriends({ id })
        .then((friends) => this.$store.dispatch('addFriends', { friends }))
    },
    fetchGroup () {
      const ident = this.groupName
      this.$store.dispatch('fetchGroup', { 'groupName': ident })
      this.$store.dispatch('fetchIsMember', { 'groupName': ident, 'id': this.$store.state.users.currentUser.id })
      this.$store.state.api.backendInteractor.fetchMembers({ 'groupName': ident })
        .then((members) => this.$store.dispatch('addMembers', { members }))
    },
    scrollLoad (e) {
      let height = Math.max(document.body.offsetHeight, document.body.scrollHeight)
      if (this.timeline.loading === false &&
          this.$store.state.config.autoLoad &&
          this.$el.offsetHeight > 0 &&
          (window.innerHeight + window.pageYOffset) >= (height - 750)) {
        this.fetchOlderStatuses()
      }
    }
  },
  watch: {
    newStatusCount (count) {
      if (!this.$store.state.config.streaming) {
        return
      }
      if (count > 0) {
        // only 'stream' them when you're scrolled to the top
        if (window.pageYOffset < 15 && !this.paused) {
          this.showNewStatuses()
        } else {
          this.paused = true
        }
      }
    }
  }
}

export default Timeline
