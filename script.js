document.addEventListener('DOMContentLoaded', () => {
    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И СОСТОЯНИЯ ---
    let currentUser = null; // Текущий залогиненный пользователь
    let users = {}; // Объект для хранения всех пользователей: {username: {password: 'hashed', balance: 999999999}, ...}
    const INITIAL_BALANCE = 999999999;

    // --- DOM ЭЛЕМЕНТЫ ---
    const casinoBalanceDisplay = document.getElementById('casinoBalance');
    const betAmountInput = document.getElementById('betAmount');
    const betButtons = document.querySelectorAll('.bet-button');
    const casinoResultDisplay = document.getElementById('casinoResult');
    const rouletteSection = document.querySelector('.casino');

    const saveGameButton = document.getElementById('saveGame');
    const loadGameButton = document.getElementById('loadGame');
    const resetGameButton = document.getElementById('resetGame');

    // Mini-Game 1: Coin Flip
    const coinFlipBetInput = document.getElementById('coinFlipBet');
    const flipHeadsButton = document.getElementById('flipHeads');
    const flipTailsButton = document.getElementById('flipTails');
    const coinFlipResultDisplay = document.getElementById('coinFlipResult');

    // Mini-Game 2: Choose the Box
    const boxGameCostDisplay = document.getElementById('boxGameCost');
    const boxButtons = document.querySelectorAll('.box-button');
    const boxGameResultDisplay = document.getElementById('boxGameResult');
    const boxGameCost = 100;

    // Mini-Game 3: Higher/Lower
    const higherLowerBetInput = document.getElementById('higherLowerBet');
    const currentNumberDisplay = document.getElementById('currentNumber');
    const guessHigherButton = document.getElementById('guessHigher');
    const guessLowerButton = document.getElementById('guessLower');
    const higherLowerResultDisplay = document.getElementById('higherLowerResult');
    let currentNumber = 0; // Для Higher/Lower игры

    // --- НОВЫЕ DOM ЭЛЕМЕНТЫ ДЛЯ АВТОРИЗАЦИИ И ТОПА ---
    const authSection = document.getElementById('authSection');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginButton = document.getElementById('loginButton');
    const loginMessageDisplay = document.getElementById('loginMessage');

    const registerUsernameInput = document.getElementById('registerUsername');
    const registerPasswordInput = document.getElementById('registerPassword');
    const registerButton = document.getElementById('registerButton');
    const registerMessageDisplay = document.getElementById('registerMessage');

    const userInfoSection = document.getElementById('userInfo');
    const currentUsernameDisplay = document.getElementById('currentUsername');
    const logoutButton = document.getElementById('logoutButton');
    const gameContent = document.getElementById('gameContent'); // Весь игровой контент

    const leaderboardList = document.getElementById('leaderboardList');


    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

    // Хеширование пароля (простое, для демо)
    function hashPassword(password) {
        // В реальном приложении использовать bcrypt или Argon2
        return btoa(password); // Base64 кодирование
    }

    // Вспомогательная функция для отображения анимированных сообщений
    function showAnimatedMessage(element, message, type) {
        // Clear previous timeouts for this element if any
        clearTimeout(element._messageTimeout);
        clearTimeout(element._removeClassesTimeout);

        element.textContent = message;
        // Ensure only one of 'win' or 'lose' is active
        element.classList.remove('win', 'lose', 'show', 'flash'); // Clean up
        element.classList.add('game-message', 'show', type, 'flash');

        element._messageTimeout = setTimeout(() => {
            element.classList.remove('flash'); // Remove flash effect first
        }, 600); // Duration of flash animation

        element._removeClassesTimeout = setTimeout(() => {
            element.classList.remove('show', type); // Remove 'show' and 'type' class after animation
            element.textContent = ''; // Clear text
        }, 1500); // Total duration of message visibility
    }


    // Вспомогательная функция для пульсации баланса
    function pulseBalance() {
        casinoBalanceDisplay.classList.add('pulse');
        setTimeout(() => {
            casinoBalanceDisplay.classList.remove('pulse');
        }, 400); // Длительность анимации пульса
    }

    // Обновление состояния всех кнопок и отображения
    function updateDisplay() {
        if (currentUser) {
            casinoBalanceDisplay.textContent = Math.floor(users[currentUser].balance);
            pulseBalance(); // Анимируем баланс при обновлении

            // Рулетка
            const rouletteBet = parseInt(betAmountInput.value);
            betButtons.forEach(button => {
                button.disabled = users[currentUser].balance < rouletteBet || rouletteBet <= 0;
            });

            // Подбрасывание монеты
            const coinBet = parseInt(coinFlipBetInput.value);
            flipHeadsButton.disabled = users[currentUser].balance < coinBet || coinBet <= 0;
            flipTailsButton.disabled = users[currentUser].balance < coinBet || coinBet <= 0;

            // Выбери коробку
            boxGameCostDisplay.textContent = boxGameCost;
            boxButtons.forEach(button => {
                button.disabled = users[currentUser].balance < boxGameCost;
                button.style.backgroundColor = ''; // Сброс цвета
                button.classList.remove('shaking'); // Убедиться, что не трясутся
            });

            // Больше/Меньше
            const hlBet = parseInt(higherLowerBetInput.value);
            guessHigherButton.disabled = users[currentUser].balance < hlBet || hlBet <= 0;
            guessLowerButton.disabled = users[currentUser].balance < hlBet || hlBet <= 0;

            if (currentNumber === 0) {
                currentNumberDisplay.textContent = '?';
            } else {
                currentNumberDisplay.textContent = currentNumber;
            }

            // Обновить кнопки сохранения/загрузки/сброса
            saveGameButton.disabled = false;
            loadGameButton.disabled = false;
            resetGameButton.disabled = false;

        } else {
            // Если пользователь не залогинен, все игровые элементы должны быть неактивны
            casinoBalanceDisplay.textContent = '---';
            betButtons.forEach(button => button.disabled = true);
            flipHeadsButton.disabled = true;
            flipTailsButton.disabled = true;
            boxButtons.forEach(button => button.disabled = true);
            guessHigherButton.disabled = true;
            guessLowerButton.disabled = true;
            saveGameButton.disabled = true;
            loadGameButton.disabled = true;
            resetGameButton.disabled = true;
        }

        updateLeaderboard(); // Обновляем топ при каждом изменении баланса
    }

    // --- ФУНКЦИИ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ И АВТОРИЗАЦИИ ---

    function loadUsers() {
        const savedUsers = localStorage.getItem('casinoUsers');
        if (savedUsers) {
            users = JSON.parse(savedUsers);
        } else {
            users = {};
        }
    }

    function saveUsers() {
        localStorage.setItem('casinoUsers', JSON.stringify(users));
    }

    function registerUser() {
        const username = registerUsernameInput.value.trim();
        const password = registerPasswordInput.value.trim();

        if (!username || !password) {
            showAnimatedMessage(registerMessageDisplay, 'Username and password cannot be empty.', 'lose');
            return;
        }
        if (users[username]) {
            showAnimatedMessage(registerMessageDisplay, 'Username already exists.', 'lose');
            return;
        }

        users[username] = {
            password: hashPassword(password),
            balance: INITIAL_BALANCE,
            higherLowerNum: 0 // Инициализируем для новой игры Higher/Lower
        };
        saveUsers();
        showAnimatedMessage(registerMessageDisplay, 'Registration successful! You can now log in.', 'win');
        // Очищаем поля
        registerUsernameInput.value = '';
        registerPasswordInput.value = '';
        // Переключаем на форму входа
        showLoginForm();
    }

    function loginUser() {
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();

        if (!username || !password) {
            showAnimatedMessage(loginMessageDisplay, 'Username and password cannot be empty.', 'lose');
            return;
        }
        if (!users[username] || users[username].password !== hashPassword(password)) {
            showAnimatedMessage(loginMessageDisplay, 'Invalid username or password.', 'lose');
            return;
        }

        currentUser = username;
        // Загружаем состояние игры для пользователя
        // Важно: currentNumber для Higher/Lower должен быть привязан к пользователю
        currentNumber = users[currentUser].higherLowerNum || 0;
        initializeHigherLower(); // Инициализируем игру Higher/Lower для текущего пользователя
        saveUsers(); // Сохраняем текущее состояние
        showGameView(); // Показываем игровой контент
        showAnimatedMessage(loginMessageDisplay, `Welcome, ${currentUser}!`, 'win');
        currentUsernameDisplay.textContent = currentUser;
        updateDisplay();
        // Очищаем поля
        loginUsernameInput.value = '';
        loginPasswordInput.value = '';
    }

    function logoutUser() {
        if (confirm('Are you sure you want to log out? Your current game will be saved.')) {
            saveGame(); // Сохраняем игру перед выходом
            currentUser = null;
            currentNumber = 0; // Сбрасываем для следующей сессии
            showAuthView(); // Показываем формы авторизации
            updateDisplay();
            showAnimatedMessage(casinoResultDisplay, 'Logged out successfully.', 'win');
        }
    }

    // --- УПРАВЛЕНИЕ ВИДИМОСТЬЮ UI ---

    function showGameView() {
        authSection.style.display = 'none';
        userInfoSection.style.display = 'flex'; // Use flex for proper alignment
        gameContent.style.display = 'block';
    }

    function showAuthView() {
        authSection.style.display = 'block';
        userInfoSection.style.display = 'none';
        gameContent.style.display = 'none';
        // Убедиться, что форма логина активна по умолчанию при загрузке
        showLoginForm();
    }

    function showRegisterForm() {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        loginMessageDisplay.textContent = ''; // Очистить сообщения
        registerMessageDisplay.textContent = '';
    }

    function showLoginForm() {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
        loginMessageDisplay.textContent = ''; // Очистить сообщения
        registerMessageDisplay.textContent = '';
    }

    // --- ФУНКЦИИ ИГР ---

    // Roulette
    function spinRoulette(betColor) {
        if (!currentUser) return; // Проверка на авторизацию
        const betAmount = parseInt(betAmountInput.value);

        if (isNaN(betAmount) || betAmount <= 0) {
            showAnimatedMessage(casinoResultDisplay, 'Please enter a valid bet amount!', 'lose');
            return;
        }
        if (users[currentUser].balance < betAmount) {
            showAnimatedMessage(casinoResultDisplay, 'You do not have enough balance for this bet!', 'lose');
            return;
        }

        users[currentUser].balance -= betAmount;
        updateDisplay();

        rouletteSection.classList.add('spinning');
        betButtons.forEach(button => button.disabled = true);

        setTimeout(() => {
            rouletteSection.classList.remove('spinning');

            const outcome = Math.floor(Math.random() * 100);
            let resultColor;
            let winMultiplier = 0;

            if (outcome < 4) { // 4% for green
                resultColor = 'green';
                winMultiplier = 14;
            } else if (outcome < 52) { // 48% for red (4% + 48% = 52%)
                resultColor = 'red';
                winMultiplier = 2;
            } else { // 48% for black
                resultColor = 'black';
                winMultiplier = 2;
            }

            if (betColor === resultColor) {
                const winnings = betAmount * winMultiplier;
                users[currentUser].balance += winnings;
                showAnimatedMessage(casinoResultDisplay, `You WIN! Rolled ${resultColor.toUpperCase()}. You won ${Math.floor(winnings)} points!`, 'win');
            } else {
                showAnimatedMessage(casinoResultDisplay, `You LOSE! Rolled ${resultColor.toUpperCase()}. You lost ${betAmount} points.`, 'lose');
            }
            updateDisplay();
            betButtons.forEach(button => button.disabled = false);
            saveUsers(); // Сохраняем изменения баланса
        }, 1500);
    }

    // Coin Flip
    function playCoinFlip(guess) {
        if (!currentUser) return;
        const bet = parseInt(coinFlipBetInput.value);
        if (isNaN(bet) || bet <= 0 || users[currentUser].balance < bet) {
            showAnimatedMessage(coinFlipResultDisplay, 'Invalid bet amount or not enough balance!', 'lose');
            return;
        }

        users[currentUser].balance -= bet;
        updateDisplay();

        flipHeadsButton.disabled = true;
        flipTailsButton.disabled = true;

        setTimeout(() => {
            const result = Math.random() < 0.5 ? 'heads' : 'tails';

            if (guess === result) {
                const winnings = bet * 2;
                users[currentUser].balance += winnings;
                showAnimatedMessage(coinFlipResultDisplay, `It's ${result.toUpperCase()}! You won ${Math.floor(winnings)} points!`, 'win');
            } else {
                showAnimatedMessage(coinFlipResultDisplay, `It's ${result.toUpperCase()}! You lost ${bet} points.`, 'lose');
            }
            updateDisplay();
            flipHeadsButton.disabled = false;
            flipTailsButton.disabled = false;
            saveUsers(); // Сохраняем изменения баланса
        }, 800);
    }

    // Choose the Box
    function chooseBox(chosenBoxIndex) {
        if (!currentUser) return;
        if (users[currentUser].balance < boxGameCost) {
            showAnimatedMessage(boxGameResultDisplay, 'Not enough balance to play Choose the Box!', 'lose');
            return;
        }

        users[currentUser].balance -= boxGameCost;
        updateDisplay();

        boxButtons.forEach(button => {
            button.classList.add('shaking');
            button.disabled = true;
        });

        setTimeout(() => {
            boxButtons.forEach(button => {
                button.classList.remove('shaking');
                button.disabled = false;
            });

            const winningBoxIndex = Math.floor(Math.random() * 3) + 1;
            const prize = boxGameCost * 3;

            // Reset box colors first
            boxButtons.forEach(button => button.style.backgroundColor = '');

            if (chosenBoxIndex === winningBoxIndex) {
                users[currentUser].balance += prize;
                showAnimatedMessage(boxGameResultDisplay, `You picked Box ${chosenBoxIndex}! It was the winning box! You won ${Math.floor(prize)} points!`, 'win');
                document.getElementById(`box${chosenBoxIndex}`).style.backgroundColor = '#4CAF50';
            } else {
                showAnimatedMessage(boxGameResultDisplay, `You picked Box ${chosenBoxIndex}. The winning box was Box ${winningBoxIndex}. You lost ${boxGameCost} points.`, 'lose');
                document.getElementById(`box${chosenBoxIndex}`).style.backgroundColor = '#dc3545';
                document.getElementById(`box${winningBoxIndex}`).style.backgroundColor = '#4CAF50';
            }
            updateDisplay();
            saveUsers(); // Сохраняем изменения баланса
        }, 1000);
    }

    // Higher/Lower
    function initializeHigherLower() {
        // Инициализируем currentNumber только если он 0 (новая игра или после сброса)
        if (users[currentUser].higherLowerNum === 0) {
            users[currentUser].higherLowerNum = Math.floor(Math.random() * 10) + 1;
        }
        currentNumber = users[currentUser].higherLowerNum;
        currentNumberDisplay.textContent = currentNumber; // Убедимся, что на дисплее правильное число
        updateDisplay();
    }

    function playHigherLower(guess) {
        if (!currentUser) return;
        const bet = parseInt(higherLowerBetInput.value);
        if (isNaN(bet) || bet <= 0 || users[currentUser].balance < bet || currentNumber === 0) {
            showAnimatedMessage(higherLowerResultDisplay, 'Invalid bet amount, not enough balance, or game not initialized!', 'lose');
            return;
        }

        users[currentUser].balance -= bet;
        updateDisplay();

        currentNumberDisplay.classList.add('fade-out');
        guessHigherButton.disabled = true;
        guessLowerButton.disabled = true;

        setTimeout(() => {
            currentNumberDisplay.classList.remove('fade-out');

            const nextNumber = Math.floor(Math.random() * 10) + 1;
            let won = false;

            if (guess === 'higher') {
                if (nextNumber > currentNumber) {
                    won = true;
                }
            } else if (guess === 'lower') {
                if (nextNumber < currentNumber) {
                    won = true;
                }
            }

            if (nextNumber === currentNumber) {
                showAnimatedMessage(higherLowerResultDisplay, `It was ${nextNumber}. A tie! You lost ${bet} points.`, 'lose');
            } else if (won) {
                const winnings = bet * 1.8;
                users[currentUser].balance += winnings;
                showAnimatedMessage(higherLowerResultDisplay, `It was ${nextNumber}! You guessed correctly and won ${Math.floor(winnings)} points!`, 'win');
            } else {
                showAnimatedMessage(higherLowerResultDisplay, `It was ${nextNumber}! You guessed wrong and lost ${bet} points.`, 'lose');
            }

            users[currentUser].higherLowerNum = nextNumber; // Сохраняем новое число для пользователя
            currentNumber = nextNumber; // Обновляем локальную переменную
            currentNumberDisplay.classList.add('fade-in');
            updateDisplay();

            setTimeout(() => {
                currentNumberDisplay.classList.remove('fade-in');
                guessHigherButton.disabled = false;
                guessLowerButton.disabled = false;
                saveUsers(); // Сохраняем изменения баланса и currentNumber
            }, 300);
        }, 500);
    }


    // --- ФУНКЦИИ СОХРАНЕНИЯ/ЗАГРУЗКИ/СБРОСА (АДАПТИРОВАНЫ ПОД ПОЛЬЗОВАТЕЛЕЙ) ---

    function saveGame() {
        if (!currentUser) {
            showAnimatedMessage(casinoResultDisplay, 'Please log in to save your game.', 'lose');
            return;
        }
        // Баланс и higherLowerNum уже обновляются в users[currentUser] при игре
        // Просто вызываем saveUsers()
        saveUsers();
        showAnimatedMessage(casinoResultDisplay, 'Game Saved!', 'win');
    }

    function loadGame() {
        // При загрузке игры мы загружаем всех пользователей, а текущий пользователь определяется loginUser()
        // Эта функция больше для инициализации при первом запуске, когда нет залогиненного пользователя
        loadUsers();
        if (currentUser && users[currentUser]) {
            // Если есть залогиненный пользователь из предыдущей сессии (через localStorage),
            // то загружаем его данные и показываем игру
            currentNumber = users[currentUser].higherLowerNum || 0;
            initializeHigherLower();
            showGameView();
            currentUsernameDisplay.textContent = currentUser;
            showAnimatedMessage(casinoResultDisplay, `Welcome back, ${currentUser}! Game Loaded!`, 'win');
        } else {
            showAuthView(); // Если нет залогиненного, показываем авторизацию
            showAnimatedMessage(casinoResultDisplay, 'Please log in or register to play.', 'lose');
        }
        updateDisplay(); // Обновляем UI после загрузки
    }

    function resetGame() {
        if (!currentUser) {
            showAnimatedMessage(casinoResultDisplay, 'Please log in to reset your game.', 'lose');
            return;
        }
        if (confirm('Are you sure you want to reset your game? This cannot be undone!')) {
            users[currentUser].balance = INITIAL_BALANCE;
            users[currentUser].higherLowerNum = 0; // Сброс Higher/Lower для текущего пользователя
            currentNumber = 0; // Обновить локальную переменную
            saveUsers();
            initializeHigherLower(); // Переинициализировать Higher/Lower
            updateDisplay();
            showAnimatedMessage(casinoResultDisplay, 'Game Reset!', 'lose');
        }
    }

    // --- ФУНКЦИИ УПРАВЛЕНИЯ ТОПОМ ---

    function updateLeaderboard() {
        const sortedUsers = Object.keys(users)
            .map(username => ({
                username: username,
                balance: users[username].balance
            }))
            .sort((a, b) => b.balance - a.balance); // Сортируем по убыванию баланса

        leaderboardList.innerHTML = ''; // Очищаем список

        if (sortedUsers.length === 0) {
            leaderboardList.innerHTML = '<p>No players yet. Register to be the first!</p>';
            return;
        }

        // Добавляем заголовки таблицы
        const header = document.createElement('div');
        header.classList.add('leaderboard-item');
        header.style.fontWeight = 'bold';
        header.style.borderBottom = '2px solid #61dafb';
        header.innerHTML = `<div class="rank">#</div><div class="username">Player</div><div class="balance">Balance</div>`;
        leaderboardList.appendChild(header);

        sortedUsers.slice(0, 10).forEach((player, index) => { // Показываем топ-10
            const item = document.createElement('div');
            item.classList.add('leaderboard-item');
            item.innerHTML = `
                <div class="rank">${index + 1}</div>
                <div class="username">${player.username}</div>
                <div class="balance">${Math.floor(player.balance)}</div>
            `;
            leaderboardList.appendChild(item);
        });
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

    // Кнопки авторизации
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    registerButton.addEventListener('click', registerUser);
    loginButton.addEventListener('click', loginUser);
    logoutButton.addEventListener('click', logoutUser);

    // Рулетка
    betButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const betColor = event.target.dataset.color;
            spinRoulette(betColor);
        });
    });
    betAmountInput.addEventListener('input', updateDisplay);

    // Подбрасывание монеты
    flipHeadsButton.addEventListener('click', () => playCoinFlip('heads'));
    flipTailsButton.addEventListener('click', () => playCoinFlip('tails'));
    coinFlipBetInput.addEventListener('input', updateDisplay);

    // Выбери коробку
    boxButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const boxIndex = parseInt(event.target.id.replace('box', ''));
            chooseBox(boxIndex);
        });
    });

    // Больше/Меньше
    guessHigherButton.addEventListener('click', () => playHigherLower('higher'));
    guessLowerButton.addEventListener('click', () => playHigherLower('lower'));
    higherLowerBetInput.addEventListener('input', updateDisplay);


    // Кнопки сохранения/загрузки/сброса
    saveGameButton.addEventListener('click', saveGame);
    loadGameButton.addEventListener('click', loadGame);
    resetGameButton.addEventListener('click', resetGame);

    // --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
    loadUsers(); // Загружаем всех пользователей
    // Пытаемся автоматически залогинить последнего пользователя (если он есть в localStorage)
    currentUser = localStorage.getItem('lastLoggedInUser');
    if (currentUser && users[currentUser]) {
        // Если последний пользователь существует и его данные в порядке
        currentNumber = users[currentUser].higherLowerNum || 0; // Загружаем его текущий Higher/Lower номер
        initializeHigherLower();
        showGameView();
        currentUsernameDisplay.textContent = currentUser;
        showAnimatedMessage(casinoResultDisplay, `Welcome back, ${currentUser}!`, 'win');
    } else {
        currentUser = null; // Если нет последнего пользователя или данные повреждены
        showAuthView(); // Показываем формы регистрации/логина
    }
    updateDisplay(); // Инициализация UI
    updateLeaderboard(); // Инициализация топа
});
