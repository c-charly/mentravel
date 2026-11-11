<script setup lang="ts">
// Un seul titulaire par reservation, quel que soit le nombre de sieges.
import { formatPhoneNational, isValidIdNumber, isValidName, isValidPhone } from '#shared/validation'
import type { IdType } from '#shared/types'

const store = useBookingStore()
const emit = defineEmits<{ submit: [] }>()
const props = defineProps<{ busy?: boolean; error?: string }>()

const touched = reactive({ lastName: false, firstName: false, phone: false, idNumber: false })
const idTypes: { id: IdType; icon: string }[] = [
  { id: 'cni', icon: 'lucide:id-card' },
  { id: 'passport', icon: 'lucide:book-user' },
  { id: 'other', icon: 'lucide:file-text' },
]

const errors = computed(() => ({
  lastName: !isValidName(store.holder.lastName),
  firstName: !isValidName(store.holder.firstName),
  phone: !isValidPhone(store.holder.phone),
  idNumber: !isValidIdNumber(store.holder.idNumber),
}))
const valid = computed(() => !Object.values(errors.value).some(Boolean))

function onPhone(e: Event) {
  const el = e.target as HTMLInputElement
  store.holder.phone = formatPhoneNational(el.value)
}

function submit() {
  Object.keys(touched).forEach((k) => (touched[k as keyof typeof touched] = true))
  if (!valid.value || props.busy) return
  emit('submit')
}

const idHint = computed(() =>
  store.holder.idType === 'cni' ? '112233445' : store.holder.idType === 'passport' ? 'CE123456' : '',
)
</script>

<template>
  <form class="grid gap-6" novalidate @submit.prevent="submit">
    <div>
      <h2 class="display text-3xl sm:text-4xl">{{ $t('holder.title') }}</h2>
      <p class="mt-2 max-w-xl text-muted">
        {{ $t('holder.intro', { n: store.seatCount }, store.seatCount) }}
      </p>
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <label class="form-control">
        <span class="mb-1.5 block font-semibold">{{ $t('holder.lastName') }}</span>
        <input
          v-model="store.holder.lastName"
          class="input w-full"
          :class="touched.lastName && errors.lastName ? 'is-invalid' : ''"
          autocomplete="family-name"
          enterkeyhint="next"
          :aria-invalid="touched.lastName && errors.lastName"
          :aria-describedby="touched.lastName && errors.lastName ? 'err-ln' : undefined"
          @blur="touched.lastName = true"
        />
        <span v-if="touched.lastName && errors.lastName" id="err-ln" class="mt-1 flex items-center gap-1.5 text-sm font-semibold text-error">
          <Icon name="lucide:circle-alert" class="size-4" />{{ $t('holder.errName') }}
        </span>
      </label>
      <label class="form-control">
        <span class="mb-1.5 block font-semibold">{{ $t('holder.firstName') }}</span>
        <input
          v-model="store.holder.firstName"
          class="input w-full"
          :class="touched.firstName && errors.firstName ? 'is-invalid' : ''"
          autocomplete="given-name"
          enterkeyhint="next"
          :aria-invalid="touched.firstName && errors.firstName"
          :aria-describedby="touched.firstName && errors.firstName ? 'err-fn' : undefined"
          @blur="touched.firstName = true"
        />
        <span v-if="touched.firstName && errors.firstName" id="err-fn" class="mt-1 flex items-center gap-1.5 text-sm font-semibold text-error">
          <Icon name="lucide:circle-alert" class="size-4" />{{ $t('holder.errName') }}
        </span>
      </label>
    </div>

    <label class="form-control">
      <span class="mb-1.5 block font-semibold">{{ $t('holder.phone') }}</span>
      <span
        class="input flex w-full items-center gap-2"
        :class="touched.phone && errors.phone ? 'is-invalid' : ''"
      >
        <span class="mono shrink-0 font-bold text-muted">+237</span>
        <input
          :value="store.holder.phone"
          class="mono grow input bg-transparent outline-none"
          inputmode="tel"
          autocomplete="tel-national"
          enterkeyhint="next"
          placeholder="6 53 67 74 43"
          :aria-invalid="touched.phone && errors.phone"
          :aria-describedby="'hint-phone'"
          @input="onPhone"
          @blur="touched.phone = true"
        />
      </span>
      <span id="hint-phone" class="mt-1 block text-sm" :class="touched.phone && errors.phone ? 'font-semibold text-error' : 'text-muted'">
        {{ touched.phone && errors.phone ? $t('holder.errPhone') : $t('holder.phoneHint') }}
      </span>
    </label>

    <fieldset>
      <legend class="mb-1.5 font-semibold">{{ $t('holder.idType') }}</legend>
      <div class="grid grid-cols-3 gap-2">
        <label
          v-for="t in idTypes"
          :key="t.id"
          class="flex cursor-pointer flex items-center gap-1.5 rounded-xl border p-2 text-center text-xs font-medium transition-colors hover:bg-base-200 has-[:checked]:border-base-content has-[:checked]:bg-base-200 has-[:checked]:ring-1 has-[:checked]:ring-base-content has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
          :class="store.holder.idType === t.id ? 'border-base-content' : 'border-line'"
        >
          <input v-model="store.holder.idType" type="radio" class="sr-only" name="idType" :value="t.id" />
          <Icon :name="t.icon" class="size-6" />
          {{ $t(`holder.idTypes.${t.id}`) }}
        </label>
      </div>
    </fieldset>

    <label class="form-control">
      <span class="mb-1.5 block font-semibold">{{ $t('holder.idNumber') }}</span>
      <input
        v-model="store.holder.idNumber"
        class="input mono w-full"
        :class="touched.idNumber && errors.idNumber ? 'is-invalid' : ''"
        autocomplete="off"
        autocapitalize="characters"
        enterkeyhint="done"
        :placeholder="idHint"
        :aria-invalid="touched.idNumber && errors.idNumber"
        aria-describedby="hint-id"
        @blur="touched.idNumber = true"
      />
      <span id="hint-id" class="mt-1 flex items-start gap-1.5 text-sm" :class="touched.idNumber && errors.idNumber ? 'font-semibold text-error' : 'text-muted'">
        <Icon :name="touched.idNumber && errors.idNumber ? 'lucide:circle-alert' : 'lucide:lock'" class="mt-0.5 size-4 shrink-0" />
        {{ touched.idNumber && errors.idNumber ? $t('holder.errId') : $t('holder.idHint') }}
      </span>
    </label>

    <p v-if="error" class="flex items-start gap-2 rounded-2xl bg-error/10 p-3.5 font-medium text-error" role="alert">
      <Icon name="lucide:circle-alert" class="mt-0.5 size-5 shrink-0" />{{ error }}
    </p>

    <button type="submit" class="btn btn-primary btn-lg w-full sm:w-auto" :disabled="busy">
      <Icon v-if="busy" name="lucide:loader" class="size-5 animate-spin" />
      {{ $t('holder.continue') }}
      <Icon v-if="!busy" name="lucide:arrow-right" class="size-5" />
    </button>
  </form>
</template>
