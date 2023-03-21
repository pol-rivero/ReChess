import { ref } from 'vue'
import { defineStore } from 'pinia'

import { auth } from '@/firebase'
import { UserDB } from '@/firebase/db'
import { User } from '@/stores/user'
import { RechessError } from '@/utils/errors/RechessError'
import { UserNotFoundError } from '@/utils/errors/UserNotFoundError'

import * as fb from 'firebase/auth'
import type { UserDoc } from '@/firebase/db/schema'

const AUTH_USER_KEY = 'loggedUser'


export class AuthUser extends User {
  public readonly email: string
  public readonly verified: boolean
  public readonly signInProvider: 'password' | 'google.com' | 'github.com'
  
  constructor(authUser: fb.User, dbUser: UserDoc | undefined) {
    if (!authUser.email) throw new Error('User has no email')
    super(authUser.uid, dbUser)
    
    this.email = authUser.email
    this.verified = authUser.emailVerified
    
    if (authUser.providerData.length === 0) {
      throw new Error('User has no provider data')
    }
    const p = authUser.providerData[0].providerId
    if (p !== 'password' && p !== 'google.com' && p !== 'github.com') {
      throw new Error('Unknown provider: ' + p)
    }
    this.signInProvider = p
  }
}

export const useAuthStore = defineStore('auth-user', () => {
  const loggedUser = ref<AuthUser|null>(getAuthUser())
  
  // Called when user signs in or out (or when the page is refreshed)
  fb.onAuthStateChanged(auth, updateUser)
  async function updateUser(newUser: fb.User | null) {
    if (!newUser || !newUser.email) {
      persistUser(null)
      return
    }
    // We need to fetch the user fields (username, about) from the database
    const user = await UserDB.getUserById(newUser.uid)
    persistUser(new AuthUser(newUser, user))
  }
  
  function persistUser(user: AuthUser|null) {
    loggedUser.value = user
    if (!user) localStorage.removeItem(AUTH_USER_KEY)
    else localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
  function getAuthUser(): AuthUser|null {
    const user = localStorage.getItem(AUTH_USER_KEY)
    if (!user) return null
    return JSON.parse(user)
  }
  
  
  // Attemps to log in with an email and password, throws an error if it fails (e.g. wrong password or user does not exist)
  // Updates the stored user if successful
  async function emailLogIn(email: string, password: string): Promise<void> {
    try {
      const credential = await fb.signInWithEmailAndPassword(auth, email, password)
      await updateUser(credential.user)
    } catch (e: any) {
      switch (e.code) {
        case 'auth/user-not-found':
          throw new UserNotFoundError()
        case 'auth/wrong-password':
          throw new RechessError('WRONG_PASSWORD')
        default:
          console.error('Unknown error while logging in with email and password', e)
          throw e
      }
    }
  }
  
  
  // Creates a new user with an email and password, and updates the stored user
  async function emailRegister(email: string, username: string, password: string): Promise<void> {
    let credential: fb.UserCredential
    try {
      credential = await fb.createUserWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      switch (e.code) {
        case 'auth/email-already-in-use':
          throw new RechessError('EMAIL_ALREADY_IN_USE')
        default:
          throw e
      }
    }
    
    try {
      await UserDB.createUser(credential.user, username)
    } catch (e) {
      // If the database update fails, delete the user auth
      await credential.user.delete()
      await updateUser(null)
      console.error('Failed to create user in database', e)
      throw new RechessError('CANNOT_CREATE_USER')
    }
    
    await updateUser(credential.user)
  }
  
  // Creates a new user that is already authenticated with a third party provider
  async function thirdPartyRegister(username: string): Promise<void> {
    if (!auth.currentUser) throw new Error('User needs to be logged in with a third party provider')
    try {
      const userDoc = await UserDB.createUser(auth.currentUser, username)
      // Success, update the user
      persistUser(new AuthUser(auth.currentUser, userDoc))
    } catch (e) {
      console.error('Failed to create user in database', e)
      throw new RechessError('CANNOT_CREATE_USER')
    }
  }
  
  
  // Signs out the user and updates the store
  async function signOut(): Promise<void> {
    await auth.signOut()
  }
  
  async function sendEmailVerification() {
    if (!auth.currentUser) throw new Error('User is not logged in')
    await fb.sendEmailVerification(auth.currentUser, {
      url: window.location.origin,
      handleCodeInApp: true
    })
  }
  
  async function sendResetPasswordEmail() {
    if (!loggedUser.value) throw new Error('User is not logged in')
    await fb.sendPasswordResetEmail(auth, loggedUser.value.email, {
      url: window.location.origin,
      handleCodeInApp: true
    })
  }
  
  async function getProvider(email: string): Promise<string> {
    const methods = await fb.fetchSignInMethodsForEmail(auth, email)
    if (methods.length === 0) throw new UserNotFoundError()
    if (methods.length > 1) throw new Error('User has multiple sign in methods')
    return methods[0]
  }
  
  // Returns true if a username is available
  async function checkUsername(username: string): Promise<boolean> {
    return (await UserDB.getId(username)) === undefined
  }

  return {
    emailLogIn, emailRegister, thirdPartyRegister, signOut,
    sendEmailVerification, sendResetPasswordEmail, getProvider, checkUsername, updateUser,
    loggedUser
  }
})



