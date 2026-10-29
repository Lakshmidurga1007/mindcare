import { useMemo, useState } from "react";
import "./PictureMatching.css";

type Picture = {
  id: string;
  name: string;
  emoji: string;
};

const pictures: Picture[] = [
  { id: "apple", name: "Apple", emoji: "🍎" },
  { id: "flower", name: "Flower", emoji: "🌸" },
  { id: "house", name: "House", emoji: "🏠" },
  { id: "dog", name: "Dog", emoji: "🐶" },
  { id: "cup", name: "Cup", emoji: "☕" },
  { id: "book", name: "Book", emoji: "📖" },
  { id: "car", name: "Car", emoji: "🚗" },
  { id: "tree", name: "Tree", emoji: "🌳" },
];

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function PictureMatching({
  onBack,
}: {
  onBack?: () => void;
}) {
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState<Picture>(() => {
    return pictures[Math.floor(Math.random() * pictures.length)];
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Find the picture that is the same."
  );

  const choices = useMemo(() => {
    const otherPictures = pictures.filter((p) => p.id !== target.id);

    const wrongChoices = shuffle(otherPictures).slice(0, 2);

    return shuffle([target, ...wrongChoices]);
  }, [target]);

  const choosePicture = (picture: Picture) => {
    if (selected) return;

    setSelected(picture.id);

    if (picture.id === target.id) {
      setMessage("🌸 You found it!");

      setTimeout(() => {
        const remaining = pictures.filter((p) => p.id !== target.id);
        const next =
          remaining[Math.floor(Math.random() * remaining.length)];

        setTarget(next);
        setSelected(null);
        setMessage("Find the picture that is the same.");
        setRound((previous) => previous + 1);
      }, 1200);
    } else {
      setMessage("❤️ That's okay. Try another picture.");

      setTimeout(() => {
        setSelected(null);
        setMessage("Take your time.");
      }, 900);
    }
  };

  return (
    <div className="picture-game">
      <header className="picture-game-header">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="game-title">
          <span>🖼️</span>
          <h1>Picture Matching</h1>
        </div>

        <div className="round-counter">
          Picture {round}
        </div>
      </header>

      <main className="picture-game-content">
        <section className="instruction-section">
          <h2>Find the same picture</h2>
          <p>{message}</p>
        </section>

        {/* BIG TARGET IMAGE */}
        <section className="target-section">
          <div className="target-card">
            <div className="picture-icon">{target.emoji}</div>
            <div className="picture-name">{target.name}</div>
          </div>
        </section>

        <p className="choose-text">
          Which picture is the same?
        </p>

        {/* LARGE CHOICES */}
        <section className="choices-section">
          {choices.map((picture) => {
            const isSelected = selected === picture.id;
            const isCorrect = picture.id === target.id;

            let className = "choice-card";

            if (isSelected && isCorrect) {
              className += " correct";
            } else if (isSelected && !isCorrect) {
              className += " gentle-wrong";
            }

            return (
              <button
                key={picture.id}
                type="button"
                className={className}
                onClick={() => choosePicture(picture)}
                disabled={Boolean(selected)}
              >
                <div className="choice-image">
                  {picture.emoji}
                </div>

                <div className="choice-name">
                  {picture.name}
                </div>
              </button>
            );
          })}
        </section>

        <div className="gentle-reminder">
          ❤️ Take your time. There is no hurry.
        </div>
      </main>
    </div>
  );
}