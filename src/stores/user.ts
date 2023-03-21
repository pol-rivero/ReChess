import { defineStore } from 'pinia'
import { UserDB } from '@/firebase/db'
import type { UserDoc } from '@/firebase/db/schema'
import { ref } from 'vue'

export class User {
  public readonly uid: string
  public readonly username: string
  public readonly name?: string
  public readonly about?: string
  public readonly profileImg?: string
  public readonly displayName: string
  
  constructor(id: string, doc?: UserDoc) {
    const name = doc?.name ?? undefined // null -> undefined
    const profileImg = doc?.profileImg ?? undefined
    
    // If the user has logged in with a third-party provider, the document
    // doesn't exist until they choose a username. Store '' temporarily until the user chooses a username.
    this.uid = id
    this.username = doc?.IMMUTABLE.username ?? ''
    this.name = name
    this.about = doc?.about
    this.profileImg = profileImg
    this.displayName = name ?? `@${this.username}`    
  }
}

export const useUserStore = defineStore('user', () => {
  const lastUserCache = ref<User | undefined>(undefined)
  
  async function getUserById(id: string): Promise<User | undefined> {
    if (lastUserCache.value?.uid === id) return lastUserCache.value
    
    const doc = await UserDB.getUserById(id)
    if (!doc) return undefined
    lastUserCache.value = new User(id, doc)
    return lastUserCache.value
  }
  
  async function getUserByUsername(username: string): Promise<User | undefined> {
    if (lastUserCache.value?.username === username) {
      return lastUserCache.value
    }
    
    const id = await UserDB.getId(username)
    if (!id) return undefined
    const doc = await UserDB.getUserById(id)
    if (!doc) return undefined
    lastUserCache.value = new User(id, doc)
    return lastUserCache.value
  }
  
  return { getUserById, getUserByUsername }
})
