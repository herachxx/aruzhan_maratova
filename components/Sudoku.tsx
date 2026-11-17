"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import "./sudoku.css";

const puzzle =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const solution =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
const initial = [...puzzle].map((value) => (value === "0" ? "" : value));
const firstEmpty = initial.indexOf("");
const storageKey = "aruzhan.sudoku.v1";

function readSavedValues(): string[] {
  try {
    if (typeof window === "undefined") return [...initial];
    const saved: unknown = JSON.parse(
      sessionStorage.getItem(storageKey) || "null",
    );
    if (
      Array.isArray(saved) &&
      saved.length === 81 &&
      saved.every(
        (value, index) =>
          typeof value === "string" &&
          /^(|[1-9])$/.test(value) &&
          (!initial[index] || value === initial[index]),
      )
    )
      return saved;
  } catch {
    // The puzzle still works when browser storage is unavailable.
  }
  return [...initial];
}

function saveValues(values: string[]) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(values));
  } catch {
    // Saving is optional; a blocked store must not interrupt the game.
  }
}

export default function Sudoku() {
  // This component mounts only after its client-side dialog is opened.
  const [values, setValues] = useState<string[]>(readSavedValues);
  const [selected, setSelected] = useState(firstEmpty);
  const [mistakes, setMistakes] = useState<number[]>([]);
  const [message, setMessage] = useState(
    "Pick a square, then type a number or use the buttons below.",
  );
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const complete = values.join("") === solution;
  const selectedRow = Math.floor(selected / 9);
  const selectedColumn = selected % 9;

  function focus(index: number) {
    setSelected(index);
    inputs.current[index]?.focus({ preventScroll: true });
  }

  function write(index: number, value: string) {
    if (initial[index]) {
      setMessage("That number is part of the puzzle. Pick an empty square.");
      return;
    }
    const next = [...values];
    next[index] = value;
    setValues(next);
    saveValues(next);
    setMistakes((previous) => previous.filter((item) => item !== index));
    setMessage(next.join("") === solution ? "You got it. Nice :)" : "");
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (
      /^[1-9]$/.test(event.key) &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      write(index, event.key);
      return;
    }
    const row = Math.floor(index / 9);
    const column = index % 9;
    let next = index;
    if (event.key === "ArrowLeft") next = row * 9 + Math.max(0, column - 1);
    else if (event.key === "ArrowRight")
      next = row * 9 + Math.min(8, column + 1);
    else if (event.key === "ArrowUp") next = Math.max(0, row - 1) * 9 + column;
    else if (event.key === "ArrowDown")
      next = Math.min(8, row + 1) * 9 + column;
    else if (event.key === "Home") next = event.ctrlKey ? 0 : row * 9;
    else if (event.key === "End") next = event.ctrlKey ? 80 : row * 9 + 8;
    else if (event.key === "Delete" || event.key === "Backspace") {
      if (!initial[index]) {
        event.preventDefault();
        write(index, "");
      }
      return;
    } else return;
    event.preventDefault();
    focus(next);
  }

  function check() {
    const wrong = values.flatMap((value, index) =>
      value && value !== solution[index] ? [index] : [],
    );
    const remaining = values.filter((value) => !value).length;
    setMistakes(wrong);
    if (wrong.length)
      setMessage(
        `${wrong.length} ${wrong.length === 1 ? "number needs" : "numbers need"} another look. I’ve marked ${wrong.length === 1 ? "it" : "them"}.`,
      );
    else if (remaining)
      setMessage(
        `So far, so good. ${remaining} ${remaining === 1 ? "square" : "squares"} to go.`,
      );
    else setMessage("You got it. Nice :)");
  }

  function hint() {
    const index = !values[selected] ? selected : values.indexOf("");
    if (index < 0) {
      setMessage(
        complete
          ? "All done. You don’t need a hint."
          : "The grid is full. Try Check to see what needs another look.",
      );
      return;
    }
    write(index, solution[index]);
    focus(index);
    const finished = values.every(
      (value, position) => position === index || value === solution[position],
    );
    setMessage(
      finished
        ? "That fills the last square. All done :)"
        : `A little help: row ${Math.floor(index / 9) + 1}, column ${(index % 9) + 1} is ${solution[index]}.`,
    );
  }

  function reset() {
    setValues([...initial]);
    saveValues(initial);
    setMistakes([]);
    setMessage("Back to the start.");
    focus(firstEmpty);
  }

  return (
    <div className="sudoku">
      <p className="sudoku-intro">
        I love sudoku. Here’s one if you feel like staying a bit. No timer.
      </p>
      <p id="sudoku-instructions" className="sudoku-instructions">
        Use 1 to 9. Arrow keys move between squares; Backspace clears one.
      </p>
      <div
        className={`sudoku-grid ${complete ? "sudoku-complete" : ""}`}
        role="grid"
        aria-label="Sudoku puzzle"
        aria-rowcount={9}
        aria-colcount={9}
        aria-describedby="sudoku-instructions"
      >
        {Array.from({ length: 9 }, (_, row) => (
          <div className="sudoku-row" role="row" key={row}>
            {Array.from({ length: 9 }, (_, column) => {
              const index = row * 9 + column;
              const given = Boolean(initial[index]);
              const active = index === selected;
              const nearby = row === selectedRow || column === selectedColumn;
              const matching =
                Boolean(values[selected]) && values[index] === values[selected];
              const wrong = mistakes.includes(index);
              return (
                <div
                  className={`sudoku-cell ${given ? "sudoku-given" : ""} ${nearby ? "sudoku-nearby" : ""} ${matching ? "sudoku-matching" : ""} ${active ? "sudoku-selected" : ""} ${wrong ? "sudoku-wrong" : ""}`}
                  role="gridcell"
                  aria-selected={active}
                  aria-readonly={given}
                  key={column}
                >
                  <input
                    ref={(node) => {
                      inputs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[1-9]"
                    maxLength={1}
                    autoComplete="off"
                    spellCheck={false}
                    readOnly={given}
                    value={values[index]}
                    tabIndex={active ? 0 : -1}
                    aria-label={`Row ${row + 1}, column ${column + 1}${given ? `, given ${initial[index]}` : ""}`}
                    aria-invalid={wrong || undefined}
                    onFocus={(event) => {
                      setSelected(index);
                      if (!given) event.currentTarget.select();
                    }}
                    onChange={(event) =>
                      write(
                        index,
                        event.target.value.replace(/[^1-9]/g, "").slice(-1),
                      )
                    }
                    onKeyDown={(event) => keyDown(event, index)}
                    onClick={(event) => {
                      if (!given) event.currentTarget.select();
                    }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div
        className="sudoku-keypad"
        role="group"
        aria-label="Enter a number in the selected square"
      >
        {Array.from({ length: 9 }, (_, index) => (
          <button
            type="button"
            key={index}
            onClick={() => {
              write(selected, String(index + 1));
              focus(selected);
            }}
            aria-label={`Enter ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            write(selected, "");
            focus(selected);
          }}
          aria-label="Erase selected square"
        >
          Erase
        </button>
      </div>
      <div className="sudoku-actions">
        <button type="button" onClick={check}>
          Check
        </button>
        <button type="button" onClick={hint}>
          A hint?
        </button>
        <button type="button" onClick={reset}>
          Start over
        </button>
      </div>
      <p
        className={`sudoku-message ${complete ? "sudoku-success" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message || (complete ? "You got it. Nice :)" : "Your move.")}
      </p>
    </div>
  );
}
