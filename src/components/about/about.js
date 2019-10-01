import InstanceSpecificPanel from '../instance_specific_panel/instance_specific_panel.vue'
import FeaturesPanel from '../features_panel/features_panel.vue'
import TermsOfServicePanel from '../terms_of_service_panel/terms_of_service_panel.vue'

const About = {
  components: {
    InstanceSpecificPanel,
    FeaturesPanel,
    TermsOfServicePanel
  },
  computed: {
    showFeaturesPanel () { return this.$store.state.instance.showFeaturesPanel },
    showInstanceSpecificPanel() {
      return this.$store.state.instance.showInstanceSpecificPanel &&
        !this.$store.state.instance.showInstanceSpecificPanelInSidebar
    },
    isMobileLayout () { return this.$store.state.interface.mobileLayout }
  }
}

export default About
