<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    persistent
    width="400"
  >
    <v-tabs
      v-model="currentTab"
      slider-color="primary"
      grow
    >
      <v-tab href="#tab-login">
        <span class="title">登入</span>
      </v-tab>
      <v-tab href="#tab-register">
        <span class="title">註冊</span>
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="currentTab">
      <v-tab-item value="tab-login">
        <login-card
          ref="login"
          @logged-in="logged"
        ></login-card>
      </v-tab-item>
      <v-tab-item value="tab-register">
        <register-card
          ref="register"
          @registered="currentTab = 'tab-login'"
        ></register-card>
      </v-tab-item>
    </v-tabs-items>
  </v-dialog>
</template>

<script>
import LoginCard from './login-card'
import RegisterCard from './register-card'

export default {
  props: {
    value: Boolean
  },
  data () {
    return {
      currentTab: null
    }
  },
  methods: {
    logged () {
      this.$refs.login.reset()
      this.$refs.register.reset()
    }
  },
  components: {
    LoginCard,
    RegisterCard
  }
}
</script>
