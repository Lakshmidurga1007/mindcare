import { useMemo, useState } from "react";
import "./FamilyRecognition.css";

type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  image: string;
};

type Result = {
  correct: boolean;
  timestamp: string;
};

const getFamilyMembers = (): FamilyMember[] => {
  try {
    const saved = localStorage.getItem("mindcareFamilyMembers");

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const shuffle = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export default function FamilyRecognition() {
  const [familyMembers] = useState<FamilyMember[]>(getFamilyMembers);

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    null
  );

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [finished, setFinished] = useState(false);

  const currentMember = useMemo(() => {
    if (familyMembers.length === 0) return null;

    const index = (round - 1) % familyMembers.length;

    return familyMembers[index];
  }, [familyMembers, round]);

  const options = useMemo(() => {
    if (!currentMember || familyMembers.length === 0) return [];

    const otherMembers = familyMembers.filter(
      (member) => member.id !== currentMember.id
    );

    const shuffledOthers = shuffle(otherMembers).slice(0, 3);

    return shuffle([currentMember, ...shuffledOthers]);
  }, [currentMember, familyMembers]);

  const accuracy =
    attempts === 0 ? 0 : Math.round((score / attempts) * 100);

  const saveResult = (correct: boolean) => {
    try {
      const saved = localStorage.getItem(
        "mindcareRecognitionResults"
      );

      const previousResults: Result[] = saved
        ? JSON.parse(saved)
        : [];

      const updatedResults = [
        ...previousResults,
        {
          correct,
          timestamp: new Date().toISOString(),
        },
      ].slice(-100);

      localStorage.setItem(
        "mindcareRecognitionResults",
        JSON.stringify(updatedResults)
      );
    } catch {
      console.log("Could not save recognition result.");
    }
  };

  const handleAnswer = (memberId: string) => {
    if (!currentMember || selectedAnswer !== null) return;

    const correct = memberId === currentMember.id;

    setSelectedAnswer(memberId);
    setIsCorrect(correct);

    setAttempts((prev) => prev + 1);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    saveResult(correct);
  };

  const nextRound = () => {
    if (round >= 100) {
      setFinished(true);
      return;
    }

    setRound((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const stopGame = () => {
    setFinished(true);
  };

  const restartGame = () => {
    setRound(1);
    setScore(0);
    setAttempts(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setFinished(false);
  };

  /*
   * No family members added yet
   */

  if (familyMembers.length === 0) {
    return (
      <div className="family-recognition">
        <div className="family-card empty-family-card">
          <div className="family-big-icon">👨‍👩‍👧</div>

          <h1>Family Recognition</h1>

          <p>
            There are no family members added yet.
          </p>

          <p className="small-message">
            Please ask the caretaker to add family photos
            before starting this activity.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Result screen
   */

  if (finished) {
    return (
      <div className="family-recognition">
        <div className="family-card result-card">
          <div className="family-big-icon">💚</div>

          <h1>Wonderful!</h1>

          <p className="result-message">
            You completed your family recognition session.
          </p>

          <div className="family-result-stats">
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

          <button
            className="family-restart-button"
            onClick={restartGame}
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    );
  }

  /*
   * Main game
   */

  if (!currentMember) return null;

  return (
    <div className="family-recognition">
      <div className="family-card">

        <div className="family-header">
          <div>
            <h1>👨‍👩‍👧 Family Recognition</h1>

            <p>
              Look at the photo and choose the correct name.
            </p>
          </div>

          <div className="family-round">
            <strong>{round}</strong>
            <span>/ 100</span>
          </div>
        </div>

        <div className="family-progress">
          <div
            className="family-progress-bar"
            style={{ width: `${round}%` }}
          />
        </div>

        <div className="family-score-row">
          <span>
            ⭐ Score: <strong>{score}</strong>
          </span>

          <span>
            🎯 Accuracy: <strong>{accuracy}%</strong>
          </span>
        </div>

        <div className="family-photo-container">
          <img
            src={currentMember.image}
            alt="Family member"
            className="family-photo"
          />
        </div>

        <h2 className="question-title">
          Who is this?
        </h2>

        <div className="family-options">
          {options.map((member) => {
            let className = "family-option";

            if (selectedAnswer !== null) {
              if (member.id === currentMember.id) {
                className += " correct-family-option";
              } else if (
                member.id === selectedAnswer &&
                member.id !== currentMember.id
              ) {
                className += " wrong-family-option";
              }
            }

            return (
              <button
                key={member.id}
                className={className}
                onClick={() => handleAnswer(member.id)}
                disabled={selectedAnswer !== null}
              >
                <span className="option-name">
                  {member.name}
                </span>

                <span className="option-relation">
                  {member.relation}
                </span>
              </button>
            );
          })}
        </div>

        {isCorrect !== null && (
          <div
            className={
              isCorrect
                ? "family-feedback correct-family-feedback"
                : "family-feedback wrong-family-feedback"
            }
          >
            {isCorrect
              ? `🎉 Correct! This is ${currentMember.name}.`
              : `💚 That's okay. The correct answer is ${currentMember.name}.`}
          </div>
        )}

        <div className="family-controls">
          <button
            className="family-stop-button"
            onClick={stopGame}
          >
            ⏹ Stop
          </button>

          {selectedAnswer !== null && (
            <button
              className="family-next-button"
              onClick={nextRound}
            >
              {round === 100 ? "Finish" : "Next ➜"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}