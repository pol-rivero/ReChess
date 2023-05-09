
import { FieldValue } from 'firebase-admin/firestore'
import { updatePrivateCache } from '@/user/helpers/update-private-cache'
import { useAdmin } from '@/helpers'

/**
 * Called when a user upvotes a variant. Increments the upvote count of the variant and
 * updates the private cache of the user that upvoted it.
 * @param {string} variantId UID of the variant that was upvoted
 * @param {string} upvoterId UID of the user who upvoted the variant
 * @return {Promise<void>} A promise that resolves when the function is done
 */
export default async function(variantId: string, upvoterId: string): Promise<void> {
  const admin = await useAdmin()
  const db = admin.firestore()
  const baseDoc = db.collection('variants').doc(variantId)

  baseDoc.update('numUpvotes', FieldValue.increment(1)).catch((err) => {
    console.error('Error while incrementing upvotes or reports:', variantId, upvoterId)
    console.error(err)
  })
  
  await updatePrivateCache('upvoteVariant', variantId, upvoterId)
}
