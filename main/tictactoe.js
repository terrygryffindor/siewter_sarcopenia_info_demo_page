// ---------- Tic-tac-toe logic ----------
// Not currently used by any page. To add the game to a page:
//
// 1. In <head>:   <link rel="stylesheet" href="tictactoe.css">
// 2. In <body>, paste this markup:
//
//    <section class="game">
//      <h2>Tic-tac-toe</h2>
//      <p id="game-status" class="game-status" aria-live="polite">Player X's turn</p>
//      <div class="board" id="board">
//        <button class="cell" data-index="0" aria-label="Square 1"></button>
//        ... one button per square, data-index 0 to 8 ...
//        <button class="cell" data-index="8" aria-label="Square 9"></button>
//      </div>
//      <button class="reset-btn" id="reset-btn">New game</button>
//    </section>
//
// 3. After that markup:   <script src="tictactoe.js"></script>

// The board is stored as an array of 9 slots: '' (empty), 'X' or 'O'.
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameOver = false;

// Every possible way to get three in a row (by square index).
//   0 | 1 | 2
//   3 | 4 | 5
//   6 | 7 | 8
const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],   // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8],   // columns
  [0, 4, 8], [2, 4, 6]               // diagonals
];

const cells = document.querySelectorAll('.cell');
const statusEl = document.getElementById('game-status');

// Returns the winning line (e.g. [0, 4, 8]) if someone has won, otherwise null.
function findWinner() {
  for (const line of winningLines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

function handleClick(event) {
  const index = Number(event.target.dataset.index);

  // Ignore clicks on filled squares or after the game has ended.
  if (gameOver || board[index] !== '') return;

  // 1. Record the move and show it on screen.
  board[index] = currentPlayer;
  event.target.textContent = currentPlayer;
  event.target.classList.add(currentPlayer === 'X' ? 'x' : 'o');

  // 2. Check for a win.
  const winLine = findWinner();
  if (winLine) {
    gameOver = true;
    statusEl.textContent = 'Player ' + currentPlayer + ' wins!';
    winLine.forEach(i => cells[i].classList.add('win'));
    return;
  }

  // 3. Check for a draw (no empty squares left).
  if (!board.includes('')) {
    gameOver = true;
    statusEl.textContent = "It's a draw!";
    return;
  }

  // 4. Otherwise, switch to the other player.
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  statusEl.textContent = 'Player ' + currentPlayer + "'s turn";
}

function resetGame() {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameOver = false;
  statusEl.textContent = "Player X's turn";
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('x', 'o', 'win');
  });
}

cells.forEach(cell => cell.addEventListener('click', handleClick));
document.getElementById('reset-btn').addEventListener('click', resetGame);
