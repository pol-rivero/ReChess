
import { notInitialized, setupTestUtils, assertFails, assertSucceeds, type TestUtilsSignature } from './utils'
import { setupJest } from './init'

import type { LobbySlotDoc, UserDoc, VariantDoc } from '@/firebase/db/schema'

const MY_ID = 'my_id'
const MY_EMAIL = 'my@email.com'

let { get, query, set, update, add, remove, now, afterSeconds }: TestUtilsSignature = notInitialized()

setupJest('lobby-tests', env => {
  ({ get, query, set, update, add, remove, now, afterSeconds } = setupTestUtils(env, MY_ID, MY_EMAIL))
})


async function setupUsersAndVariant() {
  const alice: UserDoc = {
    name: 'Alice',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'alice',
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  const bob: UserDoc = {
    name: 'Bob',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'bob',
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  const my_user: UserDoc = {
    name: 'My name',
    about: '',
    profileImg: null,
    IMMUTABLE: {
      username: 'my_username',
      numWins: 0,
      renameAllowedAt: null,
    },
  }
  const variant: VariantDoc = {
    name: 'My variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'Alice',
    creatorId: 'alice_id',
    numUpvotes: 0,
    initialState: '{}',
  }
  await Promise.all([
    set('admin', alice, 'users', 'alice_id'),
    set('admin', bob, 'users', 'bob_id'),
    set('admin', my_user, 'users', MY_ID),
    set('admin', variant, 'variants', 'variant_id'),
  ])
}

async function setupLobbySlot(creator: 'alice'|'bob'|'myself', challenger: 'alice'|'bob'|'myself'|null = null, gameDocId: string|null = null) {
  const [creatorId, creatorDisplayName] =
    creator === 'alice' ? ['alice_id', 'Alice'] :
    creator === 'bob' ? ['bob_id', 'Bob'] :
    [MY_ID, 'My name']
  const [challengerId, challengerDisplayName] =
    challenger === 'alice' ? ['alice_id', 'Alice'] :
    challenger === 'bob' ? ['bob_id', 'Bob'] :
    challenger === 'myself' ? [MY_ID, 'My name'] :
    [null, null]
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName,
      timeCreated: now(),
      requestedColor: 'random',
    },
    challengerId,
    challengerDisplayName,
    gameDocId,
  }
  await set('admin', slot, 'variants', 'variant_id', 'lobby', creatorId)
}



test('anyone can read lobby entries for a variant', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice', 'bob')
  
  const snapshot = await get('not logged', 'variants', 'variant_id', 'lobby', 'alice_id')
    
  if (!snapshot.exists()) {
    throw new Error('Document does not exist')
  }
  expect(snapshot.data().IMMUTABLE.creatorDisplayName).toBe('Alice')
  expect(snapshot.data().challengerId).toBe('bob_id')
  expect(snapshot.data().challengerDisplayName).toBe('Bob')
  
  const queryResult = await query('not logged', 'variants/variant_id/lobby')
  expect(queryResult.size).toBe(1)
  expect(queryResult.docs[0].data().challengerDisplayName).toBe('Bob')
})



// STEP 1: Create a lobby slot


test('can create lobby slot', async () => {
  await setupUsersAndVariant()
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot create lobby slot if not authenticated', async () => {
  await setupUsersAndVariant()
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('unverified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', 'other_id')
  )
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot create lobby slot for a variant that does not exist', async () => {
  await setupUsersAndVariant()
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'wrong_id', 'lobby', MY_ID)
  )
})

test('cannot create 2 entries for the same variant', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('myself')
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    add('verified', slot, 'variants', 'variant_id', 'lobby')
  )
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('can create 2 entries for different variants', async () => {
  await setupUsersAndVariant()
  const variant: VariantDoc = {
    name: 'Another variant',
    description: 'Variant description',
    creationTime: now(),
    creatorDisplayName: 'Bob',
    creatorId: 'bob_id',
    numUpvotes: 0,
    initialState: '{}',
  }
  await set('admin', variant, 'variants', 'variant_id_2')
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id_2', 'lobby', MY_ID)
  )
})

test('2 creators can create entries for the same variant', async () => {
  await setupUsersAndVariant()
  await setupLobbySlot('alice', 'bob')
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot create slot with challenger already set', async () => {
  await setupUsersAndVariant()
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: 'alice_id',
    challengerDisplayName: 'Alice',
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.challengerId = null
  slot.challengerDisplayName = null
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('cannot create slot with game id already set', async () => {
  await setupUsersAndVariant()
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: 'game_id',
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.gameDocId = null
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('creator display name must be correct', async () => {
  await setupUsersAndVariant()
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'NOT My name',
      timeCreated: now(),
      requestedColor: 'random',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.IMMUTABLE.creatorDisplayName = 'My name'
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('time created must be correct', async () => {
  await setupUsersAndVariant()
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: afterSeconds(123),
      requestedColor: 'black',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.IMMUTABLE.timeCreated = now()
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})

test('requested color must be correct', async () => {
  await setupUsersAndVariant()
  
  const slot: LobbySlotDoc = {
    IMMUTABLE: {
      creatorDisplayName: 'My name',
      timeCreated: now(),
      requestedColor: 'wrong_color' as 'white',
    },
    challengerId: null,
    challengerDisplayName: null,
    gameDocId: null,
  }
  await assertFails(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
  slot.IMMUTABLE.requestedColor = 'white'
  await assertSucceeds(
    set('verified', slot, 'variants', 'variant_id', 'lobby', MY_ID)
  )
})



// STEP 2: Challenger joins the lobby slot





/*
- can update slot as challenger
- challenger must be verified
- challenger must be different from creator
- challenger must be self
*/
