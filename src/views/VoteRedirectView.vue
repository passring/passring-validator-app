<template>
  <div>
    <h2 v-if="state === 'error'" style="text-align: center; font-size: xx-large">❌</h2>
  </div>
  <h2 v-if="state === 'error'" style="text-align: center; font-size: xx-large">
    {{ error }}
  </h2>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { init_panic_hook, PrivateKey, version } from '../passring/passring_wasm'

const router = useRouter()
const route = useRoute()

const state = ref<null | 'loading' | 'error' | 'auth-error' | 'success'>(null)
const error = ref<string | null>(null)

if (route.params.vote_id) {
  const savedData = localStorage.getItem('data')

  if (savedData) {
    const data = JSON.parse(savedData)
    const thisVoting = data.find((item: { voteId: string }) => item.voteId === route.params.vote_id)
    if (thisVoting) {
      window.location.replace(
        `https://agency.vote.nau-digital.com/votings/${route.params.vote_id}#${thisVoting.privateKey}`
      )
    } else {
      state.value = 'error'
      error.value = 'У вас немає доступу до цього голосування'
    }
  } else {
    state.value = 'error'
    error.value = 'У вас немає жодних збережених даних для голосування'
  }
}
</script>
