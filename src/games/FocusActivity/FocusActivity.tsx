import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Circle,
  Heart,
  Star,
  Sun,
  Moon,
  Flower2,
  Cloud,
  Leaf,
  Smile,
  CheckCircle2,
  RotateCcw,
  Target,
} from "lucide-react";

import "./FocusActivity.css";

type IconType = {
  name: string;
  icon: React.ReactNode;
};

const ICONS: IconType[] = [
  { name: "Circle", icon: <Circle /> },
  { name: "Heart", icon: <Heart /> },
  { name: "Star", icon: <Star /> },
  { name: "Sun", icon: <Sun /> },
  { name: "Moon", icon: <Moon /> },
  { name: "Flower", icon: <Flower2 /> },
  { name: "Cloud", icon: <Cloud /> },
  { name: "Leaf", icon: <Leaf /> },
  { name: "Smile", icon: <Smile /> },
];

const COLORS = [
  "#5B8DEF",
  "#E85D75",
  "#F5B942",
  "#59B77A",
  "#A66DD4",
  "#F28C52",
];

type Round = {
  target: IconType;
  choices: IconType[];
};

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function createRound(roundNumber: number): Round {
  const difficulty =
    roundNumber <= 20
      ? 4
      : roundNumber <= 40
        ? 5
        : roundNumber <= 60
          ? 6
          : roundNumber <= 80
            ? 7
            : 8;

  const shuffled = shuffle(ICONS);
  const choices = shuffled.slice(0, difficulty);

  const target = choices[Math.floor(Math.random() * choices.length)];

  return {
    target,
    choices: shuffle(choices),
  };
}

type Props = {
  onBack: () => void;
};

export default function FocusActivity({ onBack }: Props) {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);

  const currentRound = useMemo(() => createRound(round), [round]);

  const chooseIcon = (selected: IconType) => {
    if (answered) return;

    const correct = selected.name === currentRound.target.name;

    setAnswered(true);
    setLastCorrect(correct);

    if (correct) {
      setScore((previous) => previous + 1);
      setCorrectAnswers((previous) => previous + 1);
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
    setScore(0);
    setCorrectAnswers(0);
    setAnswered(false);
    setLastCorrect(null);
    setFinished(false);
  };

  const percentage =
    round > 0 ? Math.round((correctAnswers / round) * 100) : 0;

  if (finished) {
    const finalPercentage = Math.round((score / 100) * 100);

    return (
      <div className="focus-page">
        <div className="focus-container">
          <button className="focus-back-button" onClick={onBack}>
            <ArrowLeft size={24} />
            Back
          </button>

          <div className="focus-result-card">
            <div className="focus-result-icon">
              <CheckCircle2 size={70} />
            </div>

            <h1>Wonderful! 🌟</h1>

            <p className="focus-result-message">
              You completed all 100 focus rounds!
            </p>

            <div className="focus-result-stats">
              <div>
                <strong>{score}</strong>
                <span>Correct</span>
              </div>

              <div>
                <strong>{finalPercentage}%</strong>
                <span>Accuracy</span>
              </div>

              <div>
                <strong>100</strong>
                <span>Rounds</span>
              </div>
            </div>

            <p className="focus-encouragement">
              Great work! Your focus and attention are improving. 💚
            </p>

            <button className="focus-primary-button" onClick={restartGame}>
              <RotateCcw size={22} />
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-page">
      <div className="focus-container">

        <button className="focus-back-button" onClick={onBack}>
          <ArrowLeft size={24} />
          Back
        </button>

        <header className="focus-header">
          <div className="focus-title-icon">
            <Target size={42} />
          </div>

          <div>
            <h1>Focus Activity</h1>
            <p>Take your time and find the matching icon.</p>
          </div>
        </header>

        <div className="focus-progress-area">
          <div className="focus-progress-text">
            <span>Round {round} of 100</span>
            <span>Score: {score}</span>
          </div>

          <div className="focus-progress-bar">
            <div
              className="focus-progress-fill"
              style={{ width: `${round}%` }}
            />
          </div>
        </div>

        <section className="focus-instruction-card">
          <p>Find this icon</p>

          <div className="focus-target">
            {currentRound.target.icon}
          </div>

          <h2>{currentRound.target.name}</h2>
        </section>

        <section className="focus-choice-card">
          <p className="focus-choice-title">
            Which one is the same?
          </p>

          <div
            className={`focus-grid ${
              currentRound.choices.length >= 7 ? "focus-grid-hard" : ""
            }`}
          >
            {currentRound.choices.map((choice, index) => (
              <button
                key={`${choice.name}-${index}`}
                className={`focus-choice ${
                  answered && choice.name === currentRound.target.name
                    ? "focus-correct"
                    : ""
                } ${
                  answered &&
                  choice.name !== currentRound.target.name
                    ? "focus-not-selected"
                    : ""
                }`}
                onClick={() => chooseIcon(choice)}
                disabled={answered}
                aria-label={choice.name}
              >
                <span
                  style={{
                    color: COLORS[index % COLORS.length],
                  }}
                >
                  {choice.icon}
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="focus-feedback">
          {lastCorrect === true && (
            <div className="focus-success">
              <CheckCircle2 size={28} />
              <span>Great job! 🎉</span>
            </div>
          )}

          {lastCorrect === false && (
            <div className="focus-try-again">
              <span>Keep going! 💚</span>
            </div>
          )}

          {!answered && (
            <span className="focus-hint">
              Look carefully and choose the matching icon.
            </span>
          )}
        </div>

        <div className="focus-bottom">
          <div>
            <strong>{score}</strong>
            <span>Correct Answers</span>
          </div>

          <div>
            <strong>{percentage}%</strong>
            <span>Current Accuracy</span>
          </div>
        </div>

      </div>
    </div>
  );
}