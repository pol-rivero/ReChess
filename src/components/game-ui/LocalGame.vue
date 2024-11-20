<template>
  <BoardWithGui
    ref="board"
    :white="white"
    :black="black"
    :has-gauge="hasGauge"
    :invert-enemy-direction="invertEnemyDirection"
    :update-title="updateTitle"
    :show-game-over-popup="showGameOverPopup"
    :allow-branching="allowBranching"
    :opponent-name="opponentName"
    :engine-level="engineLevel"
    
    @invalid-variant="invalidVariant"
    @new-move="(from, to, promo, winner) => emit('new-move', from, to, promo, winner)"
  />
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { useRoute } from 'vue-router'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import { useVariantStore } from '@/stores/variant'
  import BoardWithGui from './BoardWithGui.vue'
  import type { PieceId, Player, Variant } from '@/protochess/types'
  
  const route = useRoute()
  
  const board = ref<InstanceType<typeof BoardWithGui>>()
  
  defineProps<{
    white: 'human' | 'engine'
    black: 'human' | 'engine'
    hasGauge?: boolean
    invertEnemyDirection?: boolean
    updateTitle?: boolean
    showGameOverPopup?: boolean
    allowBranching?: boolean
    opponentName?: string
    engineLevel?: 1 | 2 | 3 | 4 | 5
  }>()
  
  const emit = defineEmits<{
    (event: 'new-move', from: [number, number], to: [number, number], promotion?: PieceId, winner?: Player|'none'): void
  }>()
  
  onMounted(async () => {
    const fetchedVariant = await getVariant()
    if (!fetchedVariant) {
      returnHome(404, 'We can\'t find the variant you are looking for.')
      return
    }
    board.value?.setState(fetchedVariant)
  })
  
  function invalidVariant() {
    returnHome(503, 'This variant seems to be invalid. It may have been uploaded \
        using an incompatible version of the site. \
        \n\nPlease report this by [opening an issue on GitHub](https://github.com/pol-rivero/ReChess/issues).')
  }
  
  
  // If the variantId parameter is missing, use the stored draft variant
  async function getVariant(): Promise<Variant|undefined> {
    const variantId = route.params.variantId
    if (variantId && typeof variantId === 'string') {
      return getVariantFromServer(variantId)
    }
    const draftStore = useVariantDraftStore()
    const draft = draftStore.state
    return draft
  }
  async function getVariantFromServer(id: string): Promise<Variant|undefined> {
    const variantStore = useVariantStore()
    return variantStore.getVariant(id)
  }
</script>

