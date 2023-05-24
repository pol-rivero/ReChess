
import { type CallableContext, HttpsError } from 'firebase-functions/v1/https'
import { FieldValue } from 'firebase-admin/firestore'
import { useAdmin } from '../helpers'
import type { CancelledGameDoc, GameDoc } from 'db/schema'
import type { Timestamp } from 'firebase/firestore'

/**
 * Called directly by the client when it detects that the opponent has made an
 * illegal move. This function will cancel the game immediately.
 * The cancelled game will be moved to the `cancelledGames` collection for
 * the moderators to review.
 * @param {any} data The data passed to the function
 * @param {string} data.gameId The game to cancel
 * @param {string} data.reason The user-provided reason why the game was cancelled
 * @param {CallableContext} context The context of the function call
 * @return {Promise<void>} A promise that resolves when the function completes
 */
export default async function(data: unknown, context: CallableContext): Promise<void> {
  // Check user authentication
  if (!context.app) {
    throw new HttpsError('unauthenticated', 'The function must be called from an App Check verified app.')
  }
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }
  if (!context.auth.token.email_verified) {
    throw new HttpsError('unauthenticated', 'The email is not verified.')
  }
  
  // Validate input
  const { gameId, reason } = data as { gameId: unknown, reason: unknown }
  if (!gameId || !reason) {
    throw new HttpsError('invalid-argument', 'The function must be called with a gameId and reason.')
  }
  if (typeof gameId !== 'string') {
    throw new HttpsError('invalid-argument', 'The gameId must be a string.')
  }
  if (typeof reason !== 'string') {
    throw new HttpsError('invalid-argument', 'The reason must be a string.')
  }
  if (reason.length > 500) {
    throw new HttpsError('invalid-argument', 'The reason must be at most 500 characters.')
  }
  
  const { db } = await useAdmin()
  
  // Fetch the game
  const gameRef = db.collection('games').doc(gameId)
  const gameSnapshot = await gameRef.get()
  if (!gameSnapshot.exists) {
    throw new HttpsError('not-found', 'The game does not exist.')
  }
  const gameDoc = gameSnapshot.data() as GameDoc
  
  // Check that the caller is a player in the game
  if (context.auth.uid !== gameDoc.IMMUTABLE.whiteId && context.auth.uid !== gameDoc.IMMUTABLE.blackId) {
    throw new HttpsError('permission-denied', 'The function must be called by either the white or black player.')
  }
  
  // Add the game to the cancelledGames collection
  const cancelledGameDoc: CancelledGameDoc = {
    ...gameDoc,
    cancelledByUserId: context.auth.uid,
    cancelReason: reason,
    cancelTime: FieldValue.serverTimestamp() as Timestamp,
  }
  const cancelledGameRef = db.collection('cancelledGames').doc(gameId)
  await cancelledGameRef.set(cancelledGameDoc)
  
  // Delete the game from the games collection
  await gameRef.delete()
}
