
import { Timestamp } from 'firebase-admin/firestore'
import type { Change, EventContext } from 'firebase-functions'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'

import { useAdmin, batchedUpdate } from './helpers'
import type { UserDoc } from 'db/schema'


/**
 * Called when a user document changes. Checks if the name has changed and,
 * if so, updates the name also in the denormalized fields.
 * @param {Change<QueryDocumentSnapshot>} change The change object
 * @param {EventContext<Params>} context The event context
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function renameUser(
  change: Change<QueryDocumentSnapshot>,
  context: EventContext<{ userId: string }>
): Promise<void> {
  const TIMEOUT_SECONDS = 3600 * 24 // 1 day
  
  const admin = await useAdmin()
  const db = admin.firestore()
  
  const { userId } = context.params
  const before = change.before.data() as UserDoc
  const after = change.after.data() as UserDoc
  // When the user is updated, check if the name has changed
  if (before.name === after.name) return
  
  // If this write was allowed by the rules, the current timestamp must be after the renameAllowedAt
  const newName = after.name || `@${after.IMMUTABLE.username}`
  await updateName(db, userId, newName, false)
  
  // Update the timeout to prevent spamming
  const timeout = Date.now() + 1000 * TIMEOUT_SECONDS
  const timeoutDate = new Date(timeout)
  const timeoutTimestamp = Timestamp.fromDate(timeoutDate)
  // This will trigger renameUser again, but the name won't have changed
  db.collection('users').doc(userId).update({ renameAllowedAt: timeoutTimestamp })
}


/**
 * Update the name of a user in all the denormalized fields across the database
 * (except for the user document itself)
 * @param {FirebaseFirestore.Firestore} db The Firestore database
 * @param {string} userId The UID of the user to update
 * @param {string} newName The new name of the user
 * @param {boolean} removeId If true, the user ID will be removed from the denormalized fields
 * to indicate that the user no longer exists
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export async function updateName(
  db: FirebaseFirestore.Firestore,
  userId: string,
  newName: string,
  removeId: boolean
): Promise<void> {
  // Update the creator name of the variants this user has created
  const updatedVariants = await db.collection('variants').where('IMMUTABLE.creatorId', '==', userId).get()
  await batchedUpdate(db, updatedVariants, (batch, ref) => {
    batch.update(ref, {
      'IMMUTABLE.creatorDisplayName': newName,
      'IMMUTABLE.creatorId': removeId ? null : userId,
    })
  })
  
  // Update the opponent name of the games this user has played as white
  const updatedGamesWhite = await db.collection('games').where('IMMUTABLE.whiteId', '==', userId).get()
  await batchedUpdate(db, updatedGamesWhite, (batch, ref) => {
    batch.update(ref, {
      'IMMUTABLE.whiteDisplayName': newName,
      'IMMUTABLE.whiteId': removeId ? null : userId,
    })
  })
  
  // Update the opponent name of the games this user has played as black
  const updatedGamesBlack = await db.collection('games').where('IMMUTABLE.blackId', '==', userId).get()
  await batchedUpdate(db, updatedGamesBlack, (batch, ref) => {
    batch.update(ref, {
      'IMMUTABLE.blackDisplayName': newName,
      'IMMUTABLE.blackId': removeId ? null : userId,
    })
  })
}
