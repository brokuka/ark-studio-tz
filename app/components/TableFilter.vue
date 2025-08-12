<script lang="ts">
interface Props {
  title: string
  multiSelect?: boolean
}
</script>

<script setup lang="ts">
const props = defineProps<Props>()

const data = defineModel<string[]>()
const activeSelected = defineModel<string[]>('active')

const isSelectedArray = ref<string[]>(activeSelected.value ?? [])

function onClickButton(item: string) {
  const isAlreadySelected = getActiveElement(item)

  if (isAlreadySelected) {
    isSelectedArray.value = isSelectedArray.value.filter(text => text !== item)

    return
  }

  if (props.multiSelect) {
    isSelectedArray.value = [...isSelectedArray.value, item]

    return
  }

  isSelectedArray.value = [item]
}

const slot = useSlots()

function getActiveElement(item: string) {
  return isSelectedArray.value.includes(item)
}

watch(activeSelected, (newValue) => {
  if (!newValue)
    return

  isSelectedArray.value = newValue
})

watch(isSelectedArray, (newValue) => {
  activeSelected.value = newValue
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <span class="text-black/64 dark:text-white/64 text-xs">{{ props.title }}</span>
    <div class="flex gap-2">
      <button
        v-for="(item, key) in data" :key="key" :class="cn('cursor-pointer text-xs rounded-lg py-1 px-2 dark:text-white inline-flex flex-col text-left bg-gray-200 text-black dark:bg-white/4', {
          'dark:bg-[#007AFF] bg-[#007AFF] text-white': getActiveElement(item),
        })" @click="onClickButton(item)"
      >
        <slot v-if="slot.data" name="data" :item />

        <template v-else>
          {{ item }}
        </template>
      </button>
    </div>
  </div>
</template>
