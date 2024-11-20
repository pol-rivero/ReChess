<template>
  <div />
</template>

<script setup lang="ts">
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { useRoute } from 'vue-router'
  
  const route = useRoute()
  returnHome(404, `The page you are looking for does not exist: \`${route.path}\`.` +
    '\n\nIf you think this is a mistake, please [open an issue on GitHub](https://github.com/pol-rivero/ReChess/issues).')
</script>
