import { cloneDeep } from 'lodash'
import { defaultState, mutations } from '../../../../src/modules/statuses.js'

const makeMockStatus = ({id}) => {
  return {
    id,
    name: 'status',
    text: `Text number ${id}`,
    fave_num: 0,
    uri: ''
  }
}

describe('The Statuses module', () => {
  it('adds the status to allStatuses and to the given timeline', () => {
    const state = cloneDeep(defaultState)
    const status = makeMockStatus({id: 1})

    mutations.addNewStatuses(state, { statuses: [status], timeline: 'public' })

    expect(state.allStatuses).to.eql([status])
    expect(state.timelines.public.statuses).to.eql([status])
    expect(state.timelines.public.visibleStatuses).to.eql([])
  })

  it('adds the status to allStatuses and to the given timeline, directly visible', () => {
    const state = cloneDeep(defaultState)
    const status = makeMockStatus({id: 1})

    mutations.addNewStatuses(state, { statuses: [status], showImmediately: true, timeline: 'public' })

    expect(state.allStatuses).to.eql([status])
    expect(state.timelines.public.statuses).to.eql([status])
    expect(state.timelines.public.visibleStatuses).to.eql([status])
  })

  it('replaces existing statuses with the same id', () => {
    const state = cloneDeep(defaultState)
    const status = makeMockStatus({id: 1})
    const modStatus = makeMockStatus({id: 1, text: 'something else'})

    // Add original status
    mutations.addNewStatuses(state, { statuses: [status], showImmediately: true, timeline: 'public' })
    expect(state.timelines.public.visibleStatuses).to.have.length(1)
    expect(state.allStatuses).to.have.length(1)

    // Add new version of status
    mutations.addNewStatuses(state, { statuses: [modStatus], showImmediately: true, timeline: 'public' })
    expect(state.timelines.public.visibleStatuses).to.have.length(1)
    expect(state.allStatuses).to.have.length(1)
    expect(state.allStatuses[0]).to.equal(modStatus)
  })

  it('handles favorite actions', () => {
    const state = cloneDeep(defaultState)
    const status = makeMockStatus({id: 1})

    const favorite = {
      id: 2,
      is_post_verb: false,
      in_reply_to_status_id: 1, // The API uses strings here...
      uri: 'tag:shitposter.club,2016-08-21:fave:3895:note:773501:2016-08-21T16:52:15+00:00',
      text: 'a favorited something by b'
    }

    mutations.addNewStatuses(state, { statuses: [status], showImmediately: true, timeline: 'public' })
    mutations.addNewStatuses(state, { statuses: [favorite], showImmediately: true, timeline: 'public' })

    expect(state.timelines.public.visibleStatuses.length).to.eql(1)
    expect(state.timelines.public.visibleStatuses[0].fave_num).to.eql(1)

    // Adding again shouldn't change anything
    mutations.addNewStatuses(state, { statuses: [favorite], showImmediately: true, timeline: 'public' })

    expect(state.timelines.public.visibleStatuses.length).to.eql(1)
    expect(state.timelines.public.visibleStatuses[0].fave_num).to.eql(1)
  })
})
