# Implementation Plan: Multiplayer Room Code

## Overview

Transform Geo Game Table into a Jackbox-style multiplayer party game. Implementation proceeds from shared infrastructure → backend server → host frontend → player frontend → PWA support, with each step leaving the app in a working state.

## Tasks

- [ ] 1. Set up project structure and shared modules
  - [ ] 1.1 Create shared protocol constants and validation module
    - Create `shared/protocol.js` with all message type constants (createRoom, joinRoom, startGame, submitAction, etc.)
    - Create `shared/validation.js` with room code format validation (4 chars from A-Z, 2-9), player name validation (1-16 chars, letters/numbers/spaces, trimmed), and game config validation (mode, timer 5-45, points 5-50, difficulty pool enum)
    - Export both as CommonJS modules usable by server and importable via `<script>` tag on client
    - _Requirements: 1.1, 2.1, 2.3, 9.1_

  - [ ] 1.2 Create server project scaffolding
    - Create `server/` directory with `package.json` (name: "geo-game-server", dependencies: `ws`)
    - Create `server/index.js` entry point with HTTP server, health-check endpoint (`GET /health` returning `{ activeRooms: N }`), and WebSocket upgrade handling
    - Ensure `data/countries.js` is loadable from the server via require/import
    - _Requirements: 13.2, 13.4, 13.5_

  - [ ]* 1.3 Write property tests for room code generation and validation
    - **Property 1: Room code generation produces valid, unique codes**
    - **Validates: Requirements 1.1, 1.2**
    - Set up `fast-check` as a dev dependency in `server/package.json`
    - Create `server/tests/roomCode.property.test.js`

  - [ ]* 1.4 Write property tests for name and config validation
    - **Property 3: Player name validation accepts valid names and rejects invalid or duplicate names**
    - **Property 10: Game configuration validation**
    - **Validates: Requirements 2.3, 2.4, 9.1**
    - Create `server/tests/validation.property.test.js`

- [ ] 2. Implement Room Manager
  - [ ] 2.1 Implement room creation and lifecycle
    - Create `server/roomManager.js` with: `createRoom(hostWs)`, `getRoom(code)`, `deleteRoom(code)`, `generateRoomCode(existingCodes)`
    - Room code uses charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 chars, excludes 0/1/O/I)
    - Track active rooms in a Map, enforce one room per host connection
    - Implement 5-minute inactivity timeout cleanup with `setInterval`
    - Handle "all codes exhausted" edge case
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

  - [ ]* 2.2 Write property test for join validation
    - **Property 2: Join validation enforces room state and capacity**
    - **Validates: Requirements 2.1, 2.6, 2.8**
    - Create `server/tests/joinValidation.property.test.js`

  - [ ] 2.3 Implement player join and lobby management
    - Add `joinRoom(roomCode, playerName, ws)` to room manager or game engine
    - Validate room exists, is in lobby state, has < 8 players, name is unique (case-insensitive)
    - Assign player UUID, track join order, set connected state
    - Broadcast `playerJoined` to host and all players
    - Send `joinSuccess` with lobby state to joining player
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 2.4 Write property test for game start validation
    - **Property 4: Game start requires minimum player count**
    - **Validates: Requirements 3.4, 3.5**
    - Create `server/tests/gameStart.property.test.js`

- [ ] 3. Implement Game Engine
  - [ ] 3.1 Implement game state initialization and round management
    - Create `server/gameEngine.js` with `startGame(room, config)`, `advanceRound(room)`, `getNextClueGiver(room)`
    - Build deck from `data/countries.js` filtered by difficulty pool
    - Assign clue-giver by join order rotation, skip disconnected players
    - Broadcast `gameStarted` and `roundStarted` messages with role-appropriate card data (full card to host + clue-giver, null to guessers)
    - _Requirements: 3.4, 7.1, 7.2, 7.6, 7.7_

  - [ ]* 3.2 Write property tests for rotation logic
    - **Property 7: Clue-giver rotation follows join order**
    - **Property 8: Rotation skips disconnected players**
    - **Validates: Requirements 7.2, 7.6, 7.7, 8.7**
    - Create `server/tests/rotation.property.test.js`

  - [ ] 3.3 Implement action processing (questions, guesses, clue reveals)
    - Add `processAction(room, playerId, action)` — validates player is in room, validates action type
    - For questions: increment count, reject if cap (10) reached, broadcast `actionBroadcast`
    - For guesses: case-insensitive exact match against card name, calculate score (stars + speed bonus if Q ≤ 5), update scores, broadcast result
    - For clue reveals: mark clue/nearby as revealed, broadcast `clueRevealed`
    - Send `actionAck` to originating player
    - Reject invalid actions without mutating state
    - _Requirements: 6.3, 6.4, 6.6, 9.5, 9.6, 9.7_

  - [ ]* 3.4 Write property tests for scoring and question cap
    - **Property 11: Scoring formula correctness**
    - **Property 12: Question cap enforcement**
    - **Property 13: Guess matching uses case-insensitive exact comparison**
    - **Validates: Requirements 9.5, 9.6, 9.7**
    - Create `server/tests/scoring.property.test.js`

  - [ ]* 3.5 Write property test for invalid action rejection
    - **Property 5: Server rejects invalid actions without state mutation**
    - **Validates: Requirements 6.3, 6.4**
    - Create `server/tests/invalidAction.property.test.js`

  - [ ] 3.6 Implement win conditions and game end
    - Add `checkGameEnd(room)` — checks timer expiry (finish current card) or points target reached
    - Host can end game manually via `hostEndGame` message
    - Broadcast `gameEnded` with winner, final scores, stats (rounds, correct guesses, total points)
    - Transition room state to "ended", schedule cleanup
    - _Requirements: 9.3, 9.4_

  - [ ]* 3.7 Write property test for win condition
    - **Property 14: Win condition triggers game end**
    - **Validates: Requirements 9.4**
    - Create `server/tests/winCondition.property.test.js`

- [ ] 4. Implement Timer Service and Reconnection
  - [ ] 4.1 Implement timer service
    - Create `server/timerService.js` with `startTimer(roomCode, durationSec, onTick, onExpire)`, `stopTimer(roomCode)`, `getRemainingTime(roomCode)`
    - Tick every 1 second, broadcast `timerTick` to all clients in room
    - On expiry: allow current card to finish, then trigger game end
    - _Requirements: 9.2, 9.3_

  - [ ] 4.2 Implement disconnection and reconnection handling
    - Track `disconnectedAt` timestamp when WebSocket closes
    - 60-second reconnection window: retain player state and scores
    - On reconnect within window: restore player, send full game state, broadcast `playerReconnected`
    - After 60s: remove player from room and rotation, broadcast `playerLeft`
    - If clue-giver disconnects: 15-second timeout then advance round to next connected player
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 4.3 Write property test for reconnection state restoration
    - **Property 9: Reconnection restores full player state**
    - **Validates: Requirements 8.2**
    - Create `server/tests/reconnection.property.test.js`

- [ ] 5. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement WebSocket message routing and broadcast
  - [ ] 6.1 Wire message routing in server index
    - In `server/index.js`, implement `routeMessage(ws, message)` that parses JSON, validates message structure, and dispatches to room manager or game engine based on `type` field
    - Handle ping/pong for connection health
    - Send full game state on new connection (`WebSocket open` event)
    - Handle unknown message types with error response
    - _Requirements: 6.1, 6.5, 6.7_

  - [ ] 6.2 Implement ordered broadcast system
    - `broadcastToRoom(roomCode, message)` sends to all connected clients (host + players) in the order events were processed
    - `sendToClient(ws, message)` wraps JSON.stringify and handles closed connection gracefully
    - Ensure broadcast order matches processing order (sequential message handling, no async gaps)
    - _Requirements: 6.2, 6.7_

  - [ ]* 6.3 Write property test for broadcast ordering
    - **Property 6: Broadcast ordering consistency**
    - **Validates: Requirements 6.7**
    - Create `server/tests/broadcastOrder.property.test.js`

- [ ] 7. Implement Host Frontend (host.html + host.js)
  - [ ] 7.1 Create host.html with lobby UI
    - Create `host.html` based on existing `index.html` structure
    - Add mode toggle: "Local Mode" (existing behavior) and "Multiplayer" (new)
    - In multiplayer mode: display "Create Room" button, room code (48px+), QR code (using a lightweight inline QR library), and player list
    - Show game config options (mode, timer, points, difficulty pool) same as existing setup form
    - Add "Start Game" button, disabled until ≥ 2 players connected
    - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 7.2 Implement host.js WebSocket connection and fallback
    - Create `host.js` with `connectToServer(serverUrl)` — reads server URL from config variable, defaults to `ws://<current-host>/ws`
    - 3-second connection timeout, 3 retries with exponential backoff (1s, 2s, 4s)
    - On failure: hide multiplayer controls, show local game UI (fallback to existing app.js behavior)
    - On success: show multiplayer UI, send `createRoom` message, display returned room code
    - Handle all incoming server message types (playerJoined, playerLeft, gameStarted, stateUpdate, etc.)
    - _Requirements: 12.1, 12.2, 12.5, 12.6, 13.4_

  - [ ] 7.3 Implement host game rendering for multiplayer mode
    - Render active game state from server broadcasts: card details (visible to all on host screen with "card hidden" overlay showing only difficulty/stars), question log, scores, timer, round info, clue-giver name
    - Append question log entries within 500ms of broadcast
    - Display revealed clues within 500ms
    - Show disconnected indicator next to player names
    - Show updated scores and next clue-giver on round end within 1 second
    - Use min 24px body text, 36px headings, 4.5:1 contrast ratio
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.4_

- [ ] 8. Checkpoint - Host frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Player Frontend (player.html + player.js)
  - [ ] 9.1 Create player.html with join UI
    - Create `player.html` with mobile-first layout (works at 320px wide, no horizontal scroll)
    - Room code input: 4-character field, case-insensitive, auto-uppercase
    - Support join via URL parameter (`?room=XXXX`) for QR code flow
    - Name input: 1-16 chars, letters/numbers/spaces
    - "Join" button (44x44px minimum tap target)
    - Connection status indicator
    - Error display for invalid code, room full, game in progress, name taken
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 5.4_

  - [ ] 9.2 Implement player.js WebSocket connection and lobby state
    - Create `player.js` with `joinRoom(roomCode, playerName)` — sends `joinRoom` message
    - Handle `joinSuccess`: show lobby waiting state with player name and "Ready" button
    - Send `playerReady` message on button tap
    - Handle `gameStarted`: transition to game UI
    - Implement reconnection: store playerId in sessionStorage, send `reconnect` message on page reload
    - _Requirements: 2.5, 3.2, 8.2_

  - [ ] 9.3 Implement guesser and clue-giver interfaces
    - Guesser UI: text input (max 140 chars), type selector (question/guess), submit button (44x44px), question count (X/10), question log feed
    - Clue-giver UI: full country card details (name, flag, capital, population, area, hemisphere, coastline, languages, currency, neighbors, landmarks, fun facts), "Reveal Special Clue" button, "Reveal Nearby Country" button
    - Switch between interfaces based on `roundStarted` message role assignment within 1 second
    - Handle `actionAck` for submission confirmation
    - Retain input text on send failure, show error message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.3, 7.4_

- [ ] 10. Implement session statistics and results
  - [ ] 10.1 Implement session storage module
    - Create `shared/sessionStorage.js` with `addSession(record)`, `getProfile()`, `getSessions()`
    - Store to localStorage with FIFO cap of 50 records
    - Handle localStorage unavailable gracefully (skip persistence, show notification)
    - _Requirements: 10.1, 10.6_

  - [ ]* 10.2 Write property tests for session storage
    - **Property 15: Session storage maintains FIFO cap**
    - **Property 16: Leaderboard ordering**
    - **Validates: Requirements 10.1, 10.7**
    - Create `server/tests/sessionStorage.property.test.js`

  - [ ] 10.3 Implement results screen on host and player
    - On `gameEnded` message: display results screen with player rankings (highest to lowest), points, personal best comparison, total rounds, correct guesses
    - "Share Results" button: copy text summary to clipboard, show confirmation within 1 second
    - Fallback: if clipboard write fails, show selectable text field
    - Show profile stats (total games, total points, total correct, personal best) on setup/join screen
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.7_

- [ ] 11. Checkpoint - Core multiplayer flow complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement PWA support
  - [ ] 12.1 Create manifest.json and service worker
    - Create `manifest.json` with app name "Geo Game Table", icons (192x192, 512x512), theme color `#5a61ff`, display: standalone
    - Create `service-worker.js` that caches HTML, CSS, JS, and country data files
    - Register service worker in `player.html` and `host.html`
    - Implement cache-first strategy for static assets, network-first for WebSocket URLs
    - _Requirements: 11.1, 11.2_

  - [ ] 12.2 Implement offline solo practice mode
    - In `player.html`: detect offline state, show solo practice UI
    - Browse cached country cards: show flag, continent, tags as clues
    - Text input for country name guess, immediate correct/incorrect feedback
    - On connectivity restored: detect within 5 seconds, enable multiplayer join without page reload
    - _Requirements: 11.3, 11.4_

  - [ ] 12.3 Implement PWA install prompt and update notifications
    - Listen for `beforeinstallprompt` event, show "Install App" button
    - If dismissed, don't re-show during same session (track in sessionStorage)
    - Service worker checks for updates on each launch when online
    - If new version found: download in background, notify player "New version available"
    - _Requirements: 11.5, 11.6_

- [ ] 13. Ensure backward compatibility
  - [ ] 13.1 Preserve local mode in host.html
    - Ensure `host.html` works identically to current `index.html` when server is unavailable
    - All existing features functional: player setup (2-8), mode selection, difficulty pool, card rendering, question tracking (10 max), scoring with speed bonus, clue reveals, pass/reveal, sound effects with volume, game summary, CSV export
    - No build step required — open `host.html` directly in browser
    - No unhandled JS errors when server modules unavailable
    - Keep `index.html` as-is for full backward compatibility (or redirect to host.html)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1_

- [ ] 14. Final checkpoint - All features integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The server uses vanilla Node.js with the `ws` library — no frameworks
- Frontend is vanilla HTML/CSS/JS — no build step, no bundler
- `data/countries.js` is shared between client and server as a single source of truth
- `shared/` modules use a pattern compatible with both CommonJS require() and browser `<script>` tags (UMD or conditional export)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["3.4", "3.5", "3.6"] },
    { "id": 6, "tasks": ["3.7", "4.1", "4.2"] },
    { "id": 7, "tasks": ["4.3", "6.1"] },
    { "id": 8, "tasks": ["6.2", "6.3"] },
    { "id": 9, "tasks": ["7.1", "9.1"] },
    { "id": 10, "tasks": ["7.2", "9.2"] },
    { "id": 11, "tasks": ["7.3", "9.3"] },
    { "id": 12, "tasks": ["10.1"] },
    { "id": 13, "tasks": ["10.2", "10.3"] },
    { "id": 14, "tasks": ["12.1"] },
    { "id": 15, "tasks": ["12.2", "12.3"] },
    { "id": 16, "tasks": ["13.1"] }
  ]
}
```
