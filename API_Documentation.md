# LUDO Game API Documentation

## Overview
The LUDO game is a multiplayer board game application built with Android and Firebase. This document outlines all the APIs and endpoints that would be required for a complete implementation of the game, including both client-side and server-side functionality.

## Base URL
```
https://your-firebase-project.firebaseio.com/
```

## Authentication
The application uses Firebase Authentication with anonymous sign-in for guest users.

### Authentication Endpoints

#### 1. Anonymous Sign In
```http
POST /auth/anonymous
```
**Purpose**: Sign in users anonymously for guest gameplay
**Response**: Firebase Auth token

#### 2. User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "Player Name",
  "profilePicture": "base64_encoded_image"
}
```
**Purpose**: Register new users with email/password
**Response**: User profile with UID

#### 3. User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```
**Purpose**: Authenticate existing users
**Response**: User profile and auth token

## Game Room Management

### Room Creation and Joining

#### 1. Create Game Room
```http
POST /rooms
Content-Type: application/json
Authorization: Bearer {firebase_token}

{
  "roomId": "Room1234",
  "gameType": "classic|rush|team",
  "maxPlayers": 4,
  "entryAmount": 100,
  "isPrivate": false,
  "password": "optional_room_password",
  "createdBy": "user_uid",
  "createdAt": "timestamp"
}
```
**Purpose**: Create a new game room
**Response**: Room details with room ID

#### 2. Join Game Room
```http
POST /rooms/{roomId}/join
Content-Type: application/json
Authorization: Bearer {firebase_token}

{
  "playerId": "user_uid",
  "playerName": "Player Name",
  "playerColor": "red|green|blue|yellow",
  "isBot": false
}
```
**Purpose**: Join an existing game room
**Response**: Confirmation of room joining

#### 3. Get Room Details
```http
GET /rooms/{roomId}
Authorization: Bearer {firebase_token}
```
**Purpose**: Get current room status and player list
**Response**: Room information and player details

#### 4. Leave Room
```http
DELETE /rooms/{roomId}/players/{playerId}
Authorization: Bearer {firebase_token}
```
**Purpose**: Leave a game room
**Response**: Confirmation of leaving

#### 5. List Available Rooms
```http
GET /rooms?status=waiting&gameType=classic&limit=20
Authorization: Bearer {firebase_token}
```
**Purpose**: Get list of available rooms to join
**Response**: Array of available rooms

## Game State Management

### Game Initialization

#### 1. Start Game
```http
POST /rooms/{roomId}/start
Authorization: Bearer {firebase_token}
```
**Purpose**: Start the game when all players are ready
**Response**: Initial game state

#### 2. Get Game State
```http
GET /rooms/{roomId}/game
Authorization: Bearer {firebase_token}
```
**Purpose**: Get current game state
**Response**: Complete game state including board, pieces, and player turns

### Game Actions

#### 1. Roll Dice
```http
POST /rooms/{roomId}/dice/roll
Authorization: Bearer {firebase_token}

{
  "playerId": "user_uid",
  "timestamp": "current_timestamp"
}
```
**Purpose**: Roll the dice for current player
**Response**: Dice value and available moves

#### 2. Move Piece
```http
POST /rooms/{roomId}/move
Authorization: Bearer {firebase_token}

{
  "playerId": "user_uid",
  "pieceId": "piece_identifier",
  "targetPosition": 15,
  "diceValue": 6
}
```
**Purpose**: Move a game piece
**Response**: Updated game state

#### 3. Skip Turn
```http
POST /rooms/{roomId}/skip
Authorization: Bearer {firebase_token}

{
  "playerId": "user_uid",
  "reason": "no_valid_moves"
}
```
**Purpose**: Skip current player's turn
**Response**: Next player's turn

#### 4. End Game
```http
POST /rooms/{roomId}/end
Authorization: Bearer {firebase_token}

{
  "winnerId": "user_uid",
  "finalScore": {
    "player1": 100,
    "player2": 50,
    "player3": 25,
    "player4": 0
  }
}
```
**Purpose**: End the game and declare winner
**Response**: Final game results

## Player Management

### Player Profiles

#### 1. Get Player Profile
```http
GET /players/{playerId}
Authorization: Bearer {firebase_token}
```
**Purpose**: Get player profile information
**Response**: Player profile data

#### 2. Update Player Profile
```http
PUT /players/{playerId}
Authorization: Bearer {firebase_token}
Content-Type: application/json

{
  "displayName": "New Player Name",
  "profilePicture": "base64_encoded_image",
  "preferences": {
    "soundEnabled": true,
    "musicEnabled": false,
    "language": "en"
  }
}
```
**Purpose**: Update player profile information
**Response**: Updated profile

#### 3. Get Player Statistics
```http
GET /players/{playerId}/statistics
Authorization: Bearer {firebase_token}
```
**Purpose**: Get player game statistics
**Response**: Win/loss record, total games, etc.

### Player Actions

#### 1. Ready Status
```http
POST /rooms/{roomId}/players/{playerId}/ready
Authorization: Bearer {firebase_token}

{
  "isReady": true
}
```
**Purpose**: Set player ready status
**Response**: Updated room status

#### 2. Player Disconnect
```http
POST /rooms/{roomId}/players/{playerId}/disconnect
Authorization: Bearer {firebase_token}
```
**Purpose**: Handle player disconnection
**Response**: Room status update

## Real-time Communication

### WebSocket Events

#### 1. Game State Updates
```javascript
// Subscribe to game state changes
socket.on('gameStateUpdate', (data) => {
  // Handle game state changes
});

// Subscribe to player actions
socket.on('playerAction', (data) => {
  // Handle player moves, dice rolls, etc.
});

// Subscribe to room updates
socket.on('roomUpdate', (data) => {
  // Handle player joins/leaves, ready status
});
```

#### 2. Send Player Actions
```javascript
// Send dice roll
socket.emit('rollDice', {
  roomId: 'room_id',
  playerId: 'user_uid'
});

// Send piece movement
socket.emit('movePiece', {
  roomId: 'room_id',
  playerId: 'user_uid',
  pieceId: 'piece_id',
  targetPosition: 15
});
```

## Game Rules API

### Game Configuration

#### 1. Get Game Rules
```http
GET /rules/{gameType}
```
**Purpose**: Get game rules for different game types
**Response**: Game rules and configuration

#### 2. Validate Move
```http
POST /rules/validate-move
Content-Type: application/json

{
  "gameType": "classic",
  "currentPosition": 10,
  "targetPosition": 15,
  "diceValue": 5,
  "pieceState": "in_play"
}
```
**Purpose**: Validate if a move is legal
**Response**: Move validation result

## Leaderboard and Statistics

### Leaderboard

#### 1. Get Global Leaderboard
```http
GET /leaderboard?type=global&limit=100
```
**Purpose**: Get global player rankings
**Response**: Array of top players

#### 2. Get Friend Leaderboard
```http
GET /leaderboard/friends
Authorization: Bearer {firebase_token}
```
**Purpose**: Get leaderboard among friends
**Response**: Friend rankings

### Statistics

#### 1. Get Game Statistics
```http
GET /statistics/games
Authorization: Bearer {firebase_token}
```
**Purpose**: Get overall game statistics
**Response**: Total games, wins, losses, etc.

#### 2. Get Player Achievements
```http
GET /players/{playerId}/achievements
Authorization: Bearer {firebase_token}
```
**Purpose**: Get player achievements
**Response**: List of unlocked achievements

## Social Features

### Friends Management

#### 1. Add Friend
```http
POST /friends/add
Authorization: Bearer {firebase_token}
Content-Type: application/json

{
  "friendId": "friend_uid",
  "message": "Let's play Ludo together!"
}
```
**Purpose**: Send friend request
**Response**: Friend request status

#### 2. Accept Friend Request
```http
POST /friends/accept/{requestId}
Authorization: Bearer {firebase_token}
```
**Purpose**: Accept friend request
**Response**: Confirmation

#### 3. Get Friends List
```http
GET /friends
Authorization: Bearer {firebase_token}
```
**Purpose**: Get list of friends
**Response**: Array of friends

### Invitations

#### 1. Send Game Invitation
```http
POST /invitations/send
Authorization: Bearer {firebase_token}
Content-Type: application/json

{
  "friendId": "friend_uid",
  "roomId": "room_id",
  "message": "Join my Ludo game!"
}
```
**Purpose**: Invite friend to game
**Response**: Invitation sent confirmation

#### 2. Accept Game Invitation
```http
POST /invitations/{invitationId}/accept
Authorization: Bearer {firebase_token}
```
**Purpose**: Accept game invitation
**Response**: Redirect to game room

## In-App Purchases and Virtual Currency

### Virtual Currency

#### 1. Get Player Balance
```http
GET /players/{playerId}/balance
Authorization: Bearer {firebase_token}
```
**Purpose**: Get player's coins and diamonds
**Response**: Current balance

#### 2. Purchase Virtual Currency
```http
POST /purchases/coins
Authorization: Bearer {firebase_token}
Content-Type: application/json

{
  "packageId": "coins_1000",
  "amount": 1000,
  "price": 0.99,
  "currency": "USD"
}
```
**Purpose**: Purchase virtual currency
**Response**: Updated balance

### Shop Items

#### 1. Get Shop Items
```http
GET /shop/items
Authorization: Bearer {firebase_token}
```
**Purpose**: Get available shop items
**Response**: List of purchasable items

#### 2. Purchase Item
```http
POST /shop/purchase
Authorization: Bearer {firebase_token}
Content-Type: application/json

{
  "itemId": "custom_dice_red",
  "currency": "coins",
  "amount": 500
}
```
**Purpose**: Purchase shop item
**Response**: Purchase confirmation

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
```

### Common Error Codes
- `AUTH_REQUIRED`: Authentication required
- `INVALID_ROOM`: Room does not exist
- `ROOM_FULL`: Room is at maximum capacity
- `INVALID_MOVE`: Illegal game move
- `NOT_YOUR_TURN`: Not player's turn
- `GAME_ALREADY_STARTED`: Game has already begun
- `PLAYER_NOT_FOUND`: Player not found
- `INSUFFICIENT_FUNDS`: Not enough virtual currency

## Rate Limiting
- API calls are limited to 100 requests per minute per user
- Real-time events are limited to 1000 events per minute per room
- File uploads are limited to 10MB per file

## Security Considerations
- All API calls require Firebase authentication
- Room passwords are encrypted
- Game state validation on server side
- Anti-cheat measures for game integrity
- Input sanitization for all user inputs

## Webhook Endpoints

### Game Events Webhook
```http
POST /webhooks/game-events
Content-Type: application/json

{
  "event": "game_ended",
  "roomId": "room_id",
  "data": {
    "winner": "player_id",
    "duration": 1800,
    "players": ["player1", "player2", "player3", "player4"]
  }
}
```
**Purpose**: Notify external systems of game events
**Response**: 200 OK

## Testing Endpoints

### Health Check
```http
GET /health
```
**Purpose**: Check API service status
**Response**: Service status and version

### Test Game Room
```http
POST /test/room
Content-Type: application/json

{
  "roomId": "test_room",
  "players": 4,
  "gameType": "classic"
}
```
**Purpose**: Create test game room for development
**Response**: Test room details 