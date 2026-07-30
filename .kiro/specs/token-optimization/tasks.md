# Implementation Plan: Token Optimization

## Overview

Restructure GeoWars to achieve ~70% token reduction while maintaining full backward compatibility. Implementation follows 6 migration phases with incremental extraction and continuous verification. Each task includes clear completion criteria and is sized for 1-4 hours of focused work.

## Tasks

### Phase 1: Core Module Extraction

- [x] 1. Create Core Module Directory Structure
  - [x] 1.1 Create `src/core/state.js` with singleton state store
    - Export state object with properties: mode, difficulty, continent, deck, currentCard, score, streak, bestStreak, timeRemaining, timerPaused, hintsUsed, roundHistory, player, isOnline
    - Implement `getState()` returning current state snapshot
    - Implement `setState(updates)` that merges updates and emits `state:change`
    - Add deep freeze in development mode for immutability
    - **Completion criteria:** Unit tests pass for state get/set operations
    - _Requirements: 2.1_

  - [x] 1.2 Write property tests for state immutability
    - **Property: State mutations through setState only**
    - **Validates: Requirements 2.1**
    - Generate random state updates, verify only setState modifies state

  - [x] 1.3 Create `src/core/events.js` with EventBus implementation
    - Implement `emit(event, payload)` invoking all registered handlers
    - Implement `on(event, handler)` for handler registration
    - Implement `off(event, handler)` for handler removal
    - Implement `once(event, handler)` for single-invocation handlers
    - Add try-catch wrapping per handler, log errors but continue
    - Support wildcard patterns (e.g., `timer:*` matches `timer:tick`, `timer:warning`)
    - Maintain handler registration order for deterministic invocation
    - **Completion criteria:** All EventBus unit tests pass (15+ test cases)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [x] 1.4 Write property tests for EventBus behavior
    - **Property 3: Handler invocation order** - Generate random handler sequences, verify invocation order matches registration
    - **Validates: Requirements 14.1, 14.2, 14.7**
    - **Property 4: Handler removal prevents invocation** - Register then remove, emit event, verify no invocation
    - **Validates: Requirements 14.3**
    - **Property 5: Once handlers fire exactly once** - Emit same event multiple times, verify single invocation
    - **Validates: Requirements 14.4**
    - **Property 6: Error isolation between handlers** - One handler throws, verify others still execute
    - **Validates: Requirements 14.5**
    - **Property 7: Wildcard pattern matching** - Register with `timer:*`, emit various timer events, verify all match
    - **Validates: Requirements 14.6**

  - [x] 1.5 Create `src/core/dom-refs.js` with DOM registry
    - Export `get(id)` returning cached or newly-queried element
    - Implement lazy querying: query DOM on first access, cache result
    - Return `null` for missing elements without throwing
    - Log warning for missing elements in development mode
    - Export `clear()` to reset cache (useful for testing)
    - Export `preload(ids)` to batch-query multiple elements
    - **Completion criteria:** Unit tests pass for lazy loading and null-safety
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 1.6 Write property test for DOM registry null safety
    - **Property 8: Null safety for non-existent elements**
    - **Validates: Requirements 2.5**
    - Generate random element IDs (including non-existent), verify null returned without exception

  - [x] 1.7 Create `src/core/index.js` unified export
    - Re-export state, EventBus, DOM registry from single entry point
    - Define and export CORE_EVENTS constant array with all event names
    - Export factory functions for creating new EventBus instances (testing)
    - **Completion criteria:** ES module imports work from single entry point
    - _Requirements: 2.6_

  - [x] 1.8 Add facade exports to app.js for backward compatibility
    - Create `window.GeoWars = { state, eventBus, domRefs }` namespace
    - Add delegating functions that call through to core modules
    - Preserve all existing global exports (TimerRing, StreakTracker, etc.)
    - **Completion criteria:** Existing game loads without errors
    - _Requirements: 13.2, 13.3, 13.4_

- [x] 2. Checkpoint - Core Module Extraction Complete
  - Run `npm test` or equivalent test command
  - Load index.html and verify no console errors
  - Confirm EventBus, state, and DOM registry are accessible globally
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 13.1, 13.5, 13.7_


### Phase 2: Data Module Extraction

- [x] 3. Create Data Module Structure and Country Index
  - [x] 3.1 Create `src/data/index.js` with minimal country index
    - Export `countries` array with only: id, name, continent, difficulty
    - Export `getIndex()` returning the countries array
    - Export `filterIndex(predicate)` for filtering by continent/difficulty
    - Export `findCountryByName(name)` for autocomplete lookup
    - Include all 197 countries in minimal format
    - **Completion criteria:** Index loads synchronously, all countries present
    - _Requirements: 1.1_

  - [x] 3.2 Create `src/data/chunks/` directory structure
    - Create subdirectories for each continent: Africa, Asia, Europe, North_America, South_America, Oceania
    - Add placeholder .gitkeep files
    - **Completion criteria:** Directory structure exists
    - _Requirements: 1.5_

  - [x] 3.3 Create Africa chunk (`src/data/chunks/Africa.js`)
    - Export array of full country records for all African countries (~54)
    - Include all fields: capital, population_hint, area_hint, hemisphere, coastline_type, neighbors, main_languages, currency, landmarks, fun_facts, built_in_clue, nearby_country_clue, flag, silhouette_url
    - Assign each country to exactly one chunk
    - **Completion criteria:** Africa chunk exports all 54 countries with full data
    - _Requirements: 1.5, 1.6_

  - [x] 3.4 Create Asia chunk (`src/data/chunks/Asia.js`)
    - Export array of full country records for all Asian countries (~48)
    - Handle edge cases: Russia assigned to Asia (primary classification)
    - **Completion criteria:** Asia chunk exports all 48 countries with full data
    - _Requirements: 1.5, 1.6_

  - [x] 3.5 Create Europe chunk (`src/data/chunks/Europe.js`)
    - Export array of full country records for all European countries (~44)
    - **Completion criteria:** Europe chunk exports all 44 countries with full data
    - _Requirements: 1.5_

  - [x] 3.6 Create North America chunk (`src/data/chunks/North_America.js`)
    - Export array of full country records for all North American countries (~23)
    - **Completion criteria:** North America chunk exports all 23 countries
    - _Requirements: 1.5_

  - [x] 3.7 Create South America chunk (`src/data/chunks/South_America.js`)
    - Export array of full country records for all South American countries (~12)
    - **Completion criteria:** South America chunk exports all 12 countries
    - _Requirements: 1.5_

  - [x] 3.8 Create Oceania chunk (`src/data/chunks/Oceania.js`)
    - Export array of full country records for all Oceanian countries (~14)
    - **Completion criteria:** Oceania chunk exports all 14 countries
    - _Requirements: 1.5_

  - [x] 3.9 Write property tests for country data integrity
    - **Property 1: Lazy loading retrieves full country data** - Generate random country IDs, load chunks, verify all fields present
    - **Validates: Requirements 1.2**
    - **Property 2: Each country appears in exactly one chunk** - Combine all chunks, count occurrences, verify no duplicates
    - **Validates: Requirements 1.6**

  - [x] 3.10 Create `src/data/loader.js` with dynamic chunk loading
    - Implement `loadChunk(continent)` using dynamic import()
    - Cache loaded chunks in Map to prevent re-fetching
    - Emit `data:loading` event when chunk load starts
    - Emit `data:ready` event when chunk load completes
    - Emit `data:error` with chunk ID and error on failure
    - Implement retry mechanism with exponential backoff (max 3 retries)
    - **Completion criteria:** Chunks load dynamically, errors handled gracefully
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 3.11 Create `src/data/api.js` with unified data access
    - Implement `getCountry(id)` returning full country data (loads chunk if needed)
    - Implement `getContinentCountries(continent)` returning all countries for continent
    - Handle loading states with async/await
    - **Completion criteria:** Data API works with both index and lazy-loaded data
    - _Requirements: 1.2_

  - [x] 3.12 Write property test for chunk load error events
    - **Property 11: Error events contain chunk identifier**
    - **Validates: Requirements 1.4**
    - Simulate chunk load failures, verify error event structure includes continent name

  - [x] 3.13 Create backward-compatible facade at `data/countries.js`
    - Re-export all existing functions and data structures
    - Internally delegate to new modular system
    - Maintain synchronous access for index data
    - **Completion criteria:** Existing code continues to work without changes
    - _Requirements: 13.2, 13.4_

- [x] 4. Checkpoint - Data Module Extraction Complete
  - Test lazy loading of each continent chunk
  - Verify autocomplete uses minimal index correctly
  - Confirm no regressions in country selection
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 1.1, 1.2, 13.1_


### Phase 3: Feature Module Extraction

- [x] 5. Extract Timer Feature Module
  - [x] 5.1 Create `src/features/timer/index.js` with timer logic
    - Subscribe to `game:start`, `game:pause`, `game:resume`, `game:end`
    - Initialize countdown based on mode: blitz=60s, sprint=120s, zen=null
    - Store timer reference and remaining time in module state
    - Emit `timer:tick` every second with `{ remaining }` payload
    - **Completion criteria:** Timer starts on game:start, ticks correctly
    - _Requirements: 3.1, 3.2_

  - [x] 5.2 Write property tests for timer initialization
    - **Property 9: Timer initializes with correct duration per mode** - Generate random modes, verify correct initial duration (blitz=60, sprint=120, zen=null)
    - **Validates: Requirements 3.1**
    - **Property 10: Tick events have monotonically decreasing times** - Start timer, collect ticks, verify decreasing sequence
    - **Validates: Requirements 3.2**

  - [x] 5.3 Implement timer warning levels
    - Emit `timer:warning` with `{ level: 'medium' }` when 10 > time > 5
    - Emit `timer:warning` with `{ level: 'high' }` when time <= 5
    - Emit `timer:expired` when time reaches 0
    - **Completion criteria:** Warning events fire at correct thresholds
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 5.4 Implement timer pause/resume functionality
    - On `game:pause`, stop interval and preserve remaining time
    - On `game:resume`, restart interval from preserved time
    - On `game:end`, clear interval and reset state
    - **Completion criteria:** Pause/resume preserves time correctly
    - _Requirements: 3.6, 3.7_

  - [x] 5.5 Integrate with TimerRing visual component
    - Import TimerRing from existing module
    - Update TimerRing progress based on tick events
    - Maintain backward-compatible global export
    - **Completion criteria:** Visual timer ring updates correctly
    - _Requirements: 3.8_

  - [x] 5.6 Create timer facade in app.js
    - Export timer functions matching existing signatures
    - Delegate to timer module internally
    - **Completion criteria:** Existing timer code works without changes
    - _Requirements: 13.2_

- [x] 6. Extract Autocomplete Feature Module
  - [x] 6.1 Create `src/features/autocomplete/index.js` with suggestion logic
    - Subscribe to input events on answer text field
    - Query country index when input length >= 2
    - Perform case-insensitive matching on country names
    - Return maximum 5 matching countries
    - Emit `autocomplete:select` when user selects suggestion
    - **Completion criteria:** Suggestions appear after 2 characters
    - _Requirements: 4.1, 4.2, 4.3, 4.7_

  - [x] 6.2 Write property tests for autocomplete matching
    - **Property 12: All matching countries returned for 2+ char input** - Generate random country names, verify partial matches found
    - **Validates: Requirements 4.2**
    - **Property 13: Exactly 5 results when matches exceed limit** - Input common prefix, verify exactly 5 suggestions
    - **Validates: Requirements 4.7**

  - [x] 6.3 Implement keyboard navigation for suggestions
    - Handle ArrowDown to move to next suggestion
    - Handle ArrowUp to move to previous suggestion
    - Update `aria-activedescendant` to reflect active item
    - Handle Escape to dismiss suggestion list
    - Handle Enter to select active suggestion
    - **Completion criteria:** Full keyboard navigation works
    - _Requirements: 4.4, 4.5, 4.6_

  - [x] 6.4 Implement ARIA attributes for accessibility
    - Add `role="combobox"` to input element
    - Add `aria-autocomplete="list"`
    - Manage `aria-expanded` state (true when list visible)
    - Add `aria-controls` pointing to suggestion list ID
    - **Completion criteria:** Screen reader announces autocomplete correctly
    - _Requirements: 4.8_

  - [x] 6.5 Create autocomplete facade in app.js
    - Export autocomplete functions matching existing signatures
    - **Completion criteria:** Existing autocomplete code works
    - _Requirements: 13.2_


- [x] 7. Extract Scoring Feature Module
  - [x] 7.1 Create `src/features/scoring/index.js` with scoring logic
    - Subscribe to `answer:correct` and `answer:incorrect` events
    - Implement point calculation: base × multiplier
    - Base points: easy=100, medium=150, hard=200
    - Multipliers: typed=3x, bail=2x, options=1x
    - Emit `score:update` with `{ score, delta, streak }`
    - **Completion criteria:** Correct answers update score correctly
    - _Requirements: 5.1, 5.2, 5.7_

  - [x] 7.2 Write property tests for score calculation
    - **Property 14: Points = base × multiplier for any difficulty** - Generate random difficulties and multipliers, verify formula
    - **Validates: Requirements 5.1**
    - **Property 15: Cumulative scores correct in score:update events** - Simulate game, track all score updates, verify cumulative sum
    - **Validates: Requirements 5.2**

  - [x] 7.3 Implement streak tracking
    - Increment streak on correct answer
    - Emit `streak:hot` when streak >= 3
    - Reset streak to 0 on incorrect answer
    - Emit `streak:reset` with previous streak value
    - Track `bestStreak` for session
    - **Completion criteria:** Streak tracking works correctly
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 7.4 Write property test for best streak tracking
    - **Property 16: Best streak = max achieved streak** - Generate random answer sequences, verify best streak equals maximum
    - **Validates: Requirements 5.5**

  - [x] 7.5 Implement final score calculation
    - Subscribe to `game:end` event
    - Calculate session statistics: total score, correct count, total rounds, best streak
    - Emit `score:final` with complete session stats
    - **Completion criteria:** Final stats emitted at game end
    - _Requirements: 5.6_

  - [x] 7.6 Create scoring facade in app.js
    - Export scoring functions matching existing signatures
    - **Completion criteria:** Existing scoring code works
    - _Requirements: 13.2_

- [x] 8. Extract Hints Feature Module
  - [x] 8.1 Create `src/features/hints/index.js` with hint logic
    - Subscribe to hint button click events
    - Track hint state per round: flagUsed, regionUsed
    - Emit `hint:reveal` with `{ type: 'flag' | 'region' }`
    - Ignore click if hint already used for that type
    - **Completion criteria:** Hints reveal correctly, one per type per round
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 8.2 Implement hint button state management
    - Set button to disabled after hint used
    - Update `aria-pressed="true"` after use
    - Reset both hint states on `round:start`
    - Re-enable buttons for new round
    - **Completion criteria:** Button states update correctly
    - _Requirements: 6.5, 6.6_

  - [x] 8.3 Create hints facade in app.js
    - Export hint functions matching existing signatures
    - **Completion criteria:** Existing hint code works
    - _Requirements: 13.2_

- [x] 9. Extract Silhouette Feature Module
  - [x] 9.1 Create `src/features/silhouette/index.js` with silhouette logic
    - Subscribe to `round:start` event
    - Load silhouette image for current country
    - Clean up previous silhouette element before loading new
    - Emit `silhouette:ready` on successful load
    - **Completion criteria:** Silhouettes load on each round
    - _Requirements: 7.1, 7.2, 7.6_

  - [x] 9.2 Write property tests for silhouette loading
    - **Property 17: round:start triggers silhouette load** - Emit round:start events, verify silhouette loading initiated
    - **Validates: Requirements 7.1**
    - **Property 19: Only one silhouette element exists at a time** - Multiple round:starts, verify single silhouette element
    - **Validates: Requirements 7.6**

  - [x] 9.3 Implement silhouette error handling
    - Emit `silhouette:error` with `{ countryId, error }` on load failure
    - Integrate with AssetFallbacks system for graceful degradation
    - Show recovery UI for missing silhouettes
    - **Completion criteria:** Errors handled with fallback UI
    - _Requirements: 7.3, 7.4_

  - [x] 9.4 Write property test for silhouette error events
    - **Property 18: Error events contain country ID** - Simulate silhouette failures, verify country ID in error payload
    - **Validates: Requirements 7.3**

  - [x] 9.5 Create silhouette facade in app.js
    - Export silhouette functions matching existing signatures
    - **Completion criteria:** Existing silhouette code works
    - _Requirements: 13.2_

- [x] 10. Checkpoint - Feature Modules Complete
  - Test timer countdown, warnings, and expiration
  - Test autocomplete with keyboard navigation
  - Test scoring and streak calculations
  - Test hint reveals and state management
  - Test silhouette loading and error handling
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 3.1-3.8, 4.1-4.8, 5.1-5.7, 6.1-6.6, 7.1-7.6, 13.1_

