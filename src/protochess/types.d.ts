
// PUBLIC API

export type Player = 'white' | 'black'

/** 1-char string */
export type PieceId = string

// Only the placement of the pieces, in the FEN format
type FenPlacements = string

/** See [this document](https://github.com/pol-rivero/protochess-engine/tree/master/docs/FEN.md)
 *  for the custom FEN format */
type FullFen = string

type Option<T> = T | null | undefined

export interface Protochess {
  /** Console-friendly representation of the current state */
  toString(): Promise<string>,
  /** Get the player that has to move */
  playerToMove(): Promise<Player>,
  /** Check if the current position is valid. Throws an error if it's not. */
  validatePosition(): Promise<void>,
  /** Play a (legal) move. Returns the result of making this move. */
  makeMove(move: MoveInfo): Promise<MakeMoveResult>,
  /** Same as makeMove, but accepts a string in long algebraic notation (e.g. "e2e4") */
  makeMoveStr(move: string): Promise<MakeMoveResult>,
  /** Searches the best move at the given depth. Returns the move and the evaluation of the position. */
  getBestMove(depth: number): Promise<MoveInfoWithEval>,
  /** Searches the best move for the given time (in seconds). Returns the move, the evaluation of the position, and the depth reached. */
  getBestMoveTimeout(time: number): Promise<MoveInfoWithEvalDepth>,
  /** Set the current state, formed by an InitialState, and the list of moves that were played.
    * If a FEN is provided, it will be applied before the moves.
    * After calling `setState()`, use `getStateDiff()` to update the GUI.
    * Returns the result of the **last move** in the move history, or `Ok` if there was none. */
  setState(state: GameState): Promise<MakeMoveResult>,
  /** Load a user-provided FEN string. See FullFen for the format.
    * After calling `loadFen()`, use `getStateDiff()` to update the GUI */
  loadFen(fen: FullFen): Promise<void>,
  /** Get the full current state, which can later be used in `setState()` */
  getState(): Promise<GameState>,
  /** Get the current state, but only the information that can change during a game */
  getStateDiff(): Promise<StateDiff>,
  /** Get the list of currently played moves in algebraic notation */
  getMoveHistory(): Promise<string[]>,
  /** Get all possible moves for the current player (for each origin square, what are the possible destinations) */
  legalMoves(): Promise<MoveList[]>,
  /** For a given move (from, to), returns the IDs of the pieces that can be promoted to */
  possiblePromotions(from: [number, number], to: [number, number]): Promise<PieceId[]>,
  
  // Multi-threading control
  /** Returns the maximum number of threads that can be used in `setNumThreads()` */
  getMaxThreads(): Promise<number>,
  setNumThreads(threads: number): Promise<void>,
}

export type MakeMoveFlag =
  'Ok' |
  'IllegalMove' |
  'Checkmate' |
  'LeaderCaptured' |
  'AllPiecesCaptured' |
  'PieceInWinSquare' |
  'CheckLimit' |
  'Stalemate' |
  'Repetition' |
  'Resignation'
  
export type MakeMoveWinner = Player | 'none'

/** @see {isMakeMoveResult} ts-auto-guard:type-guard */
export interface MakeMoveResult {
  flag: MakeMoveFlag,
  winner: MakeMoveWinner,
  exploded: [number, number][],
  moveNotation?: string,
}

/** @see {isMoveInfo} ts-auto-guard:type-guard */
export interface MoveInfo {
  // x, y coordinates between 0 and 15
  // (0, 0 is the bottom left corner)
  // promotion is a piece id (string of 1 character)
  from: [number, number],
  to: [number, number],
  promotion?: PieceId,
}
export interface MoveInfoWithEval extends MoveInfo {
  evaluation: number | `#${number}`,
}
export interface MoveInfoWithEvalDepth extends MoveInfoWithEval {
  depth: number,
}
/** @see {isMoveList} ts-auto-guard:type-guard */
export interface MoveList {
  x: number,
  y: number,
  moves: MoveInfo[],
}


/** @see {isStateDiff} ts-auto-guard:type-guard */
export interface StateDiff {
  fen: FenPlacements, // Piece placements at the current position
  inCheck: boolean,
  playerToMove: 0 | 1,
}

// Immutable properties of the game
/** @see {isInitialState} ts-auto-guard:type-guard */
export interface InitialState {
  fen: FenPlacements, // Initial piece placements for this variant
  playerToMove: 0 | 1, // First player to move in this variant (0 = White, 1 = Black)
  pieceTypes: PieceDefinition[],
  boardWidth: number,
  boardHeight: number,
  globalRules: GlobalRules,
}

/** @see {isGameState} ts-auto-guard:type-guard */
export interface GameState {
  initialState: InitialState,
  initialFen?: FullFen,
  moveHistory: MoveInfo[],
}

/** @see {isVariant} ts-auto-guard:type-guard */
export interface Variant extends InitialState {
  pieceTypes: FullPieceDef[],
  displayName: string,
  description: string,
  tags: string[],
}

/** @see {isPublishedVariant} ts-auto-guard:type-guard */
export interface PublishedVariant extends Variant {
  uid: string,
  creationTime: Date,
  creatorDisplayName: string,
  creatorId?: string,
  numUpvotes: number,
  popularity: number,
  loggedUserUpvoted: boolean,
}

export interface VariantGameState extends GameState {
  initialState: Variant,
}


// Piece properties that affect the game logic
/** @see {isPieceDefinition} ts-auto-guard:type-guard */
export interface PieceDefinition {
  ids: [Option<PieceId>, Option<PieceId>],
  notationPrefix: [Option<string>, Option<string>],
  isLeader: boolean,
  castleFiles?: [number, number],
  isCastleRook: boolean,
  explodeOnCapture: boolean,
  explosionDeltas: [number, number][],
  immuneToExplosion: boolean,
  promotionSquares: [number, number][],
  promoVals: [PieceId[], PieceId[]],
  doubleJumpSquares: [number, number][],
  attackSlidingDeltas: [number, number][][],
  attackJumpDeltas: [number, number][],
  attackNorth: boolean,
  attackSouth: boolean,
  attackEast: boolean,
  attackWest: boolean,
  attackNortheast: boolean,
  attackNorthwest: boolean,
  attackSoutheast: boolean,
  attackSouthwest: boolean,
  translateJumpDeltas: [number, number][],
  translateSlidingDeltas: [number, number][][],
  translateNorth: boolean,
  translateSouth: boolean,
  translateEast: boolean,
  translateWest: boolean,
  translateNortheast: boolean,
  translateNorthwest: boolean,
  translateSoutheast: boolean,
  translateSouthwest: boolean,
  winSquares: [number, number][],
}

// Piece properties that are only used for the GUI
export interface FullPieceDef extends PieceDefinition {
  displayName: string,
  imageUrls: [Option<string>, Option<string>],
}


export interface GlobalRules {
  capturingIsForced: boolean,
  checkIsForbidden: boolean,
  stalematedPlayerLoses: boolean,
  invertWinConditions: boolean,
  repetitionsDraw: number,
  checksToLose: number,
}



// Interface for the WASM module

export interface IWasmModule {
  supportsThreads: Promise<boolean>,
  wasmObject: {
    toString(): Promise<unknown>,
    playerToMove(): Promise<unknown>,
    validatePosition(): Promise<unknown>,
    makeMove(move: MoveInfo): Promise<unknown>,
    makeMoveStr(moveStr: string): Promise<unknown>,
    getBestMove(depth: number): Promise<unknown>,
    getBestMoveTimeout(time: number): Promise<unknown>,
    setState(state: GameState): Promise<unknown>,
    loadFen(fen: FullFen): Promise<unknown>,
    getState(): Promise<unknown>,
    getStateDiff(): Promise<unknown>,
    getMoveHistory(): Promise<unknown>,
    legalMoves(): Promise<unknown>,
    possiblePromotions(fromX: number, fromY: number, toX: number, toY: number): Promise<unknown>,
    getMaxThreads(): Promise<unknown>,
    setNumThreads(threads: number): Promise<unknown>,
  }
  init(): Promise<void>,
}

export type IWasmModuleConstructor = new() => Promise<IWasmModule>

/** @see {isGetBestMoveResult} ts-auto-guard:type-guard */
export interface GetBestMoveResult {
  moveInfo: MoveInfo,
  evaluation: number,
}

/** @see {isGetBestMoveTimeoutResult} ts-auto-guard:type-guard */
export interface GetBestMoveTimeoutResult {
  moveInfo: MoveInfo,
  evaluation: number,
  depth: number,
}
