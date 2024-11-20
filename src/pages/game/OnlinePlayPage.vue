<template>
  <BoardWithGui
    ref="board"
    :white="isWhite ? 'human' : 'none'"
    :black="isBlack ? 'human' : 'none'"
    :update-title="isPlaying"
    :show-game-over-popup="isPlaying"
    :opponent-name="opponentName"
    
    @new-move="sendNewMove"
    @invalid-variant="illegalPosition"
  />
</template>

<script setup lang="ts">
  import { computed, onUnmounted, ref, watchEffect } from 'vue'
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import { updateTitle } from '@/helpers/web-utils'
  import { useGameStore } from '@/stores/game'
  import { useRoute } from 'vue-router'
  import BoardWithGui from '@/components/game-ui/BoardWithGui.vue'
  import type { Game } from '@/stores/game'
  import type { MakeMoveWinner, PieceId, Player } from '@/protochess/types'
  
  const route = useRoute()
  const gameStore = useGameStore()
  
  const board = ref<InstanceType<typeof BoardWithGui>>()
  // For the remote player, use 'none' and set the state manually
  const isWhite = ref(false)
  const isBlack = ref(false)
  const isPlaying = computed(() => isWhite.value || isBlack.value)
  const opponentName = ref('')
  
  // When the route changes, update the game
  watchEffect(() => {
    if (route.name !== 'play-online') return
    
    if (!route.params.gameId || typeof route.params.gameId !== 'string') {
      returnHome(400, 'This URL seems to be incorrect.')
      return
    }
    
    gameStore.onGameChanged(async game => {
      if (!board.value) {
        throw new Error('Board not initialized')
      }
      updateUi(game)
      const realWinner = await board.value.setState(game.variant, game.moveHistory)
      const declaredWinner = getWinner(game)
      const declaredWinnerIsMe = declaredWinner === 'white' && isWhite.value || declaredWinner === 'black' && isBlack.value
      if (declaredWinner !== realWinner) {
        if (declaredWinnerIsMe) opponentResigned()
        else illegalPosition()
      }
    })
    
    gameStore.onGameNotExists(() => {
      returnHome(404, 'We can\'t find the game you were looking for.')
    })
    
    gameStore.onInvalidVariant(() => {
      returnHome(503, 'This variant seems to be invalid. It may have been uploaded \
          using an incompatible version of the site. \
          \n\nPlease report this by [opening an issue on GitHub](https://github.com/pol-rivero/ReChess/issues).')
    })
    
    try {
      gameStore.listenForUpdates(route.params.gameId)
    } catch (e) {
      returnHome(404, 'We can\'t find the game you were looking for.')
      return
    }
  })
  
  onUnmounted(() => {
    gameStore.removeListeners()
  })
  
  
  async function sendNewMove(from: [number, number], to: [number, number], promotion?: PieceId, winner?: Player|'none') {
    // Error checking
    if (!board.value) throw new Error('Board is not defined')
    // Convert winner from Player|'none'|undefined to Player|'draw'|null
    const winner2 = (winner === 'none') ? 'draw' : winner
    // Get the player to move from the board
    const playerToMove = board.value.playerToMove
    if (!playerToMove) throw new Error('Player to move is not defined')
    try {
      await gameStore.movePiece(from, to, promotion, playerToMove, winner2)
    } catch (e) {
      console.error(e)
      showPopup(
        'Error',
        'An error occurred while trying to send this move to the server. Please **reload the page** and try again.',
        'ok'
      )
    }
  }
  
  function updateUi(game: Game) {
    isWhite.value = game.loggedUserIsWhite
    isBlack.value = game.loggedUserIsBlack
    if (!isWhite.value && !isBlack.value) {
      updateTitle(`${game.whiteName} vs ${game.blackName}`)
    } else {
      opponentName.value = isWhite.value ? game.blackName : game.whiteName
    }
  }
  
  function getWinner(game: Game): MakeMoveWinner | undefined {
    return game.winner === 'draw' ? 'none' : game.winner
  }
  
  function opponentResigned() {
    board.value?.gameOver('Resignation', isWhite.value ? 'white' : 'black')
  }
  
  async function illegalPosition() {
    if (isPlaying.value) {
      showPopup(
        'This game seems to be invalid',
        'Please wait while we cancel the game...',
        'ok'
      )
      await gameStore.cancelGame('An illegal position was detected')
      returnHome(503, 'The game you were playing is invalid, your opponent seems to have made \
          an illegal move. The game has been cancelled. \
          \n\nIf the problem persists, please [open an issue on GitHub](https://github.com/pol-rivero/ReChess/issues).')
    } else {
      returnHome(503, 'The game you were spectating seems to be invalid. \
          \n\nPlease try again later, and if the problem persists, \
          [open an issue on GitHub](https://github.com/pol-rivero/ReChess/issues).')
    }
  }
  
</script>
