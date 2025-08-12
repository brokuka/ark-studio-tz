<script setup lang="ts">
const color = useColorMode()

const isOpen = ref(false)

function openSearchDialog() {
  isOpen.value = true
}

function toggleDark() {
  color.preference = color.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <header
    class="py-2 px-5 bg-gray-100 items-center text-black dark:bg-white/8 dark:text-white mb-[32px] flex justify-between"
  >
    <h2 class="text-sm font-semibold">
      AIRESTO | Супра
    </h2>

    <div class="flex gap-2">
      <button
        class="flex gap-2 rounded-[8px] p-2 border border-gray-300 dark:border-white/16 cursor-pointer opacity-75 hover:opacity-100 transition-opacity md:w-40 lg:w-56 xl:w-[258px] items-center"
        type="button" @click="openSearchDialog"
      >
        <Icon name="iconamoon:search" class="size-4" />
        <span class="hidden lg:inline-flex">⌘+Л поиск по имени</span>
        <span class="inline-flex lg:hidden">Поиск...</span>
      </button>

      <button
        class="bg-gray-200 hover:bg-gray-200/70 dark:bg-white/4 rounded-sm p-1 dark:hover:bg-white/15 cursor-pointer flex justify-center items-center"
        @click="toggleDark"
      >
        <ClientOnly>
          <Icon v-if="color.value === 'light'" class="size-4" name="iconamoon:mode-light" />
          <Icon v-else class="size-4" name="iconamoon:mode-dark" />
        </ClientOnly>
      </button>

      <button
        class="bg-gray-200 hover:bg-gray-200/70 dark:bg-white/4 rounded-sm py-1 px-1.5 dark:hover:bg-white/15 cursor-pointer flex gap-1 items-center"
      >
        <Icon class="size-4" name="iconamoon:exit" />
        <span class="text-xs ">Выйти</span>
      </button>
    </div>
  </header>

  <Search v-model:open="isOpen" />
</template>
