// ---------- Sudoku ----------
// Loaded by main/index.html after the #sudoku-board markup.
//
// How the grid is stored: one array of 81 numbers, read row by row.
// 0 means "empty". Square i is in row Math.floor(i / 9) and column i % 9.
//
//   index:  0  1  2 |  3  4  5 |  6  7  8      <- row 0
//           9 10 11 | 12 13 14 | 15 16 17      <- row 1
//          ...

// How many squares to blank out for each difficulty.
const HOLES = { easy: 36, medium: 46, hard: 54 };

let solution = [];   // the finished grid
let puzzle = [];     // the starting grid shown to the player (0 = blank)

const boardEl = document.getElementById('sudoku-board');
const statusEl = document.getElementById('sudoku-status');
const difficultyEl = document.getElementById('sudoku-difficulty');
const cells = [];    // the 81 <input> elements

// ============ Puzzle generation ============

function shuffle(list) {
  // Fisher–Yates shuffle: swap each item with a random earlier one.
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Can `num` go in square `index` without repeating in its row, column or 3x3 box?
function canPlace(grid, index, num) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = row - (row % 3);
  const boxCol = col - (col % 3);

  for (let k = 0; k < 9; k++) {
    if (grid[row * 9 + k] === num) return false;                 // same row
    if (grid[k * 9 + col] === num) return false;                 // same column
    const r = boxRow + Math.floor(k / 3);
    const c = boxCol + (k % 3);
    if (grid[r * 9 + c] === num) return false;                   // same box
  }
  return true;
}

// Fill every empty square using "backtracking":
// try a number, move on; if we get stuck later, undo and try the next number.
function fillGrid(grid) {
  const index = grid.indexOf(0);
  if (index === -1) return true;                // no empty squares left: done

  for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (canPlace(grid, index, num)) {
      grid[index] = num;
      if (fillGrid(grid)) return true;
      grid[index] = 0;                          // dead end: undo
    }
  }
  return false;
}

// Count the solutions of a grid, stopping early once we reach `limit`.
// A fair puzzle must have exactly one solution.
function countSolutions(grid, limit) {
  const index = grid.indexOf(0);
  if (index === -1) return 1;

  let count = 0;
  for (let num = 1; num <= 9 && count < limit; num++) {
    if (canPlace(grid, index, num)) {
      grid[index] = num;
      count += countSolutions(grid, limit - count);
      grid[index] = 0;
    }
  }
  return count;
}

// Make a full grid, then remove numbers one at a time,
// putting a number back whenever removing it would allow a second solution.
function generatePuzzle(holes) {
  solution = new Array(81).fill(0);
  fillGrid(solution);

  puzzle = solution.slice();
  let removed = 0;
  for (const index of shuffle([...Array(81).keys()])) {
    if (removed >= holes) break;
    const backup = puzzle[index];
    puzzle[index] = 0;
    if (countSolutions(puzzle.slice(), 2) === 1) {
      removed++;
    } else {
      puzzle[index] = backup;
    }
  }
}

// ============ Drawing the board ============

function buildBoard() {
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;

    const input = document.createElement('input');
    input.className = 'sudoku-cell';
    input.inputMode = 'numeric';          // number keypad on phones
    input.autocomplete = 'off';
    input.dataset.index = i;
    input.setAttribute('aria-label', 'Row ' + (row + 1) + ', column ' + (col + 1));

    if (col === 2 || col === 5) input.classList.add('box-right');
    if (row === 2 || row === 5) input.classList.add('box-bottom');

    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeyDown);
    input.addEventListener('focus', () => highlight(i));

    boardEl.appendChild(input);
    cells.push(input);
  }
  boardEl.addEventListener('focusout', () => {
    // Clear highlights when focus leaves the board entirely.
    setTimeout(() => { if (!boardEl.contains(document.activeElement)) highlight(-1); });
  });
}

function showPuzzle() {
  boardEl.classList.remove('solved', 'revealed-board');
  cells.forEach((cell, i) => {
    const given = puzzle[i] !== 0;
    cell.value = given ? puzzle[i] : '';
    cell.readOnly = given;
    cell.classList.toggle('given', given);
    cell.classList.remove('conflict', 'wrong', 'related', 'same-num', 'revealed');
  });
}

// "Reveal solution" button: fill every square with the answer and lock the board.
// Numbers the player got wrong are marked red; ones they never filled in are shown in italics.
function revealSolution() {
  if (boardEl.classList.contains('solved') || boardEl.classList.contains('revealed-board')) return;
  if (!confirm('Reveal the solution? This ends the current game.')) return;

  cells.forEach((cell, i) => {
    if (cell.readOnly) return;                     // puzzle's own numbers: leave as is
    const typed = Number(cell.value);
    cell.classList.remove('conflict');
    cell.classList.toggle('wrong', typed !== 0 && typed !== solution[i]);
    cell.classList.toggle('revealed', typed !== solution[i]);
    cell.value = solution[i];
    cell.readOnly = true;
  });
  boardEl.classList.add('revealed-board');
  statusEl.textContent = 'Solution revealed. Press "New game" to play again.';
}

// ============ Playing ============

function currentGrid() {
  return cells.map(cell => Number(cell.value) || 0);
}

function onInput(event) {
  const cell = event.target;
  // Keep only the last digit 1–9 typed; anything else is cleared.
  cell.value = cell.value.replace(/[^1-9]/g, '').slice(-1);
  cell.classList.remove('wrong');
  afterChange(Number(cell.dataset.index));
}

function afterChange(index) {
  markConflicts();
  highlight(index);

  const grid = currentGrid();
  if (!grid.includes(0)) {
    if (grid.every((n, i) => n === solution[i])) {
      statusEl.textContent = 'Solved! Well done 🎉';
      boardEl.classList.add('solved');
    } else {
      statusEl.textContent = 'The board is full, but something is not right yet.';
    }
  } else {
    statusEl.textContent = grid.filter(n => n === 0).length + ' squares left';
  }
}

// Turn a number red if the same number appears again in its row, column or box.
function markConflicts() {
  const grid = currentGrid();
  cells.forEach((cell, i) => {
    const num = grid[i];
    let clash = false;
    if (num) {
      grid[i] = 0;                        // look at the others, not itself
      clash = !canPlace(grid, i, num);
      grid[i] = num;
    }
    cell.classList.toggle('conflict', clash);
  });
}

// Shade the selected square's row, column and box, and squares with the same number.
function highlight(index) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const value = index >= 0 ? cells[index].value : '';

  cells.forEach((cell, i) => {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    const related = index >= 0 && (r === row || c === col || b === box);
    cell.classList.toggle('related', related);
    cell.classList.toggle('same-num', value !== '' && cell.value === value && i !== index);
  });
}

// Arrow keys move around the board; Backspace/Delete clear a square.
function onKeyDown(event) {
  const index = Number(event.target.dataset.index);
  const moves = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };

  if (event.key in moves) {
    event.preventDefault();
    const next = index + moves[event.key];
    const sameRow = Math.floor(next / 9) === Math.floor(index / 9);
    if (next >= 0 && next < 81 && (Math.abs(moves[event.key]) === 9 || sameRow)) {
      cells[next].focus();
    }
  } else if ((event.key === 'Backspace' || event.key === 'Delete') && !event.target.readOnly) {
    event.preventDefault();
    event.target.value = '';
    event.target.classList.remove('wrong');
    afterChange(index);
  }
}

// "Check" button: mark every number the player entered that doesn't match the solution.
function checkBoard() {
  let mistakes = 0;
  cells.forEach((cell, i) => {
    const wrong = !cell.readOnly && cell.value !== '' && Number(cell.value) !== solution[i];
    cell.classList.toggle('wrong', wrong);
    if (wrong) mistakes++;
  });
  if (boardEl.classList.contains('solved') || boardEl.classList.contains('revealed-board')) return;
  statusEl.textContent = mistakes === 0
    ? 'No mistakes so far. Keep going!'
    : mistakes + (mistakes === 1 ? ' mistake' : ' mistakes') + ' marked in red.';
}

function newGame() {
  statusEl.textContent = 'Generating puzzle…';
  // Let the browser show that message before the (brief) number crunching starts.
  setTimeout(() => {
    generatePuzzle(HOLES[difficultyEl.value]);
    showPuzzle();
    statusEl.textContent = puzzle.filter(n => n === 0).length + ' squares left';
  }, 20);
}

// ============ Start ============
buildBoard();
document.getElementById('sudoku-new').addEventListener('click', newGame);
document.getElementById('sudoku-check').addEventListener('click', checkBoard);
document.getElementById('sudoku-reveal').addEventListener('click', revealSolution);
difficultyEl.addEventListener('change', newGame);
newGame();
