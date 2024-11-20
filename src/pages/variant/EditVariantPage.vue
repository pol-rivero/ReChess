<template>
  <div class="columns is-desktop reverse-columns">
    <div class="column is-narrow left-column">
      <div class="mb-4 board-container is-flex is-align-items-center">
        <div
          class="w-100"
          style="z-index: 20"
        >
          <ViewableChessBoard
            ref="board"
            max-height="30.5rem"
            :white-pov="true"
            :view-only="selectedPieceId !== 'none'"
            :show-coordinates="true"
            :capture-wheel-events="false"
            :get-click-mode="getClickMode"
            :free-mode="true"
            :cursor-pointer="selectedPieceId !== 'none'"
            @clicked="togglePiece"
            @user-moved="refreshFen"
          />
        </div>
      </div>
      
      <div class="is-flex is-align-items-center mb-4">
        <div class="field-label">
          <label>Board size:</label>
        </div>
        <SmartNumberInput
          class="width-5rem"
          :min="1"
          :max="16"
          :default="8"
          :start-value="draftStore.state.boardWidth"
          @changed="w => {
            board?.getPositionsWhere(p => p[0] >= w).forEach(p => board?.removePiece(p))
            refreshFen()
            draftStore.state.boardWidth = w
          }"
        />
        <div class="field-label-both">
          <label>x</label>
        </div>
        <SmartNumberInput
          class="width-5rem"
          :min="1"
          :max="16"
          :default="8"
          :start-value="draftStore.state.boardHeight"
          @changed="h => {
            // Split the fen rows and get the last h rows
            draftStore.state.fen = board?.getFen().split('/').slice(-h).join('/') ?? ''
            draftStore.state.boardHeight = h
          }"
        />
      </div>
      
      <div class="is-flex is-align-items-center mb-5">
        <div class="field-label">
          <label>First player to move:</label>
        </div>
        <div class="field-body">
          <SmartDropdown
            :items="['White', 'Black']"
            :start-item="draftStore.state.playerToMove === 0 ? 'White' : 'Black'"
            @changed="item => draftStore.state.playerToMove = item === 'White' ? 0 : 1"
          />
        </div>
      </div>
      
      <div class="field mb-6">
        <div class="is-flex mb-2">
          <label class="label mr-4">Add or remove pieces:</label>
          <InfoTooltip
            text="Tap a piece below to select it, and then tap the board to add or remove it."
          />
        </div>
        <PiecePlacementButtons
          ref="pieceSelector"
          :z-index="11"
          :variant="draftStore.state"
          @piece-selected="id => { board?.$el.scrollIntoView(); selectedPieceId = id }"
          @piece-deselected="selectedPieceId = 'none'"
          @delete-click="clearBoard"
          @clear-all-click="clearBoard"
        />
      </div>
      
      <SmartErrorMessage
        v-show="hasError"
        class="my-4"
        :handler="errorMsgHandler"
      />
      <div class="columns">
        <div class="column pb-1 pr-2">
          <button
            class="button is-fullwidth"
            :disabled="hasError || loading"
            @click="router.push({name: 'draft-analysis'})"
          >
            <div class="sz-icon icon-analysis color-theme" />
            <span>Analysis board</span>
          </button>
        </div>
        <div class="column pb-1 pl-2">
          <button
            class="button is-fullwidth"
            :disabled="hasError || loading"
            @click="playPopup?.showWithLevels((side, level) => router.push({ name: 'draft-play', query: {startAs: side, lvl: level} }))"
          >
            <div class="sz-icon icon-cpu color-theme" />
            <span>Play vs. engine</span>
          </button>
        </div>
      </div>
      <div class="columns mb-5">
        <div class="column is-6 pr-2">
          <button
            class="button is-primary is-fullwidth"
            :disabled="hasError || loading"
            @click="publish"
          >
            <div class="sz-icon icon-rocket color-white" />
            <span>Publish variant</span>
          </button>
        </div>
      </div>
      <div class="columns">
        <div class="column pb-1 pr-2">
          <button
            class="button is-fullwidth"
            @click="draftStore.backupFile"
          >
            <div class="sz-icon icon-download color-theme" />
            Back up
          </button>
        </div>
        <div class="column pl-2">
          <button
            style="position: relative;"
            class="button is-fullwidth"
            @click="importFile('application/json').then(loadFile)"
          >
            <FileDropArea @file-dropped="loadFile" />
            <div class="sz-icon icon-upload color-theme" />
            Restore
          </button>
        </div>
      </div>
      <p>* Your draft is saved automatically, you can close this page and come back later to continue editing.</p>
    </div>
    
    
    
    <div class="column">
      <SmartTextInput
        class="is-large mb-5"
        placeholder="Variant name"
        :start-text="draftStore.state.displayName"
        :validator="(text) => {
          if (text.length === 0) return 'Please enter the name of this variant'
          if (text.length > 50) return 'Variant name must be at most 50 characters long'
          if (text.length < 3) return 'Variant name must be at least 3 characters long'
        }"
        :emit-changed-when-error="true"
        :error-handler="errorMsgHandler"
        @changed="name => draftStore.state.displayName = name"
      />
      <div class="columns mx-0 mb-5">
        <div class="column is-narrow px-0 py-0 mt-2">
          <label class="mb-0 mr-3">Tags:</label>
        </div>
        <div class="column px-0 py-0">
          <PillList
            :editable="true"
            :validator="text => !text.match(/[\s,#]/)"
            :starting-pills="draftStore.state.tags"
            :prefix="'#'"
            :max-pills="7"
            :max-pill-length="35"
            @changed="pills => draftStore.state.tags = pills"
          />
        </div>
      </div>
      <EditableMarkdown
        class="mb-5"
        :text="draftStore.state.description"
        :placeholder="'Describe the rules of the variant and how fun it is to play! You can use **Markdown** to format your text.'"
        :editable="true"
        :error-handler="errorMsgHandler"
        :char-limit="1000"
        :validator="text => text.length > 1000 ? 'The variant description must be at most 1000 characters long' : undefined"
        @save="text => draftStore.state.description = text"
      />
      
      <label class="label">Rules:</label>
      <div class="columns is-mobile">
        <div class="column">
          <SmartCheckbox
            text="Capturing is forced"
            class="rules-field"
            :start-value="draftStore.state.globalRules.capturingIsForced"
            :tooltip="'If you have the option to capture a piece, you must do so.'"
            @changed="value => draftStore.state.globalRules.capturingIsForced = value"
          />
          <SmartCheckbox
            text="Check is forbidden"
            class="rules-field"
            :start-value="draftStore.state.globalRules.checkIsForbidden"
            :tooltip="'If a move puts the opponent in check, that move is illegal.'"
            @changed="value => {
              draftStore.state.globalRules.checkIsForbidden = value
              draftStore.state.globalRules.checksToLose = 0
            }"
          />
        </div>
        
        <div class="column">
          <SmartCheckbox
            text="Stalemated player loses"
            class="rules-field"
            :tooltip="'When a player doesn\'t have any legal moves, the game is not a draw. Instead, that player loses.'"
            :start-value="draftStore.state.globalRules.stalematedPlayerLoses"
            @changed="value => draftStore.state.globalRules.stalematedPlayerLoses = value"
          />
          <SmartCheckbox
            text="Invert ALL win conditions"
            class="rules-field"
            :tooltip="'When the game is over, the winner becomes the loser and vice versa.'"
            :start-value="draftStore.state.globalRules.invertWinConditions"
            @changed="value => draftStore.state.globalRules.invertWinConditions = value"
          />
        </div>
      </div>
      <div class="is-flex is-align-items-center mb-4">
        <div class="field-label">
          <label>Repetitions for draw:</label>
        </div>
        <SmartNumberInput
          class="width-5rem"
          :min="0"
          :max="200"
          :default="3"
          :start-value="draftStore.state.globalRules.repetitionsDraw"
          @changed="value => draftStore.state.globalRules.repetitionsDraw = value"
        />
        <InfoTooltip
          class="ml-4"
          text="In standard chess, when the same position is reached 3 times, the game is a draw.
          Set this number to 0 to disable this rule."
        />
      </div>
      <div class="is-flex is-align-items-center mb-6">
        <div class="field-label">
          <label>Lose when put in check</label>
        </div>
        <SmartNumberInput
          class="width-5rem"
          :min="0"
          :max="200"
          :default="0"
          placeholder="-"
          :start-value="draftStore.state.globalRules.checksToLose"
          :disabled="draftStore.state.globalRules.checkIsForbidden"
          @changed="value => draftStore.state.globalRules.checksToLose = value"
        />
        <div class="field-label-right">
          <label>times</label>
        </div>
        <InfoTooltip
          class="ml-2"
          text="In some variants like 3-check, if a player is put in check 3 times, they lose.
          Set this number to 0 to disable this rule."
        />
      </div>
      <label class="label">Pieces:</label>
      <PiecesSummary
        :editable="true"
        :state="draftStore.state"
        @piece-click="pieceIndex => router.push({ name: 'edit-piece', params: { pieceIndex } })"
        @delete-click="pieceIndex => deletePiece(pieceIndex)"
        @new-click="createNewPiece"
        @reorder="movePieceType"
      />
    </div>
  </div>
  
  <PopupOverlay
    v-if="selectedPieceId !== 'none'"
    :z-index="10"
    @click="pieceSelector?.cancelPlacement()"
  />
  <PlayPopup ref="playPopup" />
</template>


<script setup lang="ts">
  import { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
  import { checkState } from '@/helpers/chess/check-protochess-state'
  import { importFile } from '@/helpers/file-io'
  import { onMounted, ref, watch } from 'vue'
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { showPopup } from '@/helpers/managers/popup-manager'
  import { useAuthStore } from '@/stores/auth-user'
  import { useRouter } from 'vue-router'
  import { useVariantDraftStore } from '@/stores/variant-draft'
  import EditableMarkdown from '@/components/basic-wrappers/EditableMarkdown.vue'
  import FileDropArea from '@/components/FileDropArea.vue'
  import InfoTooltip from '@/components/InfoTooltip.vue'
  import PiecePlacementButtons from '@/components/variant/edit/PiecePlacementButtons.vue'
  import PiecesSummary from '@/components/variant/PiecesSummary.vue'
  import PillList from '@/components/PillList.vue'
  import PlayPopup from '@/components/game-ui/PlayPopup.vue'
  import PopupOverlay from '@/components/popup-message/PopupOverlay.vue'
  import SmartCheckbox from '@/components/basic-wrappers/SmartCheckbox.vue'
  import SmartDropdown from '@/components/basic-wrappers/SmartDropdown.vue'
  import SmartErrorMessage from '@/components/basic-wrappers/SmartErrorMessage.vue'
  import SmartNumberInput from '@/components/basic-wrappers/SmartNumberInput.vue'
  import SmartTextInput from '@/components/basic-wrappers/SmartTextInput.vue'
  import ViewableChessBoard from '@/components/chessboard/ViewableChessBoard.vue'
  import type { PieceId } from '@/protochess/types'
  
  const draftStore = useVariantDraftStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const board = ref<InstanceType<typeof ViewableChessBoard>>()
  const playPopup = ref<InstanceType<typeof PlayPopup>>()
  
  const hasError = ref(false)
  const loading = ref(false)
  const errorMsgHandler = new ErrorMessageHandler(hasError)
  
  const pieceSelector = ref<InstanceType<typeof PiecePlacementButtons>>()
  const selectedPieceId = ref<PieceId|'wall'|'delete'|'none'>('none') //NOSONAR PieceId = string
  
  // This page is only accessible when logged in
  if (!authStore.loggedUser) {
    returnHome(401, 'You must be logged in to edit a variant.')
  }
    
  // When state changes, check if the state is valid, and update the board
  watch(draftStore.state, () => updateBoardAndError(), { deep: true })
  onMounted(updateBoardAndError)
  async function updateBoardAndError() {
    // Update error message
    await checkState(draftStore.state, errorMsgHandler)
    board.value?.setState(draftStore.state)
  }
  
  function deletePiece(pieceIndex: number) {
    showPopup(
      'Delete piece',
      'Are you sure you want to delete this piece? This cannot be undone.',
      'yes-no',
      () => {
        const removedIds = draftStore.state.pieceTypes[pieceIndex].ids
        draftStore.state.pieceTypes.splice(pieceIndex, 1)
        board.value?.getPositionsWhere((_, id) => removedIds.includes(id))
          .forEach(p => board.value?.removePiece(p))
        refreshFen()
      }
    )
  }
  function createNewPiece() {
    // Limit to 26 pieces for now, since IDs are internally encoded as a single lowercase letter
    if (draftStore.state.pieceTypes.length >= 26) {
      showPopup('Cannot add new piece', 'For now, the maximum number of pieces is **26**.', 'ok')
      return
    }
    draftStore.addPiece()
    router.push({ name: 'edit-piece', params: { pieceIndex: draftStore.state.pieceTypes.length - 1 } })
  }
  
  /**
   * Determine whether this drag is an add or remove operation (based on the first square of the drag)
   * @param coords The coordinates of the first square of the drag
   */
  function getClickMode(coords: [number, number]): 'add'|'remove' {
    // If selectedPieceId === 'delete', the click mode doesn't matter
    if (selectedPieceId.value === 'wall') {
      return board.value?.getPieceAt(coords) === '*' ? 'remove' : 'add'
    } else {
      return board.value?.getPieceAt(coords) === selectedPieceId.value ? 'remove' : 'add'
    }
  }
  
  /**
   * Called for each square of a drag
   * @param coords The coordinates of the selected square
   * @param mode The mode of the drag (add or remove)
   */
  function togglePiece(coords: [number, number], mode?: 'add'|'remove') {
    if (!mode) throw new Error('Mode must be specified')
    // No piece selected, don't interact with board
    if (selectedPieceId.value === 'none') return

    const pieceId = board.value?.getPieceAt(coords)
    const hasWall = pieceId === '*'
    
    if (selectedPieceId.value === 'delete') {
      // Delete button selected: override click mode and remove all pieces and walls at this square
      board.value?.removePiece(coords)
      refreshFen()
      return
    }
    
    const selectedId = selectedPieceId.value === 'wall' ? '*' : selectedPieceId.value
    if (mode === 'remove') {
      // Remove mode: only remove the selected piece (or walls)
      if (pieceId === selectedId) {
        board.value?.removePiece(coords)
      }
    } else {
      // Add mode: add the selected piece (or walls) only if there's no wall there
      if (hasWall) return
      board.value?.addPiece(coords, selectedId)
    }
    refreshFen()
  }
  
  function clearBoard() {
    showPopup(
      'Clear board',
      'This will remove **all** pieces and walls from the board. Do you want to continue?',
      'yes-no',
      // Set the position to '/' instead of '', the engine wants a non-empty fen
      () => { draftStore.state.fen = '/' }
    )
  }
  
  async function loadFile(file: Blob) {
    const success = await draftStore.loadFile(file)
    // Refresh the page if the upload was successful
    if (success) router.go(0)
    else showPopup(
      'Could not import file',
      'Make sure that the file is a `.json` with the correct format.',
      'ok'
    )
  }
  
  async function publish() {
    let nameExists: boolean
    try {
      nameExists = await draftStore.nameExists()
    } catch {
      showPopup(
        'Could not publish variant',
        'It seems that it\'s not possible to connect to the server. Please try again later. \
        If the problem persists, back up your variant and \
        [open an issue on GitHub](https://github.com/pol-rivero/ReChess/issues).',
        'ok'
      )
      return
    }
    const nameExistsWarning = !nameExists ? '' :
      '\n\n>**WARNING:** A variant with this name already exists. If you proceed, it could be \
      harder to find your variant. Consider changing the name.'
    showPopup(
      'Are you sure you want to publish this variant?',
      'You **cannot edit** or **delete** a variant after it has been published. \n\nMake sure that \
      all the pieces behave the way you expect and the variant name and description are correct.'
        + nameExistsWarning,
      'yes-no',
      async () => {
        loading.value = true
        const id = await draftStore.publish()
        loading.value = false
        if (id) router.replace({ name: 'variant-details', params: { variantId: id } })
        else showPopup(
          'Could not publish variant',
          'Please try again later. If the problem persists, back up your variant and \
          [open an issue on GitHub](https://github.com/pol-rivero/ReChess/issues).',
          'ok'
        )
      }
    )
  }
  
  function movePieceType(oldIndex: number, newIndex: number) {
    const piece = draftStore.state.pieceTypes.splice(oldIndex, 1)[0]
    draftStore.state.pieceTypes.splice(newIndex, 0, piece)
  }
  
  function refreshFen() {
    draftStore.state.fen = board.value?.getFen() ?? ''
  }
</script>


<style scoped lang="scss">
  @media screen and (max-width: 1023px) {
    .reverse-columns {
      display: flex;
      flex-direction: column-reverse;
    }
  }
  
  .left-column {
    max-width: 32rem;
  }
  
  // In mobile, allow left column to be as small as needed
  @media screen and (max-width: 1023px) {
    .left-column {
      min-width: 0;
      margin-right: 0;
    }
  }
  
  .field-label {
    flex-basis: auto;
    flex-grow: 0;
    margin-right: 1rem;
  }
  .field-label-both {
    @extend .field-label;
    margin-left: 1rem;
  }
  .field-label-right {
    @extend .field-label-both;
    margin-right: 0;
  }
  
  .board-container {
    // 32rem - 0.75rem (border) * 2
    height: 30.5rem;
  }
  
  .rules-field:not(:last-child) {
    margin-bottom: 1rem;
  }
  
  .width-5rem {
    width: 5rem;
  }
</style>
