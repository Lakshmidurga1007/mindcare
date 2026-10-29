import { useState } from "react";
import "./Jigsaw.css";

type Piece = {
  id: number;
  correctPosition: number;
};

const TOTAL_PIECES = 9;

const createPuzzle = (): Piece[] => {
  return Array.from({ length: TOTAL_PIECES }, (_, index) => ({
    id: index,
    correctPosition: index,
  })).sort(() => Math.random() - 0.5);
};

export default function Jigsaw() {
  const [pieces, setPieces] = useState<Piece[]>(createPuzzle());
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);

  const handlePieceClick = (index: number) => {
    if (selectedPiece === null) {
      setSelectedPiece(index);
      return;
    }

    if (selectedPiece === index) {
      setSelectedPiece(null);
      return;
    }

    const newPieces = [...pieces];

    const temp = newPieces[selectedPiece];
    newPieces[selectedPiece] = newPieces[index];
    newPieces[index] = temp;

    setPieces(newPieces);
    setMoves((previous) => previous + 1);
    setSelectedPiece(null);
  };

  const isSolved = pieces.every(
    (piece, index) => piece.correctPosition === index
  );

  const restartGame = () => {
    setPieces(createPuzzle());
    setSelectedPiece(null);
    setMoves(0);
  };

  return (
    <div className="jigsaw-game">

      <div className="jigsaw-header">
        <div>
          <h1>🧩 Jigsaw Puzzle</h1>
          <p>Put the pieces in the right places.</p>
        </div>

        <div className="jigsaw-moves">
          <span>Moves</span>
          <strong>{moves}</strong>
        </div>
      </div>

      <div className="jigsaw-content">

        <div className="puzzle-container">
          <div className="puzzle-board">

            {pieces.map((piece, index) => (
              <button
                key={piece.id}
                className={`puzzle-piece ${
                  selectedPiece === index ? "selected" : ""
                } ${
                  piece.correctPosition === index ? "correct" : ""
                }`}
                onClick={() => handlePieceClick(index)}
              >
                <span>
                  {piece.id + 1}
                </span>
              </button>
            ))}

          </div>
        </div>

        <div className="jigsaw-instructions">

          <h2>How to Play</h2>

          <div className="instruction">
            <span>1</span>
            <p>Tap one puzzle piece.</p>
          </div>

          <div className="instruction">
            <span>2</span>
            <p>Tap another piece to swap them.</p>
          </div>

          <div className="instruction">
            <span>3</span>
            <p>Keep arranging until the picture is complete.</p>
          </div>

          <button
            className="jigsaw-restart"
            onClick={restartGame}
          >
            Restart Puzzle
          </button>

        </div>

      </div>

      {isSolved && (
        <div className="jigsaw-complete">
          <div className="complete-card">
            <div className="complete-icon">🎉</div>

            <h2>Puzzle Complete!</h2>

            <p>
              Wonderful! You completed the puzzle
              in {moves} moves.
            </p>

            <button
              className="jigsaw-play-again"
              onClick={restartGame}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
}