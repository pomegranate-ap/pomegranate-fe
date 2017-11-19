import { camelCase } from 'lodash'

import apiService from '../api/api.service.js'

const update = ({store, statuses, timeline, showImmediately}) => {
  const ccTimeline = camelCase(timeline)

  store.dispatch('setError', { value: false })

  store.dispatch('addNewStatuses', {
    timeline: ccTimeline,
    statuses,
    showImmediately
  })
}

const fetchAndUpdate = ({store, credentials, timeline = 'friends', older = false, showImmediately = false, userId = false, identifier = false}) => {
  const args = { timeline, credentials }
  const rootState = store.rootState || store.state
  const timelineData = rootState.statuses.timelines[camelCase(timeline)]

  if (older) {
    args['until'] = timelineData.minVisibleId
  } else {
    args['since'] = timelineData.maxId
  }

  args['userId'] = userId
  args['identifier'] = identifier

  return apiService.fetchTimeline(args)
    .then((statuses) => update({store, statuses, timeline, showImmediately}),
      () => store.dispatch('setError', { value: true }))
}

const startFetching = ({timeline = 'friends', credentials, store, userId = false, identifier = false}) => {
  fetchAndUpdate({timeline, credentials, store, showImmediately: true, userId, identifier})
  const boundFetchAndUpdate = () => fetchAndUpdate({ timeline, credentials, store, showImmediately: false, userId, identifier })
  return setInterval(boundFetchAndUpdate, 10000)
}
const timelineFetcher = {
  fetchAndUpdate,
  startFetching
}

export default timelineFetcher
