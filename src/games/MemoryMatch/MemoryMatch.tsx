import { useState } from "react";
import "./MemoryMatch.css";

type Card = {
  id: number;
  emoji: string;
  matched: boolean;
  flipped: boolean;
};

const symbols = ["🌸", "🐶", "🍎", "🌈", "🐱", "⭐"];

function createCards(): Card[] {
  const cards = [...symbols, ...symbols];

  return cards
    .map((emoji, index) => ({
      id: index,
      emoji,
      matched: false,
      flipped: false,
    }))
    .sort(() => Math.random() - 0.5);
}

export default function MemoryMatch() {
  const [cards, setCards] = useState<Card[]>(createCards());
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Find the matching pairs!");

  const handleCardClick = (index: number) => {
    // Don't allow clicking more than two cards
    if (selected.length === 2) return;

    // Don't allow clicking the same card again
    if (selected.includes(index)) return;

    // Don't allow clicking an already matched card
    if (cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].flipped = true;

    setCards(newCards);

    const newSelected = [...selected, index];
    setSelected(newSelected);

    // First card
    if (newSelected.length === 1) {
      return;
    }

    // Second card
    setMoves((previous) => previous + 1);

    const firstIndex = newSelected[0];
    const secondIndex = newSelected[1];

    if (cards[firstIndex].emoji === cards[secondIndex].emoji) {
      // Match!
      setTimeout(() => {
        setCards((currentCards) =>
          currentCards.map((card, i) =>
            i === firstIndex || i === secondIndex
              ? { ...card, matched: true }
              : card
          )
        );

        setSelected([]);
        setMessage("✨ Great! You found a match!");

        const remaining = cards.filter(
          (card, i) =>
            i !== firstIndex &&
            i !== secondIndex &&
            !card.matched
        );

        if (remaining.length === 0) {
          setMessage("🎉 Amazing! You completed the game!");
        }
      }, 500);
    } else {
      // Not a match
      setTimeout(() => {
        setCards((currentCards) =>
          currentCards.map((card, i) =>
            i === firstIndex || i === secondIndex
              ? { ...card, flipped: false }
              : card
          )
        );

        setSelected([]);
        setMessage("That's okay! Try another pair.");
      }, 900);
    }
  };

  const restartGame = () => {
    setCards(createCards());
    setSelected([]);
    setMoves(0);
    setMessage("Find the matching pairs!");
  };

  const completed = cards.every((card) => card.matched);

  return (
    <div className="memory-game">
      <div className="memory-header">
        <div>
          <h1>Memory Match</h1>
          <p>{message}</p>
        </div>

        <div className="moves">
          <span>Moves</span>
          <strong>{moves}</strong>
        </div>
      </div>

      <div className="memory-board">
        {cards.map((card, index) => (
          <button
            key={card.id}
            className={`memory-card ${
              card.flipped || card.matched ? "is-flipped" : ""
            } ${card.matched ? "is-matched" : ""}`}
            onClick={() => handleCardClick(index)}
          >
            <span className="card-front">?</span>

            <span className="card-back">
              {card.emoji}
            </span>
          </button>
        ))}
      </div>

      {completed && (
        <div className="completion-message">
          <h2>🎉 Well Done!</h2>
          <p>You found all the matching pairs.</p>

          <button
            className="restart-button"
            onClick={restartGame}
          >
            Play Again
          </button>
        </div>
      )}

      {!completed && (
        <button
          className="restart-button"
          onClick={restartGame}
        >
          Restart Game
        </button>
      )}
    </div>
  );
}