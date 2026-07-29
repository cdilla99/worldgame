# Requirements Document

## Introduction

Transform Geo Game Table from a single-device pass-and-play geography trivia game into a Jackbox-style multiplayer party game. Players join a shared session via a 4-character room code on their own devices (phones/tablets/laptops). A host screen (TV/projector) displays the game board while each player interacts through their personal device. The existing local/solo mode remains fully functional without a backend.

## Glossary

- **Host_Screen**: The primary display (TV, projector, or laptop) that shows the shared game state, current card details for the clue-giver, question log, scores, and round progress visible to all players in the room.
- **Player_Device**: A personal device (phone, tablet, or laptop) used by an individual player to join the room, submit questions, make guesses, and view their role-specific interface.
- **Room**: A multiplayer game session identified by a unique 4-character alphanumeric code, containing one Host_Screen connection and two to eight Player_Device connections.
- **Room_Code**: A 4-character uppercase alphanumeric string (A-Z, 2-9, excluding 0, 1, O, I to avoid visual ambiguity) that uniquely identifies an active Room and allows Player_Devices to join.
- **Lobby**: The waiting state after a Room is created but before the game begins, where players join and the host can see connected participants.
- **Clue_Giver**: The player whose turn it is to describe the country card to other players. The Clue_Giver role rotates each round.
- **Guesser**: Any player who is not the current Clue_Giver and submits questions or guesses.
- **Server**: A lightweight Node.js WebSocket backend that manages Room state, relays messages between Host_Screen and Player_Devices, and enforces game rules.
- **Sync_Message**: A WebSocket message sent by the Server to keep all connected clients updated with the current game state.
- **Reconnection_Window**: A 60-second period during which a disconnected player can rejoin the same Room without losing progress.
- **Session_Stats**: End-of-game statistics stored in the player's browser localStorage, including personal bests and game history.
- **PWA**: Progressive Web App — a web application that can be installed on a device and provides offline capabilities for solo practice mode.

## Requirements

### Requirement 1: Room Creation

**User Story:** As a host, I want to create a multiplayer room with a unique code, so that other players can join my game session from their own devices.

#### Acceptance Criteria

1. WHEN the host selects "Create Room" on the Host_Screen, THE Server SHALL generate a unique 4-character uppercase alphanumeric Room_Code using only the characters A-Z and 2-9 (excluding 0, 1, O, I to avoid visual ambiguity) and return it to the Host_Screen within 2 seconds.
2. THE Server SHALL ensure each active Room_Code is unique across all concurrent sessions.
3. WHEN a Room is created, THE Host_Screen SHALL display the Room_Code in a minimum font size of 48px centered on screen, along with a QR code that encodes the join URL containing the Room_Code.
4. IF the host already has an active Room and selects "Create Room," THEN THE Server SHALL reject the request and return an error message indicating that only one active Room per host connection is permitted.
5. WHEN a Room has had zero connected Player_Devices and no host interactions (such as game-state changes or keep-alive signals) for 5 minutes, THE Server SHALL close the Room and release the Room_Code for reuse.
6. IF the Server cannot generate a unique Room_Code because all available codes are currently in use, THEN THE Server SHALL return an error message indicating that room creation is temporarily unavailable.

### Requirement 2: Room Joining

**User Story:** As a player, I want to join a game room by entering a short code on my phone, so that I can participate without needing the host's device.

#### Acceptance Criteria

1. WHEN a player navigates to the join URL or enters a Room_Code (a 4-character alphanumeric code, case-insensitive) on the Player_Device, THE Server SHALL validate the Room_Code and connect the player to the corresponding Room within 2 seconds.
2. IF a player submits an invalid or expired Room_Code, THEN THE Player_Device SHALL display an error message indicating the code is not recognized or has expired.
3. WHEN a player successfully joins a Room, THE Player_Device SHALL prompt the player to enter a display name of 1 to 16 characters consisting of letters, numbers, and spaces, with leading and trailing spaces trimmed.
4. IF a player submits a display name that is already in use within the same Room, THEN THE Player_Device SHALL display an error message indicating the name is taken and prompt the player to choose a different name.
5. WHEN a player confirms a valid display name, THE Host_Screen SHALL update its Lobby view to show the newly connected player's name within 2 seconds.
6. THE Server SHALL enforce a maximum of 8 Player_Devices per Room.
7. IF a ninth player attempts to join a full Room, THEN THE Player_Device SHALL display a message indicating the Room is at capacity.
8. IF a player attempts to join a Room that is no longer in the lobby state, THEN THE Player_Device SHALL display an error message indicating the game is already in progress and the Room cannot be joined.

### Requirement 3: Lobby System

**User Story:** As a host, I want a waiting room where I can see who has joined before starting the game, so that I can ensure all players are ready.

#### Acceptance Criteria

1. WHILE the Room is in Lobby state, THE Host_Screen SHALL display the list of connected player names (up to a maximum of 8 players), the Room_Code, and a QR code encoding the join URL with the Room_Code.
2. WHILE the Room is in Lobby state, THE Player_Device SHALL display a waiting message containing the player's confirmed name and a "Ready" indicator that activates when the player taps a "Ready" button on their device.
3. WHILE the Room is in Lobby state, THE Host_Screen SHALL provide game configuration options: mode (timer or race-to-points), difficulty pool (easy, medium, hard, easy-medium, medium-hard, all), timer length (5 to 45 minutes in whole minutes), and target points (5 to 50 in whole numbers).
4. WHEN the host selects "Start Game" and at least 2 Player_Devices are connected, THE Server SHALL transition the Room from Lobby state to Active state and notify all connected clients within 2 seconds.
5. IF the host selects "Start Game" with fewer than 2 Player_Devices connected, THEN THE Host_Screen SHALL display a message indicating that at least 2 players are required to start.
6. IF a Player_Device disconnects while the Room is in Lobby state, THEN THE Host_Screen SHALL remove that player's name from the connected player list within 5 seconds and update the displayed player count.

### Requirement 4: Host Screen Display

**User Story:** As a group playing in a shared space, I want the host screen to show the game board on a TV or projector, so that everyone can follow the action without crowding around one device.

#### Acceptance Criteria

1. WHILE a round is active, THE Host_Screen SHALL display the current country card details (flag, continent, subregion, tags, difficulty, star value) visible to the Clue_Giver and hidden from Guessers via a "card hidden" overlay that shows only the card's difficulty level and star value without revealing the country identity.
2. WHILE a round is active, THE Host_Screen SHALL display the question log, question count (out of 10), current scores for all players, round number, and active mission text.
3. WHEN a player submits a question or guess, THE Host_Screen SHALL append the entry to the question log within 500 milliseconds.
4. THE Host_Screen SHALL use a minimum font size of 24px for body text and 36px for headings, and maintain a minimum contrast ratio of 4.5:1 between text and background colors per WCAG AA guidelines.
5. WHEN the Clue_Giver reveals a clue or nearby-country hint, THE Host_Screen SHALL display the revealed hint in the shared view within 500 milliseconds.
6. WHEN a round ends, THE Host_Screen SHALL display the updated scores and the identity of the next Clue_Giver within 1 second of the round ending.

### Requirement 5: Player Device Interface

**User Story:** As a player on my phone, I want a simple touch-friendly interface to submit questions and guesses, so that I can participate without passing a device around.

#### Acceptance Criteria

1. WHILE the player is a Guesser, THE Player_Device SHALL display a form with a text input (maximum 140 characters) for questions or guesses, a type selector (question or guess), and a submit button sized for touch interaction (minimum 44x44 pixel tap targets).
2. WHILE the player is the Clue_Giver, THE Player_Device SHALL display the full country card details (name, flag, capital, population, area, hemisphere, coastline, languages, currency, neighbors, landmarks, fun facts, built-in clue, and nearby-country clue).
3. WHEN the Clue_Giver taps the "Reveal Special Clue" button on their Player_Device, THE Server SHALL broadcast the built-in clue text to the Host_Screen and all Player_Devices within 2 seconds of the tap.
4. THE Player_Device interface SHALL render all interactive controls (buttons, inputs, selectors) fully visible and operable without horizontal scrolling on screens as small as 320 pixels wide.
5. WHILE the player is a Guesser, THE Player_Device SHALL display the current question count out of 10 and a feed of the question log that updates within 2 seconds of a new entry being submitted.
6. IF the Player_Device fails to deliver a submitted question or guess to the Server, THEN THE Player_Device SHALL display an error message indicating the submission was not sent and SHALL retain the entered text in the input field.

### Requirement 6: Real-Time Communication

**User Story:** As a player, I want all actions to sync instantly across devices, so that the game feels responsive and everyone sees updates at the same time.

#### Acceptance Criteria

1. THE Server SHALL use WebSocket connections to relay game events between the Host_Screen and all connected Player_Devices.
2. WHEN a game event occurs (question submitted, guess made, clue revealed, round advanced, score updated), THE Server SHALL broadcast the updated state to all connected clients within 300 milliseconds of receiving the event.
3. THE Server SHALL maintain authoritative game state and validate all incoming player actions before broadcasting.
4. IF a Player_Device sends an action that violates game rules (submitting a question when the question cap is reached, acting out of turn), THEN THE Server SHALL reject the action, send an error message to that Player_Device, and preserve the current game state unchanged.
5. WHEN a WebSocket connection is established, THE Server SHALL send the full current game state to the connecting client within 500 milliseconds.
6. WHEN the Server accepts a valid player action, THE Server SHALL send an acknowledgment message to the originating Player_Device within 200 milliseconds confirming the action was processed.
7. THE Server SHALL deliver broadcast messages to all clients in the same order that events were processed, ensuring consistent state across all connected devices.

### Requirement 7: Role Rotation

**User Story:** As a player, I want the clue-giver role to rotate automatically each round, so that everyone gets a fair turn describing countries.

#### Acceptance Criteria

1. WHEN the first round of a game begins, THE Server SHALL assign the Clue_Giver role to the player who joined first (index 0 in join sequence) and notify all clients of the assigned Clue_Giver player name.
2. WHEN a subsequent round begins, THE Server SHALL assign the Clue_Giver role to the next player in join-sequence order, wrapping from the last player back to the first player, and notify all clients of the new Clue_Giver player name.
3. WHEN a player becomes the Clue_Giver, THE Player_Device for that player SHALL switch from the Guesser interface to the Clue_Giver interface displaying the country card within 1 second of receiving the role assignment notification.
4. WHEN a player transitions from Clue_Giver to Guesser, THE Player_Device SHALL switch from the Clue_Giver interface to the Guesser interface within 1 second of receiving the role change notification.
5. THE Host_Screen SHALL display the current Clue_Giver player name in the round information area using a text size at least 1.5 times the base body text size and visible without scrolling.
6. THE Server SHALL maintain the rotation order based on the player join sequence and persist it unchanged across all rounds of the game session.
7. IF a player who is next in rotation order has disconnected, THEN THE Server SHALL skip that player and assign the Clue_Giver role to the next connected player in rotation order.

### Requirement 8: Game State Synchronization

**User Story:** As a player, I want the game to handle brief connectivity issues gracefully, so that a momentary signal drop does not ruin the session.

#### Acceptance Criteria

1. WHEN a Player_Device loses its WebSocket connection, THE Server SHALL retain that player's state and scores for the duration of the Reconnection_Window (60 seconds).
2. WHEN a disconnected player reconnects within the Reconnection_Window, THE Server SHALL restore the player to the same Room with current state and scores intact, and notify all connected clients of the reconnection.
3. IF a player does not reconnect within the Reconnection_Window, THEN THE Server SHALL remove the player from the Room, remove that player from the Clue_Giver rotation order, and notify all connected clients (Host_Screen and Player_Devices) of the removal.
4. WHILE a player is disconnected, THE Host_Screen SHALL display a "disconnected" indicator next to that player's name.
5. WHEN a player reconnects, THE Server SHALL send the full current game state to that Player_Device within 300 milliseconds to resynchronize.
6. IF the Clue_Giver disconnects and does not reconnect within 15 seconds, THEN THE Server SHALL reset the current round's question count and revealed clues, advance the round to the next connected player in rotation order, and notify all clients of the new Clue_Giver.
7. IF the next Clue_Giver in rotation order is also disconnected, THEN THE Server SHALL skip that player and assign the Clue_Giver role to the next connected player in rotation order.

### Requirement 9: Game Modes Preservation

**User Story:** As a host, I want the same timer and race-to-points modes from the local game available in multiplayer, so that the core gameplay remains familiar.

#### Acceptance Criteria

1. WHEN the host configures the game in the Lobby, THE Host_Screen SHALL offer timer mode (5 to 45 minutes, in whole-minute increments) and race-to-points mode (5 to 50 points, in whole-point increments) as game mode options.
2. WHILE timer mode is active, THE Server SHALL track remaining time and broadcast the remaining minutes and seconds to all connected clients every 1 second.
3. WHEN the timer reaches zero in timer mode, THE Server SHALL allow the current card's round to complete via a correct guess, a pass, or an answer reveal, and then end the game.
4. WHEN a player's score reaches or exceeds the target points in race-to-points mode, THE Server SHALL end the game and declare that player the winner.
5. THE Server SHALL enforce the same scoring rules as the local game: points awarded equal the card's star value (1 for easy, 2 for medium, 3 for hard) plus 1 speed bonus point if the correct guess occurs while the question count for the current card is 5 or fewer.
6. THE Server SHALL enforce a maximum of 10 questions per card per round; IF a player submits a question after 10 questions have been asked on the current card, THEN THE Server SHALL reject the submission and return an error indicating the question cap has been reached.
7. WHEN a player submits a guess, THE Server SHALL compare the submitted text against the current card's country name using a case-insensitive exact match and award points only if the values match.

### Requirement 10: Session Statistics and Retention

**User Story:** As a player, I want to track my performance across sessions and share my results, so that I stay motivated to play again.

#### Acceptance Criteria

1. WHEN a game ends, THE Application SHALL store session statistics (points scored, correct guesses, games played, and personal best score) in the browser localStorage, retaining a maximum of 50 session records.
2. WHEN a game ends, THE Application SHALL display a results screen showing each player's rank, points scored, and the numeric difference between the winning player's score and their stored personal best score.
3. THE Application SHALL provide a "Share Results" button on the results screen that copies a text summary (player name, rank, points, game mode) to the system clipboard and displays a confirmation message within 1 second indicating the text was copied.
4. IF the clipboard write operation fails, THEN THE Application SHALL display the text summary in a selectable text field so the player can manually copy it.
5. WHEN the player opens the Application and the setup screen is displayed, THE Application SHALL display a profile section showing cumulative statistics from localStorage: total games played, total points scored, total correct guesses, and personal best score.
6. IF localStorage is unavailable or the write operation fails, THEN THE Application SHALL still display the results screen but omit the personal best comparison and display a message indicating that statistics could not be saved.
7. THE Application SHALL display the final leaderboard on the results screen with all player names, scores ranked from highest to lowest, total rounds played, and total correct guesses for the session.

### Requirement 11: Progressive Web App Support

**User Story:** As a player, I want to install the game on my phone's home screen, so that I can launch it quickly and practice offline.

#### Acceptance Criteria

1. THE Player_Device frontend SHALL include a valid web app manifest with app name, icons (192x192 and 512x512 pixels), theme color, and display mode set to standalone.
2. THE Player_Device frontend SHALL register a service worker that caches the HTML, CSS, JavaScript, and country data files for offline access.
3. WHILE the device is offline, THE Player_Device SHALL provide a solo practice mode where the player can browse all cached country cards and self-quiz by viewing a card's flag, continent, and tags as clues, submitting a country name guess via text input, and receiving immediate correct/incorrect feedback with the full card revealed on answer.
4. WHEN the device regains connectivity, THE Player_Device SHALL detect the restored connection within 5 seconds and allow the player to join or create multiplayer Rooms without requiring a page reload.
5. WHEN the browser's PWA installation criteria are met, THE Player_Device SHALL display an "Install App" prompt that the player can accept or dismiss, and if dismissed, THE Player_Device SHALL not re-display the prompt during the same browser session.
6. WHEN a new version of the application is deployed, THE Player_Device service worker SHALL check for updated assets on each launch when online, download changes in the background, and notify the player that a new version is available for activation on next launch.

### Requirement 12: Backward Compatibility

**User Story:** As a user without internet access, I want the local pass-and-play mode to keep working exactly as it does today, so that the multiplayer feature does not break the existing experience.

#### Acceptance Criteria

1. THE Host_Screen frontend SHALL function as a complete local pass-and-play game when no Server connection is available, providing player setup, mode selection, difficulty pool filtering, card rendering, question tracking, scoring, clue reveals, pass/reveal actions, sound effects, game summary, and CSV export without any degradation in behavior.
2. WHEN the frontend fails to reach the Server within 3 seconds of page load, THE Host_Screen SHALL display the local game setup interface with all multiplayer-related controls hidden or removed from the view.
3. THE frontend SHALL load and run by opening index.html directly in a browser without requiring any backend process, build step, or package installation for local mode.
4. THE local game mode SHALL preserve all existing features: player setup (2-8 players), mode selection (timer and race-to-points), difficulty pool filtering (all, easy-medium, medium-hard, easy, medium, hard), card rendering with country details, question tracking (up to 10 per card), scoring with speed bonus, special clue and nearby-country hint reveals, pass/reveal actions, sound effects with volume control, game summary with leaderboard, and CSV export of country data.
5. IF the Server connection is lost after a local game session has already started, THEN THE Host_Screen SHALL continue the in-progress game using local state without interruption or data loss.
6. WHEN the frontend is loaded without a Server connection, THE Host_Screen SHALL produce no unhandled JavaScript errors in the browser console related to missing server modules or failed network requests.

### Requirement 13: Deployment Architecture

**User Story:** As a developer, I want the frontend deployed as a static site and the backend as a lightweight service, so that hosting remains simple and inexpensive.

#### Acceptance Criteria

1. THE frontend SHALL be deployable as static files (HTML, CSS, JavaScript) to any static hosting provider (GitHub Pages, Netlify, Vercel) without requiring a compilation, transpilation, or bundling step.
2. THE Server SHALL be implementable as a single Node.js process using the ws WebSocket library with no external database dependency.
3. THE Server SHALL store all game state in memory, requiring no persistent storage for active sessions, and SHALL support at least 50 concurrent Rooms before degrading.
4. WHEN the frontend is loaded, THE frontend SHALL read the WebSocket server URL from a JavaScript configuration variable, defaulting to the relative path "ws://<current-host>/ws" for same-origin deployments.
5. THE Server SHALL serve a health-check HTTP endpoint at GET /health that returns a 200 status code and a JSON response body containing a field "activeRooms" with the integer count of active Rooms.
6. IF the Server process restarts, THEN THE Server SHALL start with zero stored game state, and all previously active sessions SHALL be treated as terminated.
