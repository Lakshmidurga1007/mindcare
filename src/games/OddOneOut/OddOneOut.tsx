import { useMemo, useState } from "react";
import "./OddOneOut.css";

type Question = {
  items: string[];
  oddIndex: number;
};

const symbols = [
  "🍎",
  "🍊",
  "🍌",
  "🍇",
  "🍓",
  "🍉",
  "🥕",
  "🌽",
  "🥦",
  "🌸",
  "🌻",
  "🌹",
  "🌳",
  "⭐",
  "🌙",
  "☀️",
  "🐶",
  "🐱",
  "🐰",
  "🐼",
];

const createQuestion = (round: number): Question => {
  const seed = round * 17;

  const groupSize = 4;

  const baseIndex = seed % symbols.length;
  const oddOffset = (seed * 3) % symbols.length;

  const baseSymbol = symbols[baseIndex];

  let oddSymbol = symbols[oddOffset];

  // Make sure the odd symbol is actually different.
  if (oddSymbol === baseSymbol) {
    oddSymbol = symbols[(oddOffset + 1) % symbols.length];
  }

  const oddIndex = seed % groupSize;

  const items = Array(groupSize).fill(baseSymbol);

  items[oddIndex] = oddSymbol;

  return {
    items,
    oddIndex,
  };
};

export default function OddOneOut() {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);

  const question = useMemo(() => {
    return createQuestion(round);
  }, [round]);

  const accuracy =
    attempts === 0 ? 0 : Math.round((score / attempts) * 100);

  const handleAnswer = (index: number) => {
    if (selectedIndex !== null || finished) return;

    const correct = index === question.oddIndex;

    setSelectedIndex(index);
    setIsCorrect(correct);
    setAttempts((prev) => prev + 1);

    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const nextRound = () => {
    if (round >= 100) {
      setFinished(true);
      return;
    }

    setRound((prev) => prev + 1);
    setSelectedIndex(null);
    setIsCorrect(null);
  };

  const stopGame = () => {
    setFinished(true);
  };

  const restartGame = () => {
    setRound(1);
    setScore(0);
    setAttempts(0);
    setSelectedIndex(null);
    setIsCorrect(null);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="odd-game">
        <div className="odd-card result-card">
          <div className="result-icon">🌟</div>

          <h1>Well Done!</h1>

          <p className="result-message">
            You completed your Odd One Out session.
          </p>

          <div className="result-stats">
            <div>
              <strong>{score}</strong>
              <span>Correct</span>
            </div>

            <div>
              <strong>{attempts}</strong>
              <span>Attempted</span>
            </div>

            <div>
              <strong>{accuracy}%</strong>
              <span>Accuracy</span>
            </div>
          </div>

          <button className="restart-button" onClick={restartGame}>
            🔄 Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="odd-game">
      <div className="odd-card">
        <div className="odd-header">
          <div>
            <h1>🔍 Odd One Out</h1>

            <p>
              Look carefully and choose the picture that is different.
            </p>
          </div>

          <div className="round-info">
            <strong>{round}</strong>
            <span>/ 100</span>
          </div>
        </div>

        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${round}%` }}
          />
        </div>

        <div className="score-row">
          <div>
            ⭐ Score: <strong>{score}</strong>
          </div>

          <div>
            🎯 Accuracy: <strong>{accuracy}%</strong>
          </div>
        </div>

        <div className="instruction">
          Which one is different?
        </div>

        <div className="options-grid">
          {question.items.map((item, index) => {
            let className = "odd-option";

            if (selectedIndex !== null) {
              if (index === question.oddIndex) {
                className += " correct-option";
              } else if (
                index === selectedIndex &&
                !isCorrect
              ) {
                className += " wrong-option";
              }
            }

            return (
              <button
                key={`${round}-${index}`}
                className={className}
                onClick={() => handleAnswer(index)}
                disabled={selectedIndex !== null}
                aria-label={`Option ${index + 1}`}
              >
                <span className="symbol">{item}</span>
              </button>
            );
          })}
        </div>

        {isCorrect !== null && (
          <div
            className={
              isCorrect
                ? "feedback correct-feedback"
                : "feedback wrong-feedback"
            }
          >
            {isCorrect
              ? "🎉 Great job! You found the different one."
              : "💚 That's okay. Look at the highlighted answer."}
          </div>
        )}

        <div className="game-controls">
          <button className="stop-button" onClick={stopGame}>
            ⏹ Stop
          </button>

          {selectedIndex !== null && (
            <button className="next-button" onClick={nextRound}>
              {round === 100 ? "Finish" : "Next ➜"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}