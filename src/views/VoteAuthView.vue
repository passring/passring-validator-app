<template>
  <div>
    <div
      v-if="state === 'loading'"
      style="display: flex; align-items: center; justify-content: center"
    >
      <LoadingIcon />
    </div>
    <h2 v-else-if="state === 'success'" style="text-align: center">🫡</h2>
    <h2 v-else-if="state === 'error'" style="text-align: center; font-size: xx-large">❌</h2>
    <h1 v-else style="text-align: center">Привіт!</h1>
  </div>
  <h2 v-if="state === 'loading'">Зачекайте, ми перевіряємо вашу автентифікацію</h2>
  <h2 v-else-if="state === 'success'">
    Дякуємо за реєстрацію, очікуйте інфи по виборах в офіційних джерелах
  </h2>
  <h2 v-else-if="state === 'error'" style="text-align: center; font-size: xx-large">
    {{ error }}
  </h2>
  <div v-else>
    <p style="margin-bottom: 24px">Для продовження необхідно авторизуватись:</p>
    <div>
      <div style="position: relative">
        <div id="googleButton"></div>
      </div>
      <div v-if="error" style="color: red">{{ error }}</div>
    </div>
  </div>
  <div id="g_id_onload" :data-client_id="audience" :data-login_uri="origin"></div>
</template>
<script lang="ts" setup>
import { onMounted, ref, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { init_panic_hook, PrivateKey, version } from '../passring/passring_wasm'

const audience = import.meta.env.VITE_AUDIENCE
const origin = ref(window.location.origin)

const route = useRoute()

const state = ref<null | 'loading' | 'error' | 'auth-error' | 'success'>(null)
const error = ref<string | null>(null)

init_panic_hook()
console.log('Passring version:', version())

function initGoogleBtn() {
  google.accounts.id.renderButton(document.getElementById('googleButton'), {
    theme: 'outline',
    size: 'large'
  })
  google.accounts.id.prompt() // also display the One Tap dialog
}

async function handleCredentialResponse(response: {
  clientId: string
  client_id: string
  credential: string
  select_by: 'user' | 'btn'
}) {
  state.value = 'loading'
  error.value = null
  await new Promise((resolve) => setTimeout(resolve, 0))

  const privkey = PrivateKey.random()
  const publicKey = privkey.getPublicKey().encodeHex()
  const privateKey = privkey.encodeHex()
  // let ring = get_random_ring(15)
  // ring.push(privkey.getPublicKey())
  // console.log('Using ring: ', ring)
  // let passring = new Passring('test_voting id', ring)
  // let issued = passring.issue(2, privkey) // issue vote for choice 2 with privkey| console. log("Issued: ", issued);
  // let result = passring.validate(issued)
  // console.log('Validated: ', result)

  try {
    const resp = await fetch(
      `${import.meta.env.VITE_REG_API}/vote/${route.params.vote_id}/ring/${publicKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credential: response.credential
        })
      }
    )

    if (!resp.ok) {
      state.value = 'error'
      const err = await resp.text()
      switch (err) {
        case 'Vote not found':
          error.value = 'Вибори не знайдено'
          break
        case 'Vote is not active':
          error.value = 'Вибори не активні'
          break
        case 'Unauthorized':
          error.value = 'Помилка авторизації'
          break
        case 'Access denied':
          error.value = 'Ви не можете голосувати на цих виборах'
          break
        case 'Key already exists':
          error.value = 'Ви вже зберегли ключ для цих виборів'
          break
        default:
          error.value = err
      }
      return
    }

    const json = await resp.json()
    if (!localStorage.getItem('data')) {
      localStorage.setItem(
        'data',
        JSON.stringify([
          {
            data: json,
            voteId: route.params.vote_id.toString(),
            privateKey
          }
        ])
      )
    } else {
      const data = JSON.parse(localStorage.getItem('data')!)
      if (data.some((el: any) => el.voteId === route.params.vote_id.toString())) {
        const index = data.findIndex((el: any) => el.voteId === route.params.vote_id.toString())
        data[index] = {
          data: json,
          voteId: route.params.vote_id.toString(),
          privateKey
        }
      } else {
        data.push({
          data: json,
          voteId: route.params.vote_id.toString(),
          privateKey
        })
      }
      localStorage.setItem('data', JSON.stringify(data))
    }

    state.value = 'success'
  } catch (e) {
    console.error(e)
    state.value = 'auth-error'
    error.value = 'Помилка авторизації'
    await nextTick()
    initGoogleBtn()
  }
}

onMounted(() => {
  google.accounts.id.initialize({
    client_id: audience,
    callback: handleCredentialResponse
  })
  initGoogleBtn()
})
</script>
