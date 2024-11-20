<template>
  <div
    v-if="user"
    class="columns"
  >
    <div class="column is-7">
      <div class="is-flex is-align-items-center mb-5">
        <div
          class="mr-4 profile-image-container is-flex-shrink-0 is-flex-grow-0"
          :class="{
            'editable': myProfile(user),
            'force-show-overlay': imageSelectPopup?.loading
          }"
          @click="imageClicked"
        >
          <img
            v-if="user.profileImg"
            class="h-100 h-100 is-rounded"
            :src="user.profileImg"
            draggable="false"
            alt="Profile image"
          >
          <div
            v-else
            class="icon-account color-theme w-100 h-100"
          />
          <div
            v-if="myProfile(user)"
            class="overlay is-flex is-align-items-center is-justify-content-center"
          >
            <div
              v-if="imageSelectPopup?.loading"
              class="button is-loading is-large is-transparent"
            />
            <div
              v-else
              class="icon-edit color-white sz-3"
            />
          </div>
        </div>
        
        <EditableTitle
          class="w-100 is-flex-shrink-1 is-small"
          :edit-button-text="'Edit name'"
          :text="user.displayName ?? ''"
          :placeholder="`@${user.username}`"
          :editable="myProfile(user)"
          :start-edit-callback="startNameEdit"
          :error-handler="errorHandler"
          :validator="text => text.length > 50 ? 'The display name must be at most 50 characters long' : undefined"
          @save="updateName"
        />
      </div>
      <div class="is-flex is-align-items-center mb-4">
        <div class="sz-2 icon-at color-theme" />
        <p class="is-size-5 ml-2 is-break-word">
          {{ user.username }}
        </p>
      </div>
      <div
        v-if="myProfile(user)"
        class="is-flex is-align-items-center mb-4"
      >
        <div
          class="sz-2 color-theme"
          :class="{
            'icon-mail': user.signInProvider === 'password',
            'icon-google': user.signInProvider === 'google.com',
            'icon-github': user.signInProvider === 'github.com',
          }"
        />
        <div class="columns mx-0 my-0 is-align-items-center">
          <div class="column px-0 py-0">
            <p class="is-size-5 ml-2 mr-3 is-break-word">
              {{ user.email }}
            </p>
          </div>
          <div class="column px-0 py-0 is-narrow">
            <button
              v-if="user.signInProvider === 'password'"
              class="button ml-2"
              :class="{ 'is-loading': sendingResetPasswordEmail }"
              :disabled="sendingResetPasswordEmail"
              @click="resetPassword"
            >
              <div class="sz-icon icon-key color-theme" />
              Change password
            </button>
          </div>
        </div>
      </div>
      
      <div class="field is-grouped is-grouped-multiline mb-5">
        <RouterLink
          class="button mr-4 mb-1"
          :to="{ name: 'user-published-variants', params: { username: user?.username } }"
        >
          <div class="sz-icon icon-rocket color-theme" />
          Published variants
        </RouterLink>
        <RouterLink
          v-if="myProfile(user)"
          class="button mb-1"
          :to="{ name: 'user-upvoted-variants', params: { username: user?.username } }"
        >
          <div class="sz-icon icon-heart color-theme" />
          Upvoted variants
        </RouterLink>
      </div>
      
      <div class="content mb-0 pt-4">
        <h4>About:</h4>
        <EditableMarkdown
          :text="user.about"
          :placeholder="'Tell us about yourself!\nYou can use **Markdown** to format your text.'"
          :editable="myProfile(user)"
          :error-handler="errorHandler"
          :char-limit="1000"
          :validator="text => text.length > 1000 ? 'The About section must be at most 1000 characters long' : undefined"
          @save="updateAbout"
        />
      </div>
      
      <div
        v-if="!myProfile(user) && authStore.loggedUser && !authStore.loggedUser.reportedUsers?.includes(user.uid) && !user.banned"
        class="is-flex is-flex-wrap-wrap mt-6"
      >
        <button
          class="button mt-1 mr-4"
          @click="blockUser"
        >
          <div class="sz-icon icon-block color-theme" />
          Block user
        </button>
        <button
          class="button mt-1"
          @click="reportUser"
        >
          <div class="sz-icon icon-flag color-theme" />
          Report user
        </button>
      </div>
      <div
        v-if="!myProfile(user) && authStore.loggedUser?.moderator"
        class="is-flex is-flex-wrap-wrap mt-3"
      >
        <button
          v-if="!user.banned"
          class="button is-danger mt-2 mr-4"
          @click="banUser"
        >
          <div class="sz-icon icon-gavel color-white" />
          Ban user
        </button>
        <button
          v-else
          class="button is-primary mt-2 mr-4"
          @click="unbanUser"
        >
          <div class="sz-icon icon-gavel color-white" />
          Unban user
        </button>
        <button
          class="button is-danger mt-2"
          @click="wipeUser"
        >
          <div class="sz-icon icon-trash color-white" />
          {{ user.banned ? 'Remove data' : 'Ban & Remove data' }}
        </button>
      </div>
      
      <SmartErrorMessage
        v-show="hasError && myProfile(user)"
        class="mt-4"
        :handler="errorHandler"
      />
      
      <button
        v-if="myProfile(user)"
        class="button is-primary mt-6"
        @click="signOut"
      >
        <div class="sz-icon icon-logout color-white" />
        Sign out
      </button>
      
      <div
        v-if="myProfile(user)"
        class="is-flex"
      >
        <div
          class="is-flex is-align-items-center mt-6 pl-2 pr-1 py-2 is-clickable danger-dropdown-container"
          @click="showDangerZone = !showDangerZone"
        >
          <p class="has-text-danger unselectable">
            Danger zone
          </p>
          <div
            class="ml-1 sz-chevron color-danger"
            :class="{ 'icon-chevron-down': !showDangerZone, 'icon-chevron-up': showDangerZone }"
          />
        </div>
      </div>
      
      <div
        v-show="showDangerZone && myProfile(user)"
        class="mt-2 danger-zone-container"
      >
        <button
          class="button is-danger"
          @click="deleteAccount"
        >
          <div class="sz-icon icon-trash color-white" />
          Delete account
        </button>
      </div>
    </div>
    
    
    <div
      v-if="user.latestGames.length > 0"
      class="column is-5 mt-3"
    >
      <div class="is-flex is-align-items-center pb-3">
        <div class="sz-2 icon-star color-theme" />
        <p class="is-size-5 ml-2">
          {{ user.numWinPoints }} {{ user.numWinPoints === 1 ? 'point' : 'points' }}
        </p>
      </div>
      <div
        v-for="game of user.latestGames"
        :key="game.gameId + user.uid"
        class="mx-0 my-5 card"
      >
        <ProfileGameView
          :viewing-user-id="user.uid"
          :game="game"
        />
      </div>
      <button
        v-if="user.latestGames.length < user.numGamesPlayed"
        class="button"
        @click="fetchAllGames"
      >
        View more
      </button>
    </div>
  </div>
  <ImageSelectPopup
    ref="imageSelectPopup"
    :uploaded-image-width="256"
    :show-delete-button="() => user?.profileImg !== undefined"
    @image-uploaded="setProfileImage"
    @remove-image="setProfileImage(undefined)"
    @upload-error="showPopup(
      'Could not upload image',
      'Make sure you uploaded a valid image file and the file size is **200kB** or less.',
      'ok'
    )"
  />
  <PopupWithTextbox
    ref="reportPopup"
    hint="Tell us why (optional)"
    :max-length="250"
  />
</template>

<script setup lang="ts">

  import { onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  
  import { AuthUser, useAuthStore } from '@/stores/auth-user'
  import { ErrorMessageHandler } from '@/helpers/errors/error-message-handler'
  import { User, useUserStore } from '@/stores/user'
  import { returnHome } from '@/helpers/managers/navigation-manager'
  import { showPopup, showPopupImportant } from '@/helpers/managers/popup-manager'
  import { updateTitle } from '@/helpers/web-utils'
  import { useGameStore } from '@/stores/game'
  import { useModeratorStore } from '@/stores/moderator'
  import EditableMarkdown from '@/components/basic-wrappers/EditableMarkdown.vue'
  import EditableTitle from '@/components/basic-wrappers/EditableTitle.vue'
  import ImageSelectPopup from '@/components/image-select/ImageSelectPopup.vue'
  import PopupWithTextbox from '@/components/popup-message/PopupWithTextbox.vue'
  import ProfileGameView from '@/components/lobby/ProfileGameView.vue'
  import SmartErrorMessage from '@/components/basic-wrappers/SmartErrorMessage.vue'
  
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const gameStore = useGameStore()
  const moderatorStore = useModeratorStore()
  
  const user = ref<User | AuthUser>()
  const hasError = ref(false)
  const showDangerZone = ref(false)
  const sendingResetPasswordEmail = ref(false)
  const imageSelectPopup = ref<InstanceType<typeof ImageSelectPopup>>()
  const reportPopup = ref<InstanceType<typeof PopupWithTextbox>>()
  
  const errorHandler = new ErrorMessageHandler(hasError)
  
  // When the route or logged user changes, update the user
  async function updateUser() {
    if (route.name !== 'user-profile') return
    
    const username = route.params.username
    if (!username || typeof username !== 'string') {
      returnHome(400, 'This URL seems to be incorrect.')
      return
    }
    
    if (authStore.loggedUser?.username === username) {
      // User is logged in and is viewing their own profile
      user.value = authStore.loggedUser
      updateTitle(authStore.loggedUser.displayName)
      return
    }
    
    const fetchedUser = await userStore.getUserByUsername(username)
    if (!fetchedUser) {
      returnHome(404, 'We can\'t find the user you were looking for.')
      return
    }
    user.value = fetchedUser
    updateTitle(fetchedUser.displayName)
  }
  watch(route, updateUser)
  watch(authStore, updateUser)
  onMounted(updateUser)
  
  function myProfile(user: User | AuthUser): user is AuthUser {
    return authStore.loggedUser !== null && user.uid === authStore.loggedUser.uid
  }
  
  function startNameEdit(): boolean {
    if (!user.value) {
      throw new Error('User is undefined')
    }
    if (!user.value.renameAllowedAt) {
      // User has never changed their name, continue with the edit
      return true
    }
    if (Date.now() < user.value.renameAllowedAt.valueOf()) {
      showPopup(
        'Cannot edit display name',
        'To prevent spam, you can only change your display name once every **5 minutes**. Please try again later.',
        'ok'
      )
      return false
    }
    return true
  }
  
  async function updateName(name: string) {
    if (!user.value) {
      throw new Error('User is undefined')
    }
    const oldName = user.value.name
    if (!name || name === `@${user.value.username}`) {
      // No name provided, reset to default
      user.value.name = undefined
    } else {
      user.value.name = name
    }
    if (user.value.name === oldName) {
      // Name has not changed, nothing to do
      return
    }
    user.value.updateDisplayName()
    
    try {
      await userStore.storeUser(user.value, true)
      // Update the timestamp to prevent 2 consecutive edits
      user.value.renameAllowedAt = new Date(Date.now() + 5 * 60 * 1000)
    } catch (e) {
      console.error(e)
      user.value.name = oldName
      showPopup(
        'Cannot edit display name',
        'There has been an unexpected error. Please try again later.',
        'ok'
      )
    }
  }
  
  async function updateAbout(newAbout: string) {
    if (!user.value) throw new Error('User is undefined')
    const oldAbout = user.value.about
    user.value.about = newAbout
    try {
      await userStore.storeUser(user.value)
    } catch (e) {
      user.value.about = oldAbout
      console.error(e)
      showPopup(
        'Cannot edit about',
        'There has been an unexpected error. Please try again later.',
        'ok'
      )
    }
  }
  
  function imageClicked() {
    if (!user.value || !myProfile(user.value)) {
      return
    }
    imageSelectPopup.value?.show('default', `profile-images/${user.value.uid}`)
  }
  async function setProfileImage(url: string | undefined) {
    if (!user.value) {
      throw new Error('User is undefined')
    }
    user.value.profileImg = url
    await userStore.storeUser(user.value)
  }
  
  function deleteAccount() {
    showPopup(
      'Delete account',
      '**Your profile data will be deleted immediately, this action cannot be undone.** \
      \n\nThe variants you have created will still be available for other players, but your name will \
      be removed from them (anonymous author). \
      \n\nYour username `' + authStore.loggedUser?.username + '` will become available for anyone to use. \
      \n\nAre you sure you want to delete your account?',
      'yes-no',
      deleteAccountConfirmed
    )
  }
  async function deleteAccountConfirmed() {
    try {
      await authStore.deleteUser()
      router.replace({ name: 'home' })
      showPopup(
        'Account deleted',
        'Your account has been deleted successfully. We are sorry to see you go! \
        \n\nIf you have any feedback, please [open an issue on GitHub](https://github.com/pol-rivero/ReChess/issues).',
        'ok'
      )
    } catch (e) {
      console.error(e)
      showPopup(
        'Account deletion failed',
        'This usually happens because it\'s been some time since you last logged in. \
        \n\nPlease sign out and in again, and try again. If the problem persists, please \
        [open an issue on GitHub](https://github.com/pol-rivero/ReChess/issues). \
        \n\nDo you want to log out now?',
        'yes-no',
        async () => {
          await authStore.signOut()
          router.push({ name: 'home' })
        }
      )
      return
    }
  }
  
  function reportUser() {
    reportPopup.value?.show(
      false,
      'Report and block user',
      'A moderator will review this user\'s profile and ban them it if it violates our rules. \
      \n\nThis action cannot be undone.',
      'ok-cancel',
      async reason => {
        if (!user.value) throw new Error('User is undefined')
        try {
          await userStore.blockUser(user.value.uid, true, reason)
          showPopup(
            'User reported',
            'Report sent successfully. You will stop seeing this user in the online lobby. \
            \n\nThank you for helping us keep ReChess a safe place.',
            'ok'
          )
        } catch (e) {
          console.error(e)
          showPopup(
            'Error',
            'An unexpected error occurred while reporting the user. \
            \n\nThis usually means that the user has already been reported.',
            'ok'
          )
        }
      }
    )
  }
  function blockUser() {
    showPopup(
      'Block user',
      'You will stop seeing this user in the online lobby. This does **not** block the variants created by this user. \
      \n\nThis action cannot be undone.',
      'ok-cancel',
      async () => {
        if (!user.value) throw new Error('User is undefined')
        try {
          await userStore.blockUser(user.value.uid, false)
          showPopup(
            'User blocked',
            'You will no longer see this user.',
            'ok'
          )
        } catch (e) {
          console.error(e)
          showPopup(
            'Error',
            'An unexpected error occurred while blocking the user. \
            \n\nThis usually means that the user has already been blocked.',
            'ok'
          )
        }
      }
    )
  }
  
  function banUser() {
    showPopup(
      'Ban user',
      'You are about to ban this user. This does **not** remove their variants, reports and upvotes. \
      \n\nDo you want to continue?',
      'yes-no',
      async () => {
        if (!user.value) throw new Error('User is undefined')
        try {
          showPopupImportant('⌛', 'Banning user, please wait...', 'ok')
          await moderatorStore.banUser(user.value.uid)
          showPopup(
            'User banned',
            'The user has been successfully banned.',
            'ok',
            () => window.location.reload(),
            () => window.location.reload()
          )
        } catch (e) {
          console.error(e)
          showPopup(
            'Error',
            'An unexpected error occurred while banning the user.\n\n```\n' + e + '\n```',
            'ok'
          )
        }
      }
    )
  }
  function unbanUser() {
    showPopup(
      'Unban user',
      'You are about to lift the ban on this user. The user will recover the ownership of their variants \
      and played games, and will be able to log in again.\n\nDo you want to continue?',
      'yes-no',
      async () => {
        if (!user.value) throw new Error('User is undefined')
        try {
          showPopupImportant('⌛', 'Unbanning user, please wait...', 'ok')
          await moderatorStore.unbanUser(user.value.uid)
          showPopup(
            'User unbanned',
            'The user is no longer banned.',
            'ok',
            () => window.location.reload(),
            () => window.location.reload()
          )
        } catch (e) {
          console.error(e)
          showPopup(
            'Error',
            'An unexpected error occurred while unbanning the user.\n\n```\n' + e + '\n```',
            'ok'
          )
        }
      }
    )
  }
  function wipeUser() {
    showPopup(
      'Wipe user data',
      'This will ban the user and delete all of their **variants** and **reports**. \
      Upvotes will not be removed. Do you want to continue?',
      'ok-cancel',
      async () => {
        if (!user.value) throw new Error('User is undefined')
        try {
          showPopupImportant('⌛', 'Wiping user data, please wait...', 'ok')
          await moderatorStore.wipeUser(user.value.uid)
          showPopup(
            'User wiped',
            'The user has been banned and their variants and reports have been deleted.',
            'ok',
            () => window.location.reload(),
            () => window.location.reload()
          )
        } catch (e) {
          console.error(e)
          showPopup(
            'Error',
            'An unexpected error occurred while wiping the user. \
            \n\n```\n' + e + '\n```',
            'ok'
          )
        }
      }
    )
  }
  
  async function resetPassword() {
    if (!authStore.loggedUser) {
      throw new Error('User must be logged in to reset password')
    }
    sendingResetPasswordEmail.value = true
    try {
      await authStore.sendPasswordResetEmail(authStore.loggedUser.email)
      showPopup('Change password', `We have sent \`${authStore.loggedUser.email}\` an email to reset your password.`, 'ok')
    } catch (e) {
      console.error(e)
      showPopup('Cannot change password at the moment', 'Please try again later.', 'ok')
    }
    sendingResetPasswordEmail.value = false
  }
  
  function signOut() {
    showPopup('Sign out', 'Do you want to log out of your account?', 'yes-no', async () => {
      await authStore.signOut()
      router.push({ name: 'home' })
    })
  }
  
  async function fetchAllGames() {
    // TODO: Add pagination
    if (!user.value) throw new Error('User cannot be set to undefined')
    user.value.latestGames = await gameStore.getUserGames(user.value.uid)
  }
  
</script>


<style scoped lang="scss">
  @import '@/assets/style/variables.scss';
  .sz-chevron{
    width: 1.5rem;
    height: 1.5rem;
  }
  .danger-dropdown-container {
    &:hover {
      background-color: rgba($danger, 0.1);
      border-radius: $radius;
    }
  }
  .danger-zone-container{
    border-left: 1px solid $danger;
    border-width: 0.2rem;
    padding: 1rem;
  }
  
  .profile-image-container {
    width: 7rem;
    height: 7rem;
    @media screen and (max-width: 768px) {
      width: 5rem;
      height: 5rem;
    }
    position: relative;
    margin-left: -0.4rem;
  }
  
  .button.is-transparent {
    background-color: transparent;
    border: none;
    font-size: 3rem;
    &::after {
      border: 4px solid hsl(0, 0%, 86%);
      border-right-color: transparent;
      border-bottom-color: transparent;
    }
  }
  
  .profile-image-container.editable {
    cursor: pointer;
    
    .overlay {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      top: 0;
      left: 0;
      background-color: rgba(0, 0, 0, 0.6);
      opacity: 0;
      transition: all 0.1s;
      -webkit-transition: all 0.1s;
    }
    
    &:hover .overlay, &.force-show-overlay .overlay {
      opacity: 1;
    }
  }
  
</style>
