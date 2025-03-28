// Настройки сложности
const difficultySettings = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
  };
  
  
  // Элементы DOM
  const difficultySelect = document.getElementById('difficulty');
  const newGameBtn = document.getElementById('new-game');
  const boardElement = document.getElementById('board');
  const infoElement = document.getElementById('info');
  const explosionSound = document.getElementById('explosion-sound'); // элемент звука бомбы
  const winModal = document.getElementById('win-modal');
  const loseModal = document.getElementById('lose-modal');
  const playAgainWin = document.getElementById('play-again-win');
  const playAgainLose = document.getElementById('play-again-lose');
  // Игровые переменные
  let board = [];
  let rows, cols, mines;
  let revealedCount = 0;
  let flaggedCount = 0;
  let gameOver = false;
  let seconds = 0;
let timerInterval;
let gameStartTime;
let timeLeft;
let maxTime;

  // Инициализация новой игры
  function initGame() {
    const difficulty = difficultySelect.value;
    rows = difficultySettings[difficulty].rows;
    cols = difficultySettings[difficulty].cols;
    mines = difficultySettings[difficulty].mines;
    
    // Устанавливаем максимальное время в зависимости от сложности
    switch(difficulty) {
        case 'easy':
            maxTime = 120; // 2 минуты
            break;
        case 'medium':
            maxTime = 210; // 3.5 минуты
            break;
        case 'hard':
            maxTime = 300; // 5 минут
            break;
    }
    timeLeft = maxTime;
    
    stopTimer(); // Останавливаем таймер при новой игре
    updateTimerDisplay();
    
    // Устанавливаем максимальное количество флагов
    let maxFlags = mines;
    
    board = Array(rows).fill().map(() => Array(cols).fill(0));
    revealedCount = 0;
    flaggedCount = 0;
    gameOver = false;
    
    winModal.style.display = 'none';
    loseModal.style.display = 'none';
    
    renderBoard();
    infoElement.textContent = `Флагов: ${flaggedCount}/${mines}`;
}
  
  // Размещение мин
  function placeMines(firstClickRow, firstClickCol) {
    let minesPlaced = 0;
    
    // Создаем зону вокруг первого клика, где не будет мин
    const safeZone = [];
    for (let r = Math.max(0, firstClickRow - 1); r <= Math.min(rows - 1, firstClickRow + 1); r++) {
        for (let c = Math.max(0, firstClickCol - 1); c <= Math.min(cols - 1, firstClickCol + 1); c++) {
            safeZone.push(`${r},${c}`);
        }
    }
    
    while (minesPlaced < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        
        // Проверяем, что здесь нет мины и это не безопасная зона
        if (board[row][col] !== -1 && !safeZone.includes(`${row},${col}`)) {
            board[row][col] = -1; // -1 означает мину
            minesPlaced++;
            
            // Обновляем счетчики мин у соседних клеток
            for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
                    if (board[r][c] !== -1) {
                        board[r][c]++;
                    }
                }
            }
        }
    }
  }
  
  // Отрисовка игрового поля
  function renderBoard() {
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Добавляем обработчики событий
            cell.addEventListener('click', () => handleCellClick(row, col));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(row, col);
            });
            
            boardElement.appendChild(cell);
        }
    }
  }
  
  // Обработка клика по клетке
  function handleCellClick(row, col) {
    if (gameOver) return;
    if (revealedCount === 0) {
        startTimer();
        placeMines(row, col);
    }
    
    const cell = getCellElement(row, col);
    if (!cell || cell.classList.contains('revealed') || cell.classList.contains('flagged')) {
        return;
    }
    
    // Если это первый клик, размещаем мины
    if (revealedCount === 0) {
        placeMines(row, col);
    }
     // Проверяем поражение
     if (board[row][col] === -1) {
      cell.classList.add('mine');
      stopTimer();
      document.getElementById('lose-time').textContent = seconds;
      cell.textContent = '💣';
      gameOver = true;
    
    
      // Воспроизводим звук взрыва
      explosionSound.currentTime = 0; // Перематываем на начало
      explosionSound.play().catch(e => console.log("Не удалось воспроизвести звук:", e));
      revealAllMines();
      infoElement.textContent = 'Игра окончена! Вы проиграли.';
        // Показываем модальное окно поражения
        loseModal.style.display = 'flex';
        return;
    }
     
    // Открываем клетку
    revealCell(row, col);
    
    // Проверяем победу
    if (revealedCount === rows * cols - mines) {
        gameOver = true;
        stopTimer();
        document.getElementById('win-time').textContent = seconds;
        infoElement.textContent = 'Поздравляем! Вы победили!';
          // Показываем модальное окно победы
          winModal.style.display = 'flex';
      }
  }
  
  // Обработка правого клика (установка/снятие флага)
  function handleRightClick(row, col) {
    if (gameOver) return;
    
    const cell = getCellElement(row, col);
    if (!cell || cell.classList.contains('revealed')) {
        return;
    }
    const difficulty = difficultySelect.value;
    let maxFlags;
    switch(difficulty) {
        case 'easy':
            maxFlags = 10;
            break;
        case 'medium':
            maxFlags = 40;
            break;
        case 'hard':
            maxFlags = 99;
            break;
        default:
            maxFlags = 10;
    }
    
    
    if (cell.classList.contains('flagged')) {
        cell.classList.remove('flagged');
        cell.textContent = '';
        flaggedCount--;
    } else {
        if (flaggedCount >= maxFlags) {
            infoElement.textContent = `Лимит флагов: ${maxFlags}!`;
            infoElement.classList.add('limit-warning');
            setTimeout(() => infoElement.classList.remove('limit-warning'), 1500);
            return;
        }
        cell.classList.add('flagged');
        cell.textContent = '🚩';
        flaggedCount++;
    }
    
    infoElement.textContent = `Флагов: ${flaggedCount}/${mines}`;
  }

  
function startTimer() {
    timeLeft = maxTime;
    updateTimerDisplay();
    timerInterval = setInterval(updateTimer, 1000);
}
function updateTimer() {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 30) {
        document.getElementById('timer').classList.add('warning');
    } else {
        document.getElementById('timer').classList.remove('warning');
    }
    
    if (timeLeft <= 0) {
        stopTimer();
        gameOver = true;
        infoElement.textContent = 'Время вышло! Игра окончена.';
        revealAllMines();
        document.getElementById('lose-time').textContent = maxTime;
        loseModal.style.display = 'flex';
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = `Время: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function stopTimer() {
    clearInterval(timerInterval);
}

  // Открытие клетки
  function revealCell(row, col) {
    const cell = getCellElement(row, col);
    if (!cell || cell.classList.contains('revealed') || cell.classList.contains('flagged')) {
        return;
    }
    
    cell.classList.add('revealed');
    revealedCount++;
    
    if (board[row][col] > 0) {
        cell.textContent = board[row][col];
        cell.classList.add(`mines-count-${board[row][col]}`);
    } else if (board[row][col] === 0) {
        // Если пустая клетка, открываем соседей рекурсивно
        for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
                if (r !== row || c !== col) {
                    revealCell(r, c);
                }
            }
        }
    }
  }
  
  // Показать все мины при проигрыше
  function revealAllMines() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] === -1) {
                const cell = getCellElement(row, col);
                if (cell && !cell.classList.contains('flagged')) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                }
            }
        }
    }
  }
  
  // Получить элемент клетки по координатам
  function getCellElement(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  }
  
  // Начало новой игры
  newGameBtn.addEventListener('click', initGame);
  
  // Инициализация первой игры
  document.addEventListener('DOMContentLoaded', initGame);
  // Обработчики для кнопок "Играть снова"
  playAgainWin.addEventListener('click', initGame);
  playAgainLose.addEventListener('click', initGame);
  
  // Инициализация первой игры
  document.addEventListener('DOMContentLoaded', initGame);