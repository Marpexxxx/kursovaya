const rows = 10;
const cols = 10;
const bombs = 10;
let board = [];
let gameOver = false;

// Инициализация игрового поля
function initBoard() {
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    placeBombs();
    calculateNumbers();
}

// Размещение бомб
function placeBombs() {
    let placedBombs = 0;
    while (placedBombs < bombs) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        if (board[row][col] === 0) {
            board[row][col] = 'B'; // 'B' - символ бомбы
            placedBombs++;
        }
    }
}

// Подсчет соседей
function calculateNumbers() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] === 'B') continue;
            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (row + i >= 0 && row + i < rows && col + j >= 0 && col + j < cols) {
                        if (board[row + i][col + j] === 'B') count++;
                    }
                }
            }
            board[row][col] = count;
        }
    }
}

// Отображение игрового поля
function drawBoard() {
    const gameDiv = document.getElementById('game');
    gameDiv.innerHTML = '';
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            cell.addEventListener('click', () => openCell(row, col));

            gameDiv.appendChild(cell);
        }
    }
}

// Открытие ячейки
function openCell(row, col) {
    if (gameOver) return;

    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (board[row][col] === 'B') {
        cell.classList.add('bomb');
        alert('Игра окончена!');
        gameOver = true;
    } else {
        cell.classList.add('open');
        cell.textContent = board[row][col] > 0 ? board[row][col] : '';
    }
}

// Начало игры
initBoard();
drawBoard();