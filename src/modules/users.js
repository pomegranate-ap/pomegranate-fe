import backendInteractorService from '../services/backend_interactor_service/backend_interactor_service.js'
import { compact, map, each, merge } from 'lodash'
import { set } from 'vue'
import registerPushNotifications from '../services/push/push.js'

// TODO: Unify with mergeOrAdd in statuses.js
export const mergeOrAdd = (arr, obj, item) => {
  if (!item) { return false }
  const oldItem = obj[item.id]
  if (oldItem) {
    // We already have this, so only merge the new info.
    merge(oldItem, item)
    return {item: oldItem, new: false}
  } else {
    // This is a new item, prepare it
    arr.push(item)
    obj[item.id] = item
    return {item, new: true}
  }
}

export const mutations = {
  setMuted (state, { user: {id}, muted }) {
    const user = state.usersObject[id]
    set(user, 'muted', muted)
  },
  setCurrentUser (state, user) {
    state.lastLoginName = user.screen_name
    state.currentUser = merge(state.currentUser || {}, user)
  },
  clearCurrentUser (state) {
    state.currentUser = false
    state.lastLoginName = false
  },
  beginLogin (state) {
    state.loggingIn = true
  },
  endLogin (state) {
    state.loggingIn = false
  },
  addNewUsers (state, users) {
    each(users, (user) => mergeOrAdd(state.users, state.usersObject, user))
  },
  setUserForStatus (state, status) {
    status.user = state.usersObject[status.user.id]
  },
  setColor (state, { user: {id}, highlighted }) {
    const user = state.usersObject[id]
    set(user, 'highlight', highlighted)
  }
}

export const defaultState = {
  lastLoginName: false,
  currentUser: false,
  loggingIn: false,
  users: [],
  usersObject: {}
}

const users = {
  state: defaultState,
  mutations,
  actions: {
    fetchUser (store, id) {
      store.rootState.api.backendInteractor.fetchUser({id})
        .then((user) => store.commit('addNewUsers', user))
    },
    registerPushNotifications (store) {
      registerPushNotifications(store)
    },
    addNewStatuses (store, { statuses }) {
      const users = map(statuses, 'user')
      const retweetedUsers = compact(map(statuses, 'retweeted_status.user'))
      store.commit('addNewUsers', users)
      store.commit('addNewUsers', retweetedUsers)

      // Reconnect users to statuses
      each(statuses, (status) => {
        store.commit('setUserForStatus', status)
      })
      // Reconnect users to retweets
      each(compact(map(statuses, 'retweeted_status')), (status) => {
        store.commit('setUserForStatus', status)
      })
    },
    logout (store) {
      store.commit('clearCurrentUser')
      store.commit('setToken', false)
      store.dispatch('stopFetching', 'friends')
      store.commit('setBackendInteractor', backendInteractorService())
    },
    setCurrentUser (store, user) {
      store.commit('setCurrentUser', user)
    },
    loginUser (store, accessToken) {
      return new Promise((resolve, reject) => {
        const commit = store.commit
        commit('beginLogin')
        store.rootState.api.backendInteractor.verifyCredentials(accessToken)
          .then((response) => {
            if (response.ok) {
              response.json()
                .then((user) => {
                  // user.credentials = userCredentials
                  user.credentials = accessToken
                  store.dispatch('setCurrentUser', user)
                  commit('addNewUsers', [user])

                  // Set our new backend interactor
                  commit('setBackendInteractor', backendInteractorService(accessToken))

                  if (user.token) {
                    store.dispatch('initializeSocket', user.token)
                  }

                  // Start getting fresh tweets.
                  store.dispatch('startFetching', 'friends')
                  // Start getting our own posts, only really needed for mitigating broken favorites
                  store.dispatch('startFetching', ['own', user.id])

                  // Get user mutes and follower info
                  store.rootState.api.backendInteractor.fetchMutes()
                    .then((mutedUsers) => {
                      each(mutedUsers, (user) => { user.muted = true })
                      store.commit('addNewUsers', mutedUsers)
                    })

                  // Fetch our friends
                  store.rootState.api.backendInteractor.fetchFriends({id: user.id})
                    .then((friends) => commit('addNewUsers', friends))
                })
            } else {
              // Authentication failed
              commit('endLogin')
              if (response.status === 401) {
                reject('Wrong username or password')
              } else {
                reject('An error occurred, please try again')
              }
            }
            commit('endLogin')
            resolve()
          })
          .catch((error) => {
            console.log(error)
            commit('endLogin')
            reject('Failed to connect to server, try again')
          })
      })
    }
  }
}

export default users
