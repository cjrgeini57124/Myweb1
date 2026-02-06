document.addEventListener('DOMContentLoaded', () => {
    /* ----------------------------------------------------------------
       1. Date Calculator
    ---------------------------------------------------------------- */
    const dateInput = document.getElementById('calc-date');
    const resultDisplay = document.getElementById('calc-result');

    // Default to today
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];

    function getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    function updateCalcResult() {
        const val = dateInput.value;
        if (!val) {
            resultDisplay.textContent = '请选择日期';
            return;
        }
        const date = new Date(val);
        const dayOfYear = getDayOfYear(date);
        const year = date.getFullYear();

        // Excel Logic: (YEAR(A1)-1900)*1000+A1-DATE(YEAR(A1),1,1)+1
        // Effectively: (Year - 1900) * 1000 + DayOfYear
        const excelValue = (year - 1900) * 1000 + dayOfYear;

        resultDisplay.innerHTML = `
            <div>${year}年的第 ${dayOfYear} 天</div>
            <div style="font-size: 1.8em; color: #6c5ce7; margin-top: 5px;">${excelValue}</div>
        `;
    }

    dateInput.addEventListener('change', updateCalcResult);
    // Initial Calc
    updateCalcResult();

    /* ----------------------------------------------------------------
       2. Year Progress (Grid)
    ---------------------------------------------------------------- */
    const progressGrid = document.getElementById('year-progress-grid');
    const progressText = document.getElementById('year-progress-percent');
    const titleWithYear = document.querySelector('.progress-card h2');

    // Init Grid
    function initProgressGrid(year) {
        progressGrid.innerHTML = '';
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInYear = isLeap ? 366 : 365;

        for (let i = 1; i <= daysInYear; i++) {
            const square = document.createElement('div');
            square.classList.add('day-square');
            square.dataset.day = i;
            progressGrid.appendChild(square);
        }
    }

    let lastYearInit = null;

    function updateYearProgress() {
        const now = new Date();
        const year = now.getFullYear();

        // Re-init grid if year changes or not init
        if (lastYearInit !== year) {
            initProgressGrid(year);
            lastYearInit = year;
            titleWithYear.textContent = `⏳ ${year}年进度`;
        }

        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year + 1, 0, 1);
        const total = endOfYear - startOfYear;
        const elapsed = now - startOfYear;
        const percent = (elapsed / total) * 100;

        progressText.textContent = `${percent.toFixed(2)}%`; // Simple 2 decimals is cleaner for grid

        // Update Squares
        // Day of Year?
        const currentDay = getDayOfYear(now);
        const squares = progressGrid.children;

        // Optimisation: Don't loop all every tick?
        // Actually 365 is small enough.
        for (let i = 0; i < squares.length; i++) {
            const dayNum = i + 1;
            if (dayNum < currentDay) {
                squares[i].className = 'day-square filled';
            } else if (dayNum === currentDay) {
                squares[i].className = 'day-square current';
            } else {
                squares[i].className = 'day-square';
            }
        }
    }

    /* ----------------------------------------------------------------
       3. Holiday Countdown
    ---------------------------------------------------------------- */
    // Officially released holidays for 2026 (Hardcoded for accuracy)
    // Format: YYYY-MM-DD
    const holidays2026 = [
        { name: '元旦', date: '2026-01-01' },
        { name: '春节', date: '2026-02-15' }, // Start of holiday block
        { name: '清明节', date: '2026-04-04' },
        { name: '劳动节', date: '2026-05-01' },
        { name: '端午节', date: '2026-06-19' },
        { name: '中秋节', date: '2026-09-25' },
        { name: '国庆节', date: '2026-10-01' }
    ];

    // For 2027 (Estimates or Hardcoded if needed, for now just 2026 loop or next year logic)
    // To keep it simple but robust, we can add 2027 dates later or auto-generator if needed.
    // For this prompt, let's focus on current year logic + cross-year support.

    function getHolidays() {
        const currentYear = new Date().getFullYear();
        // Basic dynamic fallback if we run this in non-2026 years without hardcoded data
        if (currentYear === 2026) return holidays2026;
        // Fallback/Extensible: 
        return holidays2026;
    }

    function updateHolidayCountdown() {
        const now = new Date();
        const allHolidays = getHolidays();

        // Filter holidays that are in the future
        // Note: We create Date objects with time 00:00:00 to compare dates
        // But for countdown we want precise time? Usually holiday starts at 00:00
        let upcoming = allHolidays.map(h => {
            let d = new Date(h.date + 'T00:00:00');
            return { ...h, obj: d };
        }).filter(h => h.obj > now);

        // If no more holidays this year (e.g. Dec), we should ideally look at next year.
        // For simplicity in this demo, let's assume we are in early 2026 or have valid data.

        if (upcoming.length === 0) {
            document.getElementById('next-holiday-name').textContent = '明年见';
            document.getElementById('next-holiday-timer').textContent = '--';
            return;
        }

        const next = upcoming[0];
        const nextNext = upcoming[1];

        // Countdown
        const diff = next.obj - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        // Display
        document.getElementById('next-holiday-name').textContent = next.name;
        document.getElementById('next-holiday-timer').textContent = `${days}天 ${hours}小时`;

        if (nextNext) {
            document.getElementById('next-next-holiday-name').textContent = `${nextNext.name} (${nextNext.date})`;
        } else {
            document.getElementById('next-next-holiday-name').textContent = '今年假期已休完';
        }
    }

    // Modal Logic
    const modal = document.getElementById('holiday-modal');
    const openModalBtn = document.getElementById('view-all-holidays');
    const closeModalBtn = document.getElementById('close-modal');
    const holidayListEl = document.getElementById('holiday-list');

    openModalBtn.addEventListener('click', () => {
        modal.classList.add('active');
        holidayListEl.innerHTML = '';
        const now = new Date();

        getHolidays().forEach(h => {
            // Use 00:00:00 for accurate day diff
            const d = new Date(h.date + 'T00:00:00');
            const diffTime = d - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isPast = diffDays < 0;

            const li = document.createElement('li');
            if (isPast) li.classList.add('past');

            let statusText = '';
            if (isPast) {
                statusText = '已过';
            } else if (diffDays === 0) {
                statusText = '今天!';
            } else {
                statusText = `还有 ${diffDays} 天`;
            }

            li.innerHTML = `
                <div class="h-name">${h.name} <span style="font-size:0.8em; color:#999;">(${h.date})</span></div>
                <div class="h-status" style="${isPast ? '' : 'color:#e17055; font-weight:bold;'}">${statusText}</div>
             `;
            holidayListEl.appendChild(li);
        });
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    /* ----------------------------------------------------------------
       4. Work Countdown
    ---------------------------------------------------------------- */
    const workStartInput = document.getElementById('work-start');
    const workEndInput = document.getElementById('work-end');
    // const saveBtn = document.getElementById('save-work-time'); // Removed
    const workTimerEl = document.getElementById('work-timer');
    const workMessageEl = document.getElementById('work-message');

    // Load from local storage
    if (localStorage.getItem('workStart')) workStartInput.value = localStorage.getItem('workStart');
    if (localStorage.getItem('workEnd')) workEndInput.value = localStorage.getItem('workEnd');

    // Auto-save & Update on Input
    function onWorkTimeChange() {
        localStorage.setItem('workStart', workStartInput.value);
        localStorage.setItem('workEnd', workEndInput.value);
        updateWorkCountdown();
    }

    workStartInput.addEventListener('change', onWorkTimeChange);
    workEndInput.addEventListener('change', onWorkTimeChange);

    function updateWorkCountdown() {
        const now = new Date();
        const startStr = workStartInput.value;
        const endStr = workEndInput.value;

        if (!startStr || !endStr) return;

        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);

        const startTime = new Date(now);
        startTime.setHours(startH, startM, 0, 0);

        const endTime = new Date(now);
        endTime.setHours(endH, endM, 0, 0);

        // Logic
        if (now < startTime) {
            // Before work
            workTimerEl.textContent = '--:--:--';
            workMessageEl.textContent = '还没到上班时间，再睡会儿💤';
            workTimerEl.style.color = '#a29bfe';
        } else if (now >= startTime && now < endTime) {
            // Working
            const diff = endTime - now;
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            workTimerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            workMessageEl.textContent = '努力搬砖中...加油！💪';
            workTimerEl.style.color = '#0984e3';
        } else {
            // After work
            workTimerEl.textContent = '00:00:00';
            workMessageEl.textContent = '下班快乐～ 🎉 Enjoy!';
            workTimerEl.style.color = '#00b894';
        }
    }

    /* ----------------------------------------------------------------
       5. Todo List
    ---------------------------------------------------------------- */
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoListEl = document.getElementById('todo-list');

    let todos = JSON.parse(localStorage.getItem('todoList')) || [];

    function saveTodos() {
        localStorage.setItem('todoList', JSON.stringify(todos));
        renderTodos();
    }

    function renderTodos() {
        todoListEl.innerHTML = '';
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="todo-checkbox" onclick="toggleTodo(${index})"></div>
                <div class="todo-text">${todo.text}</div>
                <button class="delete-todo" onclick="deleteTodo(${index})">🗑️</button>
            `;
            todoListEl.appendChild(li);
        });
    }

    // Expose global functions for onclick events in innerHTML
    window.toggleTodo = function (index) {
        todos[index].completed = !todos[index].completed;
        saveTodos();
    };

    window.deleteTodo = function (index) {
        todos.splice(index, 1);
        saveTodos();
    };

    function addTodo() {
        const text = todoInput.value.trim();
        if (!text) return;
        todos.push({ text: text, completed: false });
        todoInput.value = '';
        saveTodos();
    }

    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Init Todo
    renderTodos();

    /* ----------------------------------------------------------------
       Global Tick
    ---------------------------------------------------------------- */
    setInterval(() => {
        updateYearProgress();
        updateHolidayCountdown();
        updateWorkCountdown();
    }, 120); // Fast update for smooth seconds/progress

    // Run once immediately
    updateYearProgress();
    updateHolidayCountdown();
    updateWorkCountdown();
});
