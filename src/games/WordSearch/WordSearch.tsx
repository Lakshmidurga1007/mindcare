import { useState, type CSSProperties } from "react";
import "./WordSearch.css";

type Cell = {
  letter: string;
  row: number;
  col: number;
};

type Level = {
  level: number;
  gridSize: number;
  words: string[];
};

const LEVELS: Level[] = [
  {
    level: 1,
    gridSize: 5,
    words: ["SUN", "CAT", "TREE"],
  },
  {
    level: 2,
    gridSize: 6,
    words: ["HOME", "BIRD", "BOOK", "FLOWER"],
  },
  {
    level: 3,
    gridSize: 7,
    words: ["FAMILY", "GARDEN", "SMILE", "MUSIC", "FRIEND"],
  },
  {
    level: 4,
    gridSize: 8,
    words: [
      "FAMILY",
      "GARDEN",
      "FLOWER",
      "SUNSHINE",
      "FRIEND",
      "MEMORY",
    ],
  },
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
  [-1, 1],
];

function createEmptyGrid(size: number): string[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "")
  );
}

function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  rowDirection: number,
  colDirection: number
): boolean {
  const size = grid.length;

  for (let i = 0; i < word.length; i++) {
    const newRow = row + rowDirection * i;
    const newCol = col + colDirection * i;

    if (
      newRow < 0 ||
      newRow >= size ||
      newCol < 0 ||
      newCol >= size
    ) {
      return false;
    }

    const existingLetter = grid[newRow][newCol];

    if (
      existingLetter !== "" &&
      existingLetter !== word[i]
    ) {
      return false;
    }
  }

  return true;
}

function placeWord(
  grid: string[][],
  word: string
): boolean {
  const size = grid.length;

  for (let attempt = 0; attempt < 200; attempt++) {
    const direction =
      DIRECTIONS[
        Math.floor(Math.random() * DIRECTIONS.length)
      ];

    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    if (
      canPlaceWord(
        grid,
        word,
        row,
        col,
        direction[0],
        direction[1]
      )
    ) {
      for (let i = 0; i < word.length; i++) {
        grid[row + direction[0] * i][
          col + direction[1] * i
        ] = word[i];
      }

      return true;
    }
  }

  return false;
}

function generatePuzzle(level: Level): Cell[][] {
  const grid = createEmptyGrid(level.gridSize);

  const words = [...level.words].sort(
    () => Math.random() - 0.5
  );

  for (const word of words) {
    placeWord(grid, word);
  }

  for (let row = 0; row < level.gridSize; row++) {
    for (let col = 0; col < level.gridSize; col++) {
      if (grid[row][col] === "") {
        grid[row][col] =
          LETTERS[
            Math.floor(Math.random() * LETTERS.length)
          ];
      }
    }
  }

  return grid.map((row, rowIndex) =>
    row.map((letter, colIndex) => ({
      letter,
      row: rowIndex,
      col: colIndex,
    }))
  );
}

export default function WordSearch() {
  const [currentLevel, setCurrentLevel] = useState(0);

  const [grid, setGrid] = useState<Cell[][]>(() =>
    generatePuzzle(LEVELS[0])
  );

  const [selectedCells, setSelectedCells] = useState<Cell[]>(
    []
  );

  const [foundWords, setFoundWords] = useState<string[]>(
    []
  );

  const [message, setMessage] = useState(
    "Find the hidden words!"
  );

  const level = LEVELS[currentLevel];

  const isSelected = (cell: Cell) => {
    return selectedCells.some(
      (selected) =>
        selected.row === cell.row &&
        selected.col === cell.col
    );
  };

  const selectCell = (cell: Cell) => {
    if (selectedCells.length >= 10) {
      return;
    }

    const alreadySelected = selectedCells.some(
      (selected) =>
        selected.row === cell.row &&
        selected.col === cell.col
    );

    if (alreadySelected) {
      return;
    }

    const newSelection = [...selectedCells, cell];

    setSelectedCells(newSelection);

    const currentWord = newSelection
      .map((item) => item.letter)
      .join("");

    const reversedWord = currentWord
      .split("")
      .reverse()
      .join("");

    const matchingWord = level.words.find(
      (word) =>
        word === currentWord ||
        word === reversedWord
    );

    if (
      matchingWord &&
      !foundWords.includes(matchingWord)
    ) {
      const updatedWords = [
        ...foundWords,
        matchingWord,
      ];

      setFoundWords(updatedWords);
      setSelectedCells([]);

      setMessage(
        `✨ Great! You found ${matchingWord}!`
      );

      if (updatedWords.length === level.words.length) {
        setMessage(
          `🎉 Level ${level.level} complete!`
        );
      }
    }
  };

  const clearSelection = () => {
    setSelectedCells([]);
    setMessage("Try another word!");
  };

  const restartLevel = () => {
    setGrid(generatePuzzle(level));
    setSelectedCells([]);
    setFoundWords([]);
    setMessage("Find the hidden words!");
  };

  const nextLevel = () => {
    if (currentLevel >= LEVELS.length - 1) {
      return;
    }

    const nextLevelIndex = currentLevel + 1;

    setCurrentLevel(nextLevelIndex);
    setGrid(
      generatePuzzle(LEVELS[nextLevelIndex])
    );
    setSelectedCells([]);
    setFoundWords([]);

    setMessage(
      `Level ${
        LEVELS[nextLevelIndex].level
      } started!`
    );
  };

  const restartGame = () => {
    setCurrentLevel(0);
    setGrid(generatePuzzle(LEVELS[0]));
    setSelectedCells([]);
    setFoundWords([]);
    setMessage("Find the hidden words!");
  };

  const completed =
    foundWords.length === level.words.length;

  const allLevelsCompleted =
    currentLevel === LEVELS.length - 1 &&
    completed;

  return (
    <div className="word-search-game">

      {/* HEADER */}

      <div className="word-search-header">

        <div>
          <div className="level-label">
            LEVEL {level.level}
          </div>

          <h1>🔤 Word Search</h1>

          <p>{message}</p>
        </div>

        <div className="word-progress">
          <span>Words Found</span>

          <strong>
            {foundWords.length}/{level.words.length}
          </strong>
        </div>

      </div>

      {/* LEVEL INDICATOR */}

      <div className="level-progress">

        {LEVELS.map((item, index) => (
          <div
            key={item.level}
            className={`level-dot ${
              index === currentLevel
                ? "active"
                : index < currentLevel
                ? "completed"
                : ""
            }`}
          >
            {index < currentLevel
              ? "✓"
              : item.level}
          </div>
        ))}

      </div>

      {/* GAME AREA */}

      <div className="word-search-content">

        <div
          className="letter-board"
          style={
            {
              "--grid-size": level.gridSize,
            } as CSSProperties
          }
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`letter-cell ${
                  isSelected(cell)
                    ? "selected"
                    : ""
                }`}
                onClick={() => selectCell(cell)}
                type="button"
              >
                {cell.letter}
              </button>
            ))
          )}
        </div>

        {/* WORD LIST */}

        <div className="word-list">

          <h2>Find These</h2>

          <p className="word-help">
            Find all the hidden words.
          </p>

          <div className="words">

            {level.words.map((word) => (
              <div
                key={word}
                className={`word-item ${
                  foundWords.includes(word)
                    ? "word-found"
                    : ""
                }`}
              >
                <span className="word-icon">
                  {foundWords.includes(word)
                    ? "✓"
                    : "○"}
                </span>

                <span>{word}</span>
              </div>
            ))}

          </div>

          <button
            className="clear-button"
            onClick={clearSelection}
            type="button"
          >
            Clear Selection
          </button>

          <button
            className="new-game-button"
            onClick={restartLevel}
            type="button"
          >
            🔄 New Puzzle
          </button>

        </div>

      </div>

      {/* LEVEL COMPLETE */}

      {completed && !allLevelsCompleted && (
        <div className="word-complete">

          <div className="word-complete-card">

            <div className="trophy">
              🎉
            </div>

            <div className="complete-level">
              LEVEL {level.level}
            </div>

            <h2>Well Done!</h2>

            <p>
              You found all the hidden words.
            </p>

            <button
              onClick={nextLevel}
              className="play-again-button"
              type="button"
            >
              Continue to Level{" "}
              {level.level + 1}
            </button>

          </div>

        </div>
      )}

      {/* ALL LEVELS COMPLETE */}

      {allLevelsCompleted && (
        <div className="word-complete">

          <div className="word-complete-card">

            <div className="trophy">
              🏆
            </div>

            <div className="complete-level">
              ALL LEVELS COMPLETE
            </div>

            <h2>Amazing!</h2>

            <p>
              You completed every Word Search
              level.
            </p>

            <button
              onClick={restartGame}
              className="play-again-button"
              type="button"
            >
              Play Again
            </button>

          </div>

        </div>
      )}

    </div>
  );
}