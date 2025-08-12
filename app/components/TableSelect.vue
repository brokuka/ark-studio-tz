<script setup lang="ts">
defineProps<{
  totalCapacity: number
  number: string[]
  totalTime: string
  date: string
}>()

const emit = defineEmits<{
  save: []
  cancel: []
}>()

function onClickSaveButton() {
  emit('save')
}

function onClickCancelButton() {
  emit('cancel')
}
</script>

<template>
  <div class="bg-[#dbe6f1] rounded-md text-black border border-[#007AFF] text-xs p-1 flex flex-col gap-3 justify-between">
    <div>
      <span class="font-semibold">Новое бронирование</span>

      <slot />
    </div>

    <div class="flex flex-col gap-1">
      <button class="bg-[#007AFF] text-white rounded-md p-1" @click="onClickSaveButton">
        Сохранить
      </button>

      <button class="bg-[#a0a8b0] rounded-md text-gray-200 p-1" @click="onClickCancelButton">
        Отменить
      </button>
    </div>
  </div>
</template>
