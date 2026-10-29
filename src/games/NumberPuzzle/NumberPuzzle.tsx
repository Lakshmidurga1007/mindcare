import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

import "./NumberPuzzle.css";

type QuestionType =
  | "count"
  | "recognition"
  | "bigger"
  | "addition"
  | "subtraction"
  | "missing"
  | "mixed";

type Question = {
  type: QuestionType;
  question: string;
  choices: number[];
  answer: number;
  symbol?: string;
};

type Props = {
  onBack: () => void;
};

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function createChoices(answer: number, min = 1, max = 20): number[] {
  const choices = new Set<number>();

  choices.add(answer);

  while (choices.size < 4) {
    const variation =
      Math.floor(Math.random() * 5) - 2;

    const value = answer + variation;

    if (value >= min && value <= max) {
      choices.add(value);
    }
  }

  return shuffle(Array.from(choices));
}

function createQuestion(round: number): Question {
  /* ---------------- 1–20 ---------------- */

  if (round <= 7) {
    const answer = Math.floor(Math.random() * 6) + 1;

    return {
      type: "count",
      question: "How many dots are there?",
      choices: createChoices(answer, 1, 10),
      answer,
      symbol: "●".repeat(answer),
    };
  }

  if (round <= 14) {
    const answer = Math.floor(Math.random() * 10) + 1;

    return {
      type: "recognition",
      question: "Find the correct number.",
      choices: createChoices(answer, 1, 15),
      answer,
      symbol: `Number ${answer}`,
    };
  }

  if (round <= 20) {
    const first = Math.floor(Math.random() * 9) + 1;
    const second = Math.floor(Math.random() * 9) + 1;

    const answer = Math.max(first, second);

    return {
      type: "bigger",
      question: `Which number is bigger?`,
      choices: shuffle([first, second]),
      answer,
      symbol: `${first}    ${second}`,
    };
  }

  /* ---------------- 21–40 ---------------- */

  if (round <= 40) {
    const first = Math.floor(Math.random() * 10) + 1;
    const second = Math.floor(Math.random() * 10) + 1;

    const answer = first + second;

    return {
      type: "addition",
      question: "What is the answer?",
      choices: createChoices(answer, 1, 25),
      answer,
      symbol: `${first} + ${second}`,
    };
  }

  /* ---------------- 41–60 ---------------- */

  if (round <= 60) {
    const first = Math.floor(Math.random() * 15) + 6;
    const second = Math.floor(Math.random() * 6) + 1;

    const answer = first - second;

    return {
      type: "subtraction",
      question: "What is the answer?",
      choices: createChoices(answer, 1, 20),
      answer,
      symbol: `${first} − ${second}`,
    };
  }

  /* ---------------- 61–80 ---------------- */

  if (round <= 80) {
    const start = Math.floor(Math.random() * 8) + 1;
    const step = Math.floor(Math.random() * 3) + 1;

    const missingPosition =
      Math.floor(Math.random() * 3) + 1;

    const numbers = [
      start,
      start + step,
      start + step * 2,
      start + step * 3,
    ];

    const answer = numbers[missingPosition];

    const display = numbers.map((number, index) =>
      index === missingPosition ? "?" : number
    );

    return {
      type: "missing",
      question: "Which number is missing?",
      choices: createChoices(answer, 1, 30),
      answer,
      symbol: display.join("   "),
    };
  }

  /* ---------------- 81–100 ---------------- */

  const operation = Math.floor(Math.random() * 3);

  if (operation === 0) {
    const first = Math.floor(Math.random() * 20) + 1;
    const second = Math.floor(Math.random() * 10) + 1;

    const answer = first + second;

    return {
      type: "mixed",
      question: "Solve this.",
      choices: createChoices(answer, 1, 35),
      answer,
      symbol: `${first} + ${second}`,
    };
  }

  if (operation === 1) {
    const first = Math.floor(Math.random() * 20) + 10;
    const second = Math.floor(Math.random() * 10) + 1;

    const answer = first - second;

    return {
      type: "mixed",
      question: "Solve this.",
      choices: createChoices(answer, 1, 30),
      answer,
      symbol: `${first} − ${second}`,
    };
  }

  const start = Math.floor(Math.random() * 10) + 1;
  const step = Math.floor(Math.random() * 4) + 1;

  const answer = start + step * 3;

  return {
    type: "mixed",
    question: "What number comes next?",
    choices: createChoices(answer, 1, 35),
    answer,
    symbol: `${start}   ${start + step}   ${start + step * 2}   ?`,
  };
}

export default function NumberPuzzle({ onBack }: Props) {
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);

  const question = useMemo(
    () => createQuestion(round),
    [round]
  );

  const chooseAnswer = (answer: number) => {
    if (answered) return;

    const isCorrect = answer === question.answer;

    setAnswered(true);
    setLastCorrect(isCorrect);

    if (isCorrect) {
      setCorrect((previous) => previous + 1);
    }

    setTimeout(() => {
      if (round >= 100) {
        setFinished(true);
      } else {
        setRound((previous) => previous + 1);
        setAnswered(false);
        setLastCorrect(null);
      }
    }, 900);
  };

  const restartGame = () => {
    setRound(1);
    setCorrect(0);
    setAnswered(false);
    setLastCorrect(null);
    setFinished(false);
  };

  const attempted = round;
  const accuracy =
    attempted > 0
      ? Math.round((correct / attempted) * 100)
      : 0;

  if (finished) {
    const finalAccuracy = Math.round(
      (correct / 100) * 100
    );

    return (
      <div className="number-page">
        <div className="number-container">

          <button
            className="number-back-button"
            onClick={onBack}
          >
            <ArrowLeft size={25} />
            Back
          </button>

          <div className="number-result-card">

            <div className="number-result-icon">
              <CheckCircle2 size={68} />
            </div>

            <h1>Wonderful! 🌟</h1>

            <p>
              You completed all 100 number challenges!
            </p>

            <div className="number-result-stats">

              <div>
                <strong>{correct}</strong>
                <span>Correct</span>
              </div>

              <div>
                <strong>{finalAccuracy}%</strong>
                <span>Accuracy</span>
              </div>

              <div>
                <strong>100</strong>
                <span>Questions</span>
              </div>

            </div>

            <p className="number-message">
              Great work! Every little practice helps. 💚
            </p>

            <button
              className="number-primary-button"
              onClick={restartGame}
            >
              <RotateCcw size={22} />
              Play Again
            </button>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="number-page">

      <div className="number-container">

        <button
          className="number-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={25} />
          Back
        </button>

        {/* HEADER */}

        <header className="number-header">

          <div className="number-header-icon">
            <Calculator size={42} />
          </div>

          <div>
            <h1>Number Puzzle</h1>
            <p>
              Take your time and exercise your mind.
            </p>
          </div>

        </header>

        {/* PROGRESS */}

        <div className="number-progress-card">

          <div className="number-progress-text">
            <span>Question {round} of 100</span>
            <span>⭐ Score: {correct}</span>
          </div>

          <div className="number-progress-bar">
            <div
              className="number-progress-fill"
              style={{
                width: `${round}%`,
              }}
            />
          </div>

        </div>

        {/* QUESTION */}

        <section className="number-question-card">

          <p>{question.question}</p>

          <div className="number-question-display">
            {question.symbol}
          </div>

        </section>

        {/* ANSWERS */}

        <section className="number-answer-card">

          <p className="number-answer-title">
            Choose your answer
          </p>

          <div className="number-options">

            {question.choices.map((choice) => (

              <button
                key={choice}
                className={`number-option ${
                  answered &&
                  choice === question.answer
                    ? "number-correct"
                    : ""
                }`}
                onClick={() => chooseAnswer(choice)}
                disabled={answered}
              >
                {choice}
              </button>

            ))}

          </div>

        </section>

        {/* FEEDBACK */}

        <div className="number-feedback">

          {lastCorrect === true && (
            <div className="number-success">
              <CheckCircle2 size={28} />
              Excellent! 🎉
            </div>
          )}

          {lastCorrect === false && (
            <div className="number-try">
              That's okay. Keep going! 💚
            </div>
          )}

          {!answered && (
            <span>
              Look carefully and choose the answer.
            </span>
          )}

        </div>

        {/* STATS */}

        <div className="number-bottom-stats">

          <div>
            <strong>{correct}</strong>
            <span>Correct</span>
          </div>

          <div>
            <strong>{attempted}</strong>
            <span>Attempted</span>
          </div>

          <div>
            <strong>{accuracy}%</strong>
            <span>Accuracy</span>
          </div>

        </div>

      </div>
    </div>
  );
}