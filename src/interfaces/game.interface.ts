export interface RollDiceData {
    roomId: string;
}

export interface MovePieceData {
    roomId: string;
    pieceId: number;    
    steps: number;      
    userId: string;   
}

export interface PiecePosition {
    id: number;         
    position: number;   
    isHome: boolean;    
    isFinished: boolean; 
}

export interface GameState {
    currentTurn: string;  
    diceValue: number;    
    pieces: Record<string, PiecePosition[]>; 
    turnOrder: string[];   
    currentPlayerIndex: number; 
    gamePhase: 'rolling' | 'moving' | 'gameOver';
}