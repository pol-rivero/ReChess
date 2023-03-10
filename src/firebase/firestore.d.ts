
import { Timestamp } from 'firebase/firestore'

// users/{userId}
export interface UserDoc {
  name: string | null
  about: string
  profileImg: string | null
  SERVER: {
    username: string
    numWins: number
  }
}
// users/{userId}/private/doc
export interface UserPrivateDoc {
  SERVER: {
    email: string
    banned: boolean
  }
}
// users/{userId}/games/{gameId}
export interface UserGameDoc {
  timePlayed: Timestamp
  result: 'win' | 'lose' | 'draw'
  variantName: string
}

// userUpvotes/{userID}
export interface UserUpvotesDoc {
  [variantId: string]: {
    timeUpvoted: Timestamp
    variantName: string
  }
}

// variants/{variantId}
export interface VariantDoc {
  name: string
  creatorId: string
  description: string
  // TODO: Variant itself
  SERVER: {
    numUpvotes: number
  }
}
