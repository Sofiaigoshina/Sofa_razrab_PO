document.addEventListener("DOMContentLoaded", function () {
    // --- DOM Элементы ---
    const taskList = document.getElementById("taskList");
    const completedTaskList = document.getElementById("completedTaskList");
    const taskInput = document.getElementById("taskInput");
    const addTaskBtn = document.getElementById("addTaskBtn");
    const mainCalendar = document.getElementById("mainCalendar");
    const taskFilterSelect = document.getElementById("taskFilterSelect");
    const progressBarInner = document.getElementById("progressBarInner");
    const progressPercentage = document.getElementById("progressPercentage");
    const themeSwitchCheckbox = document.getElementById("themeSwitchCheckbox");

    // Элементы для СРОКА ВЫПОЛНЕНИЯ (📅)
    const calendarIcon = document.getElementById("calendarIcon");
    const selectedDateDisplay = document.getElementById("selectedDateDisplay");
    const datePickerModal = document.getElementById("datePickerModal");
    const datePickerCalendar = document.getElementById("datePickerCalendar");
    const taskTimeInput = document.getElementById("taskTimeInput");
    const cancelDateBtn = document.getElementById("cancelDateBtn");
    const saveDateBtn = document.getElementById("saveDateBtn");

    // Элементы для НАПОМИНАНИЯ (🔔)
    const reminderIcon = document.getElementById("reminderIcon");
    const selectedReminderDisplay = document.getElementById("selectedReminderDisplay");
    const reminderDatePickerModal = document.getElementById("reminderDatePickerModal");
    const reminderDatePickerCalendar = document.getElementById("reminderDatePickerCalendar");
    const reminderTimeInput = document.getElementById("reminderTimeInput");
    const reminderFrequencySelect = document.getElementById("reminderFrequency"); // Получаем select частоты
    const cancelReminderDateBtn = document.getElementById("cancelReminderDateBtn");
    const saveReminderDateBtn = document.getElementById("saveReminderDateBtn");

    // Динамически создаваемое модальное окно деталей задачи
    const taskDetailsModal = document.createElement("div");
    taskDetailsModal.id = "taskDetailsModal";
    taskDetailsModal.className = "modal hidden";
    document.body.appendChild(taskDetailsModal);

    // --- Данные приложения (Состояния) ---
    let tasks = [];
    let completedTasks = [];
    let nextTaskId = 1;
    let currentCustomFilter = null; // Добавляем переменную для хранения кастомного фильтра
    let isSelectingDates = false;
    let selectionStartDate = null;
    let selectionEndDate = null; 

    // Состояние для выбора дат/времени/частоты
    let currentSelectedDate = null; let currentSelectedTime = null;
    let tempSelectedDate = null; let tempSelectedTime = null;
    let currentSelectedReminderDate = null; let currentSelectedReminderTime = null; let currentSelectedReminderFrequency = 'once';
    let tempSelectedReminderDate = null; let tempSelectedReminderTime = null; let tempSelectedReminderFrequency = 'once';

    // Состояние фильтра, редактирования, календарей
    let currentTaskFilter = 'all';
    let currentEditingTaskId = null;
    let isEditingCompletedTask = false;
    let mainCalendarDate = new Date();
    let datePickerCalendarDate = new Date();
    let reminderPickerCalendarDate = new Date();


    // В addEventListeners:
document.getElementById('resetSelectionBtn').addEventListener('click', resetSelection);

function resetSelection() {
    currentCustomFilter = null;
    currentTaskFilter = 'all';
    clearCalendarSelection();
    renderTasks();
} 
document.addEventListener('click', (e) => {
    if (!mainCalendar.contains(e.target)) {
        isSelectingDates = false;
    }
});
    // Для отслеживания показанных уведомлений
    let notifiedTaskIds = new Set();

    // --- Загрузка и Миграция Данных ---
    function loadData() {
        try {
            tasks = JSON.parse(localStorage.getItem("tasks") || '[]') || [];
        } catch (e) {
            console.error("Error parsing tasks from localStorage:", e);
            tasks = []; // Сброс к пустому массиву при ошибке
        }
        try {
            completedTasks = JSON.parse(localStorage.getItem("completedTasks") || '[]') || [];
        } catch (e) {
            console.error("Error parsing completedTasks from localStorage:", e);
            completedTasks = [];
        }
        nextTaskId = parseInt(localStorage.getItem("nextTaskId") || '1', 10);
        if (isNaN(nextTaskId) || nextTaskId < 1) {
            nextTaskId = 1; // Сброс, если некорректное значение
        }
        // Очистка notifiedTaskIds при загрузке (чтобы уведомления сработали снова после перезагрузки)
        notifiedTaskIds = new Set();

        migrateOldTasks(); // Запуск миграции после загрузки
    }

    function migrateOldTasks() {
        let needsSave = false;
        function getMigrationNextId() {
            const id = nextTaskId;
            nextTaskId++;
            return id;}
        console.log("Checking for task migration...");

        // Обновляем активные задачи
        tasks = tasks.map(task => {
            let taskChanged = false;
            if (task.id === undefined || task.id === null) { task.id = getMigrationNextId(); needsSave = true; taskChanged = true; console.log(`Migrated task ID for: "${task.text}" (New ID: ${task.id})`); }
            if (task.isStarred === undefined) { task.isStarred = false; taskChanged = true; }
            if (task.createdAt === undefined) { task.createdAt = new Date().toISOString(); taskChanged = true; }
            if (task.notes === undefined) { task.notes = ""; taskChanged = true; }
            if (task.dueDate === undefined) { task.dueDate = null; taskChanged = true; }
            if (task.dueTime === undefined) { task.dueTime = null; taskChanged = true; }
            if (task.reminderDate === undefined) { task.reminderDate = null; taskChanged = true; }
            if (task.reminderTime === undefined) { task.reminderTime = null; taskChanged = true; }
            if (task.reminderFrequency === undefined) { task.reminderFrequency = 'once'; taskChanged = true; } // <-- Миграция частоты
            if (taskChanged && !needsSave) needsSave = true;
            return task;
        });

        // Обновляем завершенные задачи
        completedTasks = completedTasks.map(task => {
            let taskChanged = false;
            if (task.id === undefined || task.id === null) { task.id = getMigrationNextId(); needsSave = true; taskChanged = true; console.log(`Migrated completed task ID for: "${task.text}" (New ID: ${task.id})`); }
            if (task.isStarred === undefined) { task.isStarred = false; taskChanged = true; }
            if (task.createdAt === undefined) { task.createdAt = new Date(Date.now() - 86400000).toISOString(); taskChanged = true; }
            if (task.notes === undefined) { task.notes = ""; taskChanged = true; }
            if (task.completedDate === undefined) { task.completedDate = new Date().toISOString(); taskChanged = true; }
            if (task.dueDate === undefined) { task.dueDate = null; taskChanged = true; }
            if (task.dueTime === undefined) { task.dueTime = null; taskChanged = true; }
            if (task.reminderDate === undefined) { task.reminderDate = null; taskChanged = true; }
            if (task.reminderTime === undefined) { task.reminderTime = null; taskChanged = true; }
            if (task.reminderFrequency === undefined) { task.reminderFrequency = 'once'; taskChanged = true; } // <-- Миграция частоты
            if (taskChanged && !needsSave) needsSave = true;
            return task;
        });

        if (needsSave) {
            console.log("Saving migrated tasks and updated nextTaskId to localStorage...");
            try {
                localStorage.setItem("tasks", JSON.stringify(tasks));
                localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
                localStorage.setItem("nextTaskId", nextTaskId.toString());
                console.log("Migration save successful.");
            } catch (error) {
                console.error("Error saving migrated data to localStorage:", error);
                alert("Произошла ошибка при обновлении сохраненных задач. Возможно, хранилище переполнено.");
            }
        } else {
            console.log("No task migration needed.");
        }
    }

    // --- Инициализация Приложения ---
    function initializeApp() {
        loadData(); // Загружаем данные и запускаем миграцию
        applyInitialTheme();
        requestNotificationPermission();
        initCalendars();
        initCalendarSelection();
        addEventListeners();
        renderAll(); // Первый рендеринг всего (включая календари)
        highlightCalendarFilterRange(); // Применяем подсветку календаря для начального фильтра
        checkDueTasks(); // Проверяем напоминания сразу
        setInterval(checkDueTasks, 60 * 1000); // Проверяем каждую минуту
    }

    function initCalendarSelection() {
        mainCalendar.addEventListener('mousedown', handleCalendarMouseDown);
        mainCalendar.addEventListener('mouseover', handleCalendarMouseOver);
        document.addEventListener('mouseup', handleCalendarMouseUp);
    }

    // --- Управление темой ---
    function applyInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        if(themeSwitchCheckbox) themeSwitchCheckbox.checked = isDark;
    }
    function handleThemeSwitch() {
        const isDark = themeSwitchCheckbox.checked;
        document.body.classList.toggle('dark-theme', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    // --- Уведомления ---
    function requestNotificationPermission() {
        if (!("Notification" in window)) {
            console.warn("Browser does not support desktop notification");
            return;
        }
        // Запрашиваем разрешение, только если оно еще не предоставлено и не отклонено
        if (Notification.permission !== "granted" && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                console.log("Notification permission:", permission);
            });
        }
    }

    function checkDueTasks() {
        if (Notification.permission !== "granted") {
            // console.log("Notification permission not granted, skipping check.");
            return;
        }
        const now = new Date();

        tasks.forEach(task => {
            // Проверяем только если есть дата, время напоминания и его ID еще нет в списке сработавших
            if (task.reminderDate && task.reminderTime && !notifiedTaskIds.has(task.id)) {
                const reminderDateTime = parseDateSafe(`${task.reminderDate}T${task.reminderTime}`);

                if (reminderDateTime && reminderDateTime <= now) {
                    // Разница в минутах с момента срабатывания
                    const diffMinutes = (now - reminderDateTime) / 60000;

                    // Показываем, если время настало в течение последнего часа
                    // ИЛИ если частота не 'once' (для будущей логики повторов)
                    if (diffMinutes >= 0 && diffMinutes < 60 ) { // && task.reminderFrequency === 'once'
                        console.log("Showing notification for task:", task.id, task.text);
                        showNotification(task);
                        // Для 'once' добавляем в набор, чтобы больше не показывать
                        // if (task.reminderFrequency === 'once') {
                            notifiedTaskIds.add(task.id);
                        // } else {
                            // TODO: Implement logic for recurring reminders
                            // Calculate next reminder date based on frequency and update task
                            // Maybe don't add to notifiedTaskIds or manage differently
                        // }
                    }
                    // Если напоминание очень старое (больше часа назад), просто помечаем как сработавшее, чтобы не проверять снова
                    else if (diffMinutes >= 60 && task.reminderFrequency === 'once') {
                        notifiedTaskIds.add(task.id);
                        console.log("Skipping old one-time notification:", task.id);
                    }
                }
            }
        });
        // console.log("Checked due tasks. Notified IDs:", notifiedTaskIds);
    }

    function showNotification(task) {
        const title = "Напоминание о задаче!";
        const options = {
            body: task.text,
            icon: "logo/sss.png", // Убедитесь, что путь правильный
            tag: `task-${task.id}` // Используем тэг, чтобы заменить старое уведомление для той же задачи
        };

        try {
            const notification = new Notification(title, options);
            // Закрыть уведомление при клике и сфокусироваться на окне
            notification.onclick = () => {
                window.focus();
                console.log("Notification clicked for task:", task.id);
                notification.close();
            };
        } catch (error) {
            console.error("Error showing notification:", error);
        }
    }
    // --- Инициализация и рендер календарей ---
    function initCalendars() {
        mainCalendarDate = new Date();
        datePickerCalendarDate = new Date();
        reminderPickerCalendarDate = new Date();
    }
    function renderAllCalendars() {
        renderCalendar(mainCalendar, mainCalendarDate.getFullYear(), mainCalendarDate.getMonth(), false, 'main');
        // Подсветка фильтра вызывается отдельно после рендера
    }

    // --- Добавление Обработчиков Событий ---
    function addEventListeners() {
        if (addTaskBtn) addTaskBtn.addEventListener("click", addTask);
        if (taskInput) {
            taskInput.addEventListener("keypress", handleInputKeypress);
            taskInput.addEventListener('input', handleInputChange);
        }
        if (calendarIcon) calendarIcon.addEventListener('click', openDatePickerModal);
        if (reminderIcon) reminderIcon.addEventListener('click', openReminderPickerModal);

        if (saveDateBtn) saveDateBtn.addEventListener('click', saveTaskDate);
        if (cancelDateBtn) cancelDateBtn.addEventListener('click', closeDatePickerModal);

        if (saveReminderDateBtn) saveReminderDateBtn.addEventListener('click', saveReminderDate);
        if (cancelReminderDateBtn) cancelReminderDateBtn.addEventListener('click', closeReminderPickerModal);

        if (taskFilterSelect) taskFilterSelect.addEventListener('change', handleFilterChange);
        if (themeSwitchCheckbox) themeSwitchCheckbox.addEventListener('change', handleThemeSwitch);

        if (taskList) taskList.addEventListener('click', handleTaskListClick);
        if (completedTaskList) completedTaskList.addEventListener('click', handleCompletedListClick);

        // Закрытие модалок по клику вне контента
        [datePickerModal, reminderDatePickerModal, taskDetailsModal].forEach(modal => {
            if (modal) modal.addEventListener('click', closeModalOnClickOutside);
        });

        // Навигация по календарям (используем делегирование на контейнеры)
        if (mainCalendar) mainCalendar.addEventListener('click', handleCalendarNav);
        if (datePickerCalendar) datePickerCalendar.addEventListener('click', handleCalendarNav);
        if (reminderDatePickerCalendar) reminderDatePickerCalendar.addEventListener('click', handleCalendarNav);

        // Клики по дням в модальных календарях
        if (datePickerCalendar) datePickerCalendar.addEventListener('click', handleModalDayClick);
        if (reminderDatePickerCalendar) reminderDatePickerCalendar.addEventListener('click', handleModalDayClick);
    }

    // --- Обработчики событий ---
    function handleInputKeypress(e) { if (e.key === "Enter") addTask(); }
    function handleInputChange() {
        const hasText = taskInput.value.trim().length > 0;
        // Показываем иконки если есть текст ИЛИ если идет редактирование задачи (т.к. детали уже загружены)
        const showIcons = hasText || !!currentEditingTaskId;
        if (calendarIcon) calendarIcon.classList.toggle('visible', showIcons);
        if (reminderIcon) reminderIcon.classList.toggle('visible', showIcons);
        updateSelectedDateDisplaysVisibility(showIcons);
        // Сбрасываем выбор даты/напоминания если поле очищено и не идет редактирование
        if (!hasText && !currentEditingTaskId) {
            resetCurrentDateSelection();
        }
        updateSelectedDateDisplaysContent(); // Обновляем текст бэджей
    }
    function handleFilterChange() {
        currentTaskFilter = taskFilterSelect.value;
        renderTasks(); // Перерисовываем только список задач
        highlightCalendarFilterRange(); // Обновляем выделение в главном календаре
    }
    function closeModalOnClickOutside(e) {
        // Закрываем, только если клик был непосредственно по фону модалки
        if (e.target === datePickerModal) closeDatePickerModal();
        if (e.target === reminderDatePickerModal) closeReminderPickerModal();
        if (e.target === taskDetailsModal) closeTaskDetailsModal();
    }
    function handleTaskListClick(e) {
        const target = e.target;
        const taskElement = target.closest('.task');
        if (!taskElement || !taskElement.dataset.id) return; // Клик не по задаче
        const taskId = parseInt(taskElement.dataset.id, 10);
        if (isNaN(taskId)) { console.error("Invalid Task ID:", taskElement.dataset.id); return; }

        if (target.classList.contains('checkbox')) { // Клик по чекбоксу
            completeTask(taskId);
        } else if (target.classList.contains('delete-btn')) { // Клик по корзине
            const task = tasks.find(t => t.id === taskId);
            if (task && confirm(`Удалить задачу "${task.text}"?`)) {
                deleteTask(taskId, false);
            }
        } else if (target.classList.contains('star-btn')) { // Клик по звезде
            toggleStar(taskId, false);
        } else if (!target.closest('.action-btn') && !target.closest('.task-date-container')) {
            // Клик по тексту задачи (не по кнопкам или датам) -> Открыть детали
            openTaskDetails(taskId, false);
        }
    }
    function handleCompletedListClick(e) {
        const target = e.target;
        const taskElement = target.closest('.task');
        if (!taskElement || !taskElement.dataset.id) return;
        const taskId = parseInt(taskElement.dataset.id, 10);
        if (isNaN(taskId)) { console.error("Invalid Completed Task ID:", taskElement.dataset.id); return; }

        if (target.classList.contains('checkbox')) { // Вернуть в активные
            uncompleteTask(taskId);
        } else if (target.classList.contains('delete-btn')) { // Удалить навсегда
            const task = completedTasks.find(t => t.id === taskId);
            if (task && confirm(`НАВСЕГДА удалить завершенную задачу "${task.text}"?`)) {
                deleteTask(taskId, true);
            }
        } else if (!target.closest('.action-btn') && !target.closest('.task-date-container')) {
             // Клик по тексту -> Открыть детали (в режиме просмотра)
             openTaskDetails(taskId, true);
        }
    }

    // --- Логика задач (CRUD) ---
    function getNextId() {
        const id = nextTaskId;
        nextTaskId++;
        localStorage.setItem("nextTaskId", nextTaskId.toString()); // Сохраняем сразу
        return id;
    }

    function addTask() {
        const taskText = taskInput.value.trim();
        if (!taskText) {
            alert("Введите текст задачи.");
            taskInput.focus();
            return;
        }
        const todayStr = new Date().toISOString().split('T')[0];
        const effectiveDueDate = currentSelectedDate ? currentSelectedDate : todayStr;
        const effectiveDueTime = currentSelectedDate ? currentSelectedTime : null;
        const newTask = {
            id: getNextId(),
            text: taskText,
            dueDate: effectiveDueDate,
            dueTime: effectiveDueTime,
            reminderDate: currentSelectedReminderDate,
            reminderTime: currentSelectedReminderTime,
            reminderFrequency: currentSelectedReminderFrequency || 'once',
            isStarred: false,
            createdAt: new Date().toISOString(),
            notes: ""
        };
        tasks.push(newTask); // Добавляем в массив активных
        taskInput.value = ""; // Очищаем поле ввода
        resetCurrentDateSelection(); // Сбрасываем выбранные даты/время/частоту в интерфейсе
        updateSelectedDateDisplaysVisibility(false); // Скрываем бэджи
        updateSelectedDateDisplaysContent();
        handleInputChange.call(taskInput); // Обновляем видимость иконок
        saveAndRender(); // Сохраняем состояние и перерисовываем все
    }

    function completeTask(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const [taskToComplete] = tasks.splice(taskIndex, 1); // Удаляем из активных
            taskToComplete.completedDate = new Date().toISOString(); // Добавляем дату завершения
            completedTasks.unshift(taskToComplete); // Добавляем в начало завершенных
            saveAndRender();
        } else {
            console.warn("Task not found for completion:", taskId);
        }
    }
    function uncompleteTask(taskId) {
        const taskIndex = completedTasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const [taskToUncomplete] = completedTasks.splice(taskIndex, 1); // Удаляем из завершенных
            delete taskToUncomplete.completedDate; // Удаляем дату завершения
            tasks.push(taskToUncomplete); // Добавляем в конец активных
            saveAndRender();
        } else {
            console.warn("Task not found for uncompletion:", taskId);
        }
    }

    function deleteTask(taskId, isCompleted) {
        let initialLength;
        if (isCompleted) {
            initialLength = completedTasks.length;
            completedTasks = completedTasks.filter(task => task.id !== taskId);
            if(completedTasks.length === initialLength) console.warn("Completed task not found for deletion:", taskId);
        } else {
            initialLength = tasks.length;
            tasks = tasks.filter(task => task.id !== taskId);
            if(tasks.length === initialLength) console.warn("Active task not found for deletion:", taskId);
        }
        // Удаляем из набора сработавших уведомлений, если задача удаляется
        notifiedTaskIds.delete(taskId);
        saveAndRender();
    }

    function toggleStar(taskId, isCompleted) {
        if (isCompleted) return; // Нельзя звездить завершенные
        const task = tasks.find(task => task.id === taskId);
        if (task) {
            task.isStarred = !task.isStarred;
            saveAndRender(); // Перерисовываем, чтобы обновить звезду и сортировку
        } else {
            console.warn("Task not found for starring:", taskId);
        }
    }

    function editTask(taskId, updatedData, isCompleted) {
        const list = isCompleted ? completedTasks : tasks;
        const taskIndex = list.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            const originalTask = list[taskIndex];
            // Обновляем задачу, сохраняя старые поля, если они не переданы в updatedData
            list[taskIndex] = { ...originalTask, ...updatedData };
            console.log("Task updated:", list[taskIndex]);
            // Если дата/время напоминания изменились, удаляем из notified, чтобы оно сработало снова
            if (updatedData.reminderDate !== undefined || updatedData.reminderTime !== undefined) {
                notifiedTaskIds.delete(taskId);
            }
            saveAndRender();
        } else {
            console.warn(`Task ID ${taskId} not found for editing in ${isCompleted ? 'completed' : 'active'} list.`);
        }
    }

    // --- Сохранение и Рендеринг ---
    function saveState() {
        try {
            localStorage.setItem("tasks", JSON.stringify(tasks));
            localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
            // nextTaskId сохраняется в getNextId
        } catch (error) {
            console.error("Error saving state to localStorage:", error);
            alert("Не удалось сохранить задачи. Возможно, хранилище переполнено.");
        }
    }

    function saveAndRender() {
        saveState();
        renderAll();
    }

    function renderAll() {
        console.log("Rendering all...");
        renderTasks(); // Рендер списков задач
        renderAllCalendars(); // Рендер главного календаря
        updateCalendarHighlights(); // Обновление точек под датами в гл. календаре
        highlightCalendarFilterRange(); // Обновление выделения диапазона фильтра
        updateProgressBar(); // Обновление прогресс-бара
    }

    // --- Рендеринг Списков Задач ---
    function renderTasks() {
        if (!taskList || !completedTaskList) return;

        taskList.innerHTML = '';
        completedTaskList.innerHTML = '';

        const filteredTasks = filterTasks(tasks, currentTaskFilter);

        // Рендер активных задач
        if (filteredTasks.length === 0) {
            const message = tasks.length > 0 && currentTaskFilter !== 'all'
                ? 'Нет задач, соответствующих фильтру.'
                : 'Активных задач нет.';
            taskList.innerHTML = `<p class="empty-list-msg">${message}</p>`;
        } else {
            filteredTasks
                // Сортировка: сначала избранные, потом по дате создания
                .sort((a, b) => (a.isStarred !== b.isStarred ? (a.isStarred ? -1 : 1) : (new Date(a.createdAt) - new Date(b.createdAt))))
                .forEach(task => taskList.appendChild(createTaskElement(task, false)));
        }

        // Рендер завершенных задач
        if (completedTasks.length === 0) {
            completedTaskList.innerHTML = '<p class="empty-list-msg">Завершенных задач нет.</p>';
        } else {
            completedTasks
                // Сортировка по дате завершения (сначала новые)
                .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))
                .forEach(task => completedTaskList.appendChild(createTaskElement(task, true)));
        }
    }

    function createTaskElement(task, isCompleted) {
        const taskDiv = document.createElement("div");
        taskDiv.className = "task";
        taskDiv.dataset.id = task.id; // Устанавливаем ID для легкого доступа

        if (task.isStarred && !isCompleted) {
            taskDiv.classList.add("starred"); // Добавляем класс для стиля рамки
        }
        const checkbox = document.createElement("div");
        checkbox.className = "checkbox";
        if (isCompleted) {
            checkbox.classList.add("checked");
        }
        taskDiv.appendChild(checkbox);

        // 2. Текст задачи
        const taskTextSpan = document.createElement("span");
        // Используем textContent для безопасности от XSS
        taskTextSpan.textContent = task.text;
        if (isCompleted) {
            taskTextSpan.classList.add("completed-text");
        }
        taskDiv.appendChild(taskTextSpan);

        // 3. Контейнер для дат и кнопок справа
        const controlsContainer = document.createElement("div");
        controlsContainer.className = 'task-date-container';

        // 3a. Обертка только для бэджей дат
        const datesWrapper = document.createElement('div');
        datesWrapper.className = 'task-dates-wrapper';

        // Бэдж даты выполнения
        if (task.dueDate) {
            const dueDateDiv = document.createElement('div');
            dueDateDiv.className = 'task-date-entry';
            // Форматируем дату и добавляем время, если оно есть
            dueDateDiv.innerHTML = `<span class="icon-date">📅</span> ${formatDate(task.dueDate)} ${task.dueTime || ''}`.trim();
            datesWrapper.appendChild(dueDateDiv);
        }
        // Бэдж напоминания
        if (task.reminderDate && task.reminderTime) {
            const reminderDateDiv = document.createElement('div');
            reminderDateDiv.className = 'task-date-entry reminder-date';
            reminderDateDiv.innerHTML = `<span class="icon-date">🔔</span> ${formatDate(task.reminderDate)} ${task.reminderTime}`;
            datesWrapper.appendChild(reminderDateDiv);
        }
        // Бэдж даты завершения (только для завершенных)
        if (isCompleted && task.completedDate) {
            const completedDateDiv = document.createElement('div');
            completedDateDiv.className = 'task-date-entry';
             // Форматируем с включением времени, если оно не 00:00
            completedDateDiv.innerHTML = `<span class="icon-date">✅</span> Завершено: ${formatDate(task.completedDate, true)}`;
            datesWrapper.appendChild(completedDateDiv);
        }

        controlsContainer.appendChild(datesWrapper); // Добавляем обертку с датами

        // 3b. Добавляем кнопки действий прямо в controlsContainer
        // Кнопка Звезды (только для активных)
        if (!isCompleted) {
            const starBtn = document.createElement("button");
            starBtn.className = "action-btn star-btn";
            starBtn.innerHTML = task.isStarred ? "★" : "☆"; // Закрашенная или пустая звезда
            starBtn.title = task.isStarred ? "Убрать из избранного" : "Добавить в избранное";
            if (task.isStarred) {
                starBtn.classList.add("starred");
            }
            controlsContainer.appendChild(starBtn);
        }

        // Кнопка Удаления
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "action-btn delete-btn";
        deleteBtn.innerHTML = "🗑️"; // Иконка корзины
        deleteBtn.title = "Удалить задачу";
        controlsContainer.appendChild(deleteBtn);

        // Добавляем весь контейнер контролов (с датами и кнопками) в задачу
        taskDiv.appendChild(controlsContainer);

        return taskDiv;
    }

    // --- Фильтрация Задач ---
    function filterTasks(tasksToFilter, filter) {
        if (!Array.isArray(tasksToFilter)) return [];

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        switch (filter) {
            case 'today':
                return tasksToFilter.filter(t => t.dueDate === today);
            case 'week':
                const startOfWeek = getStartOfWeek(now).toISOString().split('T')[0];
                const endOfWeek = getEndOfWeek(now).toISOString().split('T')[0];
                return tasksToFilter.filter(t => t.dueDate && t.dueDate >= startOfWeek && t.dueDate <= endOfWeek);
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                return tasksToFilter.filter(t => t.dueDate && t.dueDate >= startOfMonth && t.dueDate <= endOfMonth);
            case 'year':
                const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
                return tasksToFilter.filter(t => t.dueDate && t.dueDate >= startOfYear && t.dueDate <= endOfYear);
            case 'custom':
                if (!currentCustomFilter) return tasksToFilter;
                return tasksToFilter.filter(t => 
                    t.dueDate && 
                    t.dueDate >= currentCustomFilter.start && 
                    t.dueDate <= currentCustomFilter.end
                );
            case 'all':
            default:
                return [...tasksToFilter];
        }
    }




    // Обновите функцию handleCalendarMouseDown
function handleCalendarMouseDown(e) {
    const day = e.target.closest('.calendar-day');
    if (!day || !day.dataset.date) return;
    
    isSelectingDates = true;
    selectionStartDate = day.dataset.date;
    selectionEndDate = day.dataset.date;
    
    clearCalendarSelection();
    updateCalendarSelection();
}

    // Обновите функцию handleCalendarMouseOver
function handleCalendarMouseOver(e) {
    if (!isSelectingDates) return;
    
    const day = e.target.closest('.calendar-day');
    if (!day || !day.dataset.date) return;
    
    selectionEndDate = day.dataset.date;
    updateCalendarSelection();
}

    // Обновите функцию handleCalendarMouseUp
function handleCalendarMouseUp() {
    if (!isSelectingDates) return;
    isSelectingDates = false;
    
    const startDate = parseDateSafe(selectionStartDate);
    const endDate = parseDateSafe(selectionEndDate);
    
    if (!startDate || !endDate) return;
    
    const [start, end] = [startDate, endDate].sort((a, b) => a - b);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    currentCustomFilter = { start: startStr, end: endStr };
    currentTaskFilter = 'custom';
    taskFilterSelect.value = 'custom';
    
    renderTasks();
    highlightCalendarFilterRange();
}

    // Обновите функцию clearCalendarSelection
function clearCalendarSelection() {
    const days = document.querySelectorAll('#mainCalendar .calendar-day');
    days.forEach(day => {
        day.classList.remove('range-selected', 'range-start', 'range-end', 'range-middle', 'range-single');
    });
}


    // Обновите функцию updateCalendarSelection
function updateCalendarSelection() {
    const start = parseDateSafe(selectionStartDate);
    const end = parseDateSafe(selectionEndDate);
    if (!start || !end) return;

    const [minDate, maxDate] = [start, end].sort((a, b) => a - b);
    const minStr = minDate.toISOString().split('T')[0];
    const maxStr = maxDate.toISOString().split('T')[0];

    document.querySelectorAll('#mainCalendar .calendar-day').forEach(day => {
        const date = day.dataset.date;
        if (!date) return;

        if (date >= minStr && date <= maxStr) {
            day.classList.add('range-selected');
            if (date === minStr) day.classList.add('range-start');
            if (date === maxStr) day.classList.add('range-end');
        } else {
            day.classList.remove('range-selected', 'range-start', 'range-end');
        }
    });
}

    // Обновите функцию resetSelection
function resetSelection() {
    currentCustomFilter = null;
    currentTaskFilter = 'all';
    taskFilterSelect.value = 'all';
    selectionStartDate = null;
    selectionEndDate = null;
    clearCalendarSelection();
    renderTasks();
}
// --- Обновление подсветки календаря ---
function highlightCalendarFilterRange() {
    if (!mainCalendar) return;
    const days = mainCalendar.querySelectorAll('.calendar-day[data-date]');
    days.forEach(day => day.classList.remove('range-start', 'range-end', 'range-middle', 'range-single'));

    let startDateStr = null;
    let endDateStr = null;

    if (currentTaskFilter === 'custom' && currentCustomFilter) {
        startDateStr = currentCustomFilter.start;
        endDateStr = currentCustomFilter.end;
    } else {
        const now = new Date();
        switch (currentTaskFilter) {
            case 'today':
                startDateStr = endDateStr = now.toISOString().split('T')[0];
                break;
            case 'week':
                startDateStr = getStartOfWeek(now).toISOString().split('T')[0];
                endDateStr = getEndOfWeek(now).toISOString().split('T')[0];
                break;
                case 'month':
                    startDateStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                    endDateStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                    break;
                case 'year':
                    startDateStr = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                    endDateStr = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
                    break;
            }
        }

        if (startDateStr && endDateStr && startDateStr <= endDateStr) {
            days.forEach(day => {
                const date = day.dataset.date;
                if (date >= startDateStr && date <= endDateStr) {
                    if (date === startDateStr && date === endDateStr) {
                        day.classList.add('range-single');
                    } else if (date === startDateStr) {
                        day.classList.add('range-start');
                    } else if (date === endDateStr) {
                        day.classList.add('range-end');
                    } else {
                        day.classList.add('range-middle');
                    }
                }
            });
        }
    }





    // --- Вспомогательные функции для дат ---
    function parseDateSafe(dateString) {
        if (!dateString) return null;
        let date = new Date(dateString); // Пробуем стандартный парсинг
        // Проверяем, является ли результат валидной датой
        if (!isNaN(date.getTime())) {
            return date;
        }
        // Дополнительная проверка для формата YYYY-MM-DD (без времени)
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
            // Используем UTC для избежания проблем с часовыми поясами при парсинге только даты
            date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        console.warn("Could not parse date:", dateString);
        return null; // Возвращаем null, если парсинг не удался
    }

    // Получить понедельник текущей недели для date
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay(); // 0=Вс, 1=Пн, ..., 6=Сб
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Коррекция для недели с Пн
        return new Date(d.setDate(diff));
    }

    // Получить воскресенье текущей недели для date
    function getEndOfWeek(date) {
        const start = getStartOfWeek(date); // Получаем понедельник
        return new Date(start.setDate(start.getDate() + 6)); // Добавляем 6 дней
    }

    // Форматирует дату (и опционально время) для отображения
    function formatDate(dateInput, includeTime = false) {
        if (!dateInput) return '';
        // Преобразуем строку в объект Date, если нужно
        const date = (typeof dateInput === 'string') ? parseDateSafe(dateInput) : dateInput;
        if (!date || isNaN(date.getTime())) return 'Invalid Date';

        const optsDate = { year: 'numeric', month: 'short', day: 'numeric' }; // Формат: 10 апр 2025
        const optsTime = { hour: '2-digit', minute: '2-digit' }; // Формат: 05:00

        let formattedString = date.toLocaleDateString('ru-RU', optsDate);

        // Добавляем время, если флаг установлен и время не 00:00 (или если дата не парсилась из строки без времени)
        if (includeTime) {
             // Проверяем исходный инпут или объект Date на наличие времени
            let hasTimeComponent = false;
            if (typeof dateInput === 'string' && dateInput.includes('T')) {
                hasTimeComponent = true; // Если строка содержала время
            } else if (date instanceof Date && (date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0)) {
                 hasTimeComponent = true; // Если объект Date имеет время
            }

            if (hasTimeComponent) {
                formattedString += ` ${date.toLocaleTimeString('ru-RU', optsTime)}`;
            }
        }
        return formattedString;
    }

    // Форматирует дату и время для бэджей под полем ввода
    function formatDateTimeForDisplay(dateStr, timeStr) {
        if (!dateStr) return '';
        let display = formatDate(dateStr); // Форматируем дату
        if (timeStr) {
            display += ` ${timeStr}`; // Добавляем время, если оно есть
        }
        return display;
    }
    // --- Управление модальными окнами дат/напоминаний ---
    function openDatePickerModal() {
        // Не открывать, если нет текста и не идет редактирование
        if (!taskInput.value.trim() && !currentEditingTaskId) return;

        // Сохраняем текущие значения во временные
        tempSelectedDate = currentSelectedDate;
        tempSelectedTime = currentSelectedTime;
        taskTimeInput.value = currentSelectedTime || ''; // Устанавливаем время в поле

        // Устанавливаем дату для календаря модалки (текущую выбранную или сегодня)
        datePickerCalendarDate = tempSelectedDate ? parseDateSafe(tempSelectedDate) || new Date() : new Date();

        renderCalendar(datePickerCalendar, datePickerCalendarDate.getFullYear(), datePickerCalendarDate.getMonth(), true, 'date');
        highlightCalendarSelection(datePickerCalendar, tempSelectedDate); // Выделяем выбранный день
        datePickerModal.style.zIndex = '1050'; // Поверх других модалок
        datePickerModal.classList.remove('hidden');
    }
    function openReminderPickerModal() {
        if (!taskInput.value.trim() && !currentEditingTaskId) return;

        tempSelectedReminderDate = currentSelectedReminderDate;
        tempSelectedReminderTime = currentSelectedReminderTime;
        tempSelectedReminderFrequency = currentSelectedReminderFrequency || 'once'; // Загружаем частоту

        reminderTimeInput.value = tempSelectedReminderTime || '';
        if (reminderFrequencySelect) reminderFrequencySelect.value = tempSelectedReminderFrequency; // Устанавливаем частоту

        reminderDatePickerCalendarDate = tempSelectedReminderDate ? parseDateSafe(tempSelectedReminderDate) || new Date() : new Date();
        renderCalendar(reminderDatePickerCalendar, reminderDatePickerCalendarDate.getFullYear(), reminderDatePickerCalendarDate.getMonth(), true, 'reminder');
        highlightCalendarSelection(reminderDatePickerCalendar, tempSelectedReminderDate);
        reminderDatePickerModal.style.zIndex = '1050';
        reminderDatePickerModal.classList.remove('hidden');
    }

    function closeDatePickerModal() {
        datePickerModal.style.zIndex = ''; // Сбрасываем z-index
        datePickerModal.classList.add('hidden');
        resetTempDates(); // Сбрасываем временные значения при отмене
    }

    function closeReminderPickerModal() {
        reminderDatePickerModal.style.zIndex = '';
        reminderDatePickerModal.classList.add('hidden');
        resetTempDates();
    }
    function closeTaskDetailsModal() {
        taskDetailsModal.classList.add('hidden');
        taskDetailsModal.innerHTML = ''; // Очищаем содержимое модалки деталей
        // Сбрасываем состояние редактирования и текущие даты/время
        currentEditingTaskId = null;
        isEditingCompletedTask = false;
        resetCurrentDateSelection();
        handleInputChange.call(taskInput); // Обновляем иконки/бэджи у поля ввода
    }
    // Сохранить Срок Выполнения
    function saveTaskDate() {
        currentSelectedDate = tempSelectedDate; // Сохраняем выбранную дату
        currentSelectedTime = taskTimeInput.value || null; // Сохраняем время (или null)

        // Если идет редактирование через модалку деталей, обновить задачу
        if (currentEditingTaskId) {
            editTask(currentEditingTaskId, {
                dueDate: currentSelectedDate,
                dueTime: currentSelectedTime
            }, isEditingCompletedTask);
            // Обновляем поля в самой модалке деталей
            const ddi = taskDetailsModal.querySelector('#editDueDate');
            const dti = taskDetailsModal.querySelector('#editDueTime');
            if (ddi) ddi.value = currentSelectedDate || '';
            if (dti) dti.value = currentSelectedTime || '';
        }
        closeDatePickerModal();
        updateSelectedDateDisplaysContent(); // Обновляем бэджи под полем ввода
        updateSelectedDateDisplaysVisibility(taskInput.value.trim().length > 0 || !!currentEditingTaskId);
    }

    // Сохранить Напоминание
    function saveReminderDate() {
        // Требуем выбрать дату и время
        if (!tempSelectedReminderDate || !reminderTimeInput.value) {
            alert("Выберите дату и ВРЕМЯ для напоминания.");
            return;
        }
        // Получаем частоту из select
        const selectedFrequency = reminderFrequencySelect ? reminderFrequencySelect.value : 'once';

        // Сохраняем в основные переменные
        currentSelectedReminderDate = tempSelectedReminderDate;
        currentSelectedReminderTime = reminderTimeInput.value;
        currentSelectedReminderFrequency = selectedFrequency;

        // Если редактируем через модалку деталей
        if (currentEditingTaskId) {
            editTask(currentEditingTaskId, {
                reminderDate: currentSelectedReminderDate,
                reminderTime: currentSelectedReminderTime,
                reminderFrequency: currentSelectedReminderFrequency // Сохраняем и частоту
            }, isEditingCompletedTask);
            // Обновляем поля в модалке деталей
            const rdi = taskDetailsModal.querySelector('#editReminderDate');
            const rti = taskDetailsModal.querySelector('#editReminderTime');
            const rfi = taskDetailsModal.querySelector('#editReminderFrequency');
            if (rdi) rdi.value = currentSelectedReminderDate || '';
            if (rti) {
               rti.value = currentSelectedReminderTime || '';
               rti.disabled = !currentSelectedReminderDate; // Время активно только с датой
            }
            if (rfi) rfi.value = currentSelectedReminderFrequency;
        }
        closeReminderPickerModal();
        updateSelectedDateDisplaysContent();
        updateSelectedDateDisplaysVisibility(taskInput.value.trim().length > 0 || !!currentEditingTaskId);
    }

    // Сброс текущего выбора даты/времени/частоты под полем ввода
    function resetCurrentDateSelection() {
        currentSelectedDate = null; currentSelectedTime = null;
        currentSelectedReminderDate = null; currentSelectedReminderTime = null;
        currentSelectedReminderFrequency = 'once';
        resetTempDates(); // Сбрасываем и временные
        // Очищаем поля в модалках (на всякий случай)
        if(taskTimeInput) taskTimeInput.value = '';
        if(reminderTimeInput) reminderTimeInput.value = '';
        if(reminderFrequencySelect) reminderFrequencySelect.value = 'once';
        updateSelectedDateDisplaysContent(); // Обновляем текст бэджей
    }

    // Сброс временного выбора (при закрытии модалок без сохранения)
    function resetTempDates() {
        tempSelectedDate = null; tempSelectedTime = null;
        tempSelectedReminderDate = null; tempSelectedReminderTime = null;
        tempSelectedReminderFrequency = 'once';
    }

    // Обновление текста бэджей под полем ввода
    function updateSelectedDateDisplaysContent() {
        if(selectedDateDisplay) selectedDateDisplay.textContent = formatDateTimeForDisplay(currentSelectedDate, currentSelectedTime);
        if(selectedReminderDisplay) selectedReminderDisplay.textContent = formatDateTimeForDisplay(currentSelectedReminderDate, currentSelectedReminderTime);
    }

    // Обновление видимости бэджей под полем ввода
    function updateSelectedDateDisplaysVisibility(show) {
        if(selectedDateDisplay) selectedDateDisplay.classList.toggle('visible', show && !!currentSelectedDate);
        if(selectedReminderDisplay) selectedReminderDisplay.classList.toggle('visible', show && !!currentSelectedReminderDate);
    }

    // --- Логика Календаря ---
    function renderCalendar(container, year, month, isModal, type) {
        if (!container) { console.error("Calendar container not found:", container); return; }
        container.innerHTML = ''; // Очищаем перед рендером
        const date = new Date(year, month);
        const monthName = date.toLocaleString('ru-RU', { month: 'long' });
        const currentYear = date.getFullYear();

        // Шапка календаря (Название месяца, кнопки навигации)
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
            <button class="calendar-nav-btn prev-month" data-calendar-type="${type}" title="Предыдущий месяц">&lt;</button>
            <span class="calendar-title">${monthName} ${currentYear}</span>
            <button class="calendar-nav-btn next-month" data-calendar-type="${type}" title="Следующий месяц">&gt;</button>
        `;
        container.appendChild(header);

        // Таблица календаря
        const table = document.createElement('table');
        table.className = 'calendar';
        const thead = table.createTHead();
        const headRow = thead.insertRow();
        ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headRow.appendChild(th);
        });

        const tbody = table.createTBody();
        const firstDayOfMonth = new Date(year, month, 1);
        let startingDayOfWeek = firstDayOfMonth.getDay(); // 0=Вс, 1=Пн...
        startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Делаем Пн=0, Вс=6
        const daysInMonth = new Date(year, month + 1, 0).getDate(); // Кол-во дней в месяце
        const todayStr = new Date().toISOString().split('T')[0]; // Сегодняшняя дата YYYY-MM-DD

        let currentDay = 1; // Счетчик дней месяца
        // Цикл по строкам (макс 6 недель)
        for (let i = 0; i < 6; i++) {
            const row = tbody.insertRow();
            // Цикл по дням недели (0=Пн .. 6=Вс)
            for (let j = 0; j < 7; j++) {
                const cell = row.insertCell();
                // Если это пустая ячейка до начала месяца или после конца
                if ((i === 0 && j < startingDayOfWeek) || currentDay > daysInMonth) {
                    cell.classList.add('empty');
                } else {
                    // Создаем элемент дня
                    const daySpan = document.createElement('span');
                    daySpan.className = 'calendar-day';
                    daySpan.textContent = currentDay;
                    const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
                    daySpan.dataset.date = currentDateStr; // Сохраняем дату в атрибут

                    // Добавляем классы для стилизации
                    if (currentDateStr === todayStr) daySpan.classList.add('today');
                    if (isModal) { // Если это календарь в модалке
                        if (type === 'date' && currentDateStr === tempSelectedDate) daySpan.classList.add('selected');
                        if (type === 'reminder' && currentDateStr === tempSelectedReminderDate) daySpan.classList.add('selected');
                    }
                    // Точка под датой в ГЛАВНОМ календаре, если есть задачи
                    if (!isModal && hasActiveTasksOnDate(currentDateStr)) {
                        daySpan.classList.add('has-tasks');
                    }

                    cell.appendChild(daySpan);
                    currentDay++;
                }
            }
            // Если дни месяца закончились, прекращаем добавлять строки
            if (currentDay > daysInMonth) break;
        }
        container.appendChild(table);
    }

    // Проверяет, есть ли активные задачи на указанную дату
    function hasActiveTasksOnDate(dateStr) {
        return tasks.some(task => task.dueDate === dateStr);
    }

    // Обновляет точки 'has-tasks' в главном календаре
    function updateCalendarHighlights() {
        if (!mainCalendar) return;
        const days = mainCalendar.querySelectorAll('.calendar-day');
        days.forEach(day => {
            const dateStr = day.dataset.date;
            if(dateStr) { // Проверяем, что у элемента есть дата
                day.classList.toggle('has-tasks', hasActiveTasksOnDate(dateStr));
            }
        });
    }

    // Выделяет один день в указанном календаре
    function highlightCalendarSelection(container, dateStr) {
        if (!container) return;
        const days = container.querySelectorAll('.calendar-day');
        days.forEach(day => {
            day.classList.remove('selected'); // Снимаем выделение со всех
            if (day.dataset.date === dateStr) {
                day.classList.add('selected'); // Выделяем нужный
            }
        });
    }

    // Обработчик навигации по календарям (стрелки < >)
    function handleCalendarNav(e) {
        const navButton = e.target.closest('.calendar-nav-btn');
        if (!navButton) return; // Клик не по кнопке навигации

        const type = navButton.dataset.calendarType; // Тип календаря (main, date, reminder)
        if (!type) return;

        let calendarDate, renderTarget, isModal = true;

        // Определяем, какой календарь и дату обновлять
        switch(type) {
            case 'main':
                calendarDate = mainCalendarDate;
                renderTarget = mainCalendar;
                isModal = false; // Это не модальный календарь
                break;
            case 'date':
                calendarDate = datePickerCalendarDate;
                renderTarget = datePickerCalendar;
                break;
            case 'reminder':
                calendarDate = reminderPickerCalendarDate;
                renderTarget = reminderDatePickerCalendar;
                break;
            default: return; // Неизвестный тип
        }

        // Меняем месяц
        if (navButton.classList.contains('prev-month')) {
            calendarDate.setMonth(calendarDate.getMonth() - 1);
        } else if (navButton.classList.contains('next-month')) {
            calendarDate.setMonth(calendarDate.getMonth() + 1);
        } else {
            return; // Клик не по стрелке
        }

        // Перерисовываем нужный календарь
        renderCalendar(renderTarget, calendarDate.getFullYear(), calendarDate.getMonth(), isModal, type);

        // Обновляем подсветку после рендеринга
        if (isModal) {
            // В модалках выделяем временную дату
            if (type === 'date') highlightCalendarSelection(renderTarget, tempSelectedDate);
            if (type === 'reminder') highlightCalendarSelection(renderTarget, tempSelectedReminderDate);
        } else { // В главном календаре
            updateCalendarHighlights(); // Обновляем точки задач
            highlightCalendarFilterRange(); // Обновляем выделение фильтра
        }
    }

    // Обработчик клика по дню в МОДАЛЬНЫХ календарях
    function handleModalDayClick(e) {
        const dayElement = e.target.closest('.calendar-day');
        // Игнорируем клики не по дням или по пустым ячейкам
        if (!dayElement || !dayElement.dataset.date) return;

        const selectedDateStr = dayElement.dataset.date;
        const calendarContainer = e.currentTarget; // Контейнер календаря (datePickerCalendar или reminderDatePickerCalendar)

        // Обновляем временную переменную в зависимости от того, в каком календаре кликнули
        if (calendarContainer.id === 'datePickerCalendar') {
            tempSelectedDate = selectedDateStr;
            highlightCalendarSelection(calendarContainer, tempSelectedDate); // Выделяем кликнутый день
        } else if (calendarContainer.id === 'reminderDatePickerCalendar') {
            tempSelectedReminderDate = selectedDateStr;
            highlightCalendarSelection(calendarContainer, tempSelectedReminderDate);
        }
    }

function highlightCalendarFilterRange() {
    if (!mainCalendar) return;
    const days = mainCalendar.querySelectorAll('.calendar-day[data-date]');

    // 1. Сначала убираем ВСЕ классы диапазона со всех дней
    const rangeClasses = ['range-start', 'range-end', 'range-middle', 'range-single'];
    days.forEach(day => day.classList.remove(...rangeClasses));

    // 2. Определяем диапазон дат для выделения
    let startDateStr = null;
    let endDateStr = null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // Сегодняшняя дата 'YYYY-MM-DD'

    switch (currentTaskFilter) {
        case 'today':
            // Фильтр 'На сегодня': выделяем только сегодняшний день
            startDateStr = endDateStr = todayStr;
            break;
    
        case 'month':
            // Фильтр 'На этот месяц': НАЧИНАЕМ С СЕГОДНЯ
            startDateStr = todayStr; // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
            // Заканчиваем последним днем текущего месяца
            endDateStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            break;
        case 'week':
                // startDateStr = getStartOfWeek(now).toISOString().split('T')[0]; // Старая строка
                startDateStr = todayStr; // Новая строка: НАЧИНАЕМ С СЕГОДНЯ
                endDateStr = getEndOfWeek(now).toISOString().split('T')[0]; // Конец недели остается прежним
                break;
        case 'year':
            // Фильтр 'На этот год': НАЧИНАЕМ С СЕГОДНЯ
            startDateStr = todayStr; // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
            // Заканчиваем последним днем текущего года
            endDateStr = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            break;
         case 'all':
         default:
            // Для 'all' ничего не выделяем
            return;
    }

    // 3. Применяем классы к элементам дней (.calendar-day), попадающим в диапазон
    // Добавим проверку, что начальная дата не позже конечной (на всякий случай)
    if (startDateStr && endDateStr && startDateStr <= endDateStr) {
         days.forEach(day => {
             const dayDateStr = day.dataset.date;
             // Проверяем, что дата дня существует и находится в диапазоне
             if (dayDateStr && dayDateStr >= startDateStr && dayDateStr <= endDateStr) {
                 // Применяем классы в зависимости от положения в диапазоне
                 if (dayDateStr === startDateStr && dayDateStr === endDateStr) {
                     // Единственный день в диапазоне
                     day.classList.add('range-single');
                 } else if (dayDateStr === startDateStr) {
                     // Начало диапазона
                     day.classList.add('range-start');
                 } else if (dayDateStr === endDateStr) {
                     // Конец диапазона
                     day.classList.add('range-end');
                 } else {
                     // Середина диапазона
                     day.classList.add('range-middle');
                 }
             }
         });
     }
}
    // --- Модальное Окно Деталей Задачи ---
    function openTaskDetails(taskId, isCompleted) {
        const list = isCompleted ? completedTasks : tasks;
        const task = list.find(t => t.id === taskId);
        if (!task) {
            console.error("Task not found for details:", taskId, "in", isCompleted ? "completed" : "active");
            return;
        }
        console.log("Opening details for:", task);
        currentEditingTaskId = taskId;
        isEditingCompletedTask = isCompleted;

        // Устанавливаем текущие выбранные даты/время/частоту из задачи
        currentSelectedDate = task.dueDate || null;
        currentSelectedTime = task.dueTime || null;
        currentSelectedReminderDate = task.reminderDate || null;
        currentSelectedReminderTime = task.reminderTime || null;
        currentSelectedReminderFrequency = task.reminderFrequency || 'once';

        // Генерируем HTML для модалки
        taskDetailsModal.innerHTML = `
        <div class="modal-content">
            <h2>Детали Задачи ${isCompleted ? '(Завершено)' : ''}</h2>

            <div class="task-detail-row">
                <label for="editTaskText">Текст задачи:</label>
                <textarea id="editTaskText" class="task-detail-textarea" ${isCompleted ? 'readonly' : ''}>${escapeHtml(task.text)}</textarea>
            </div>

            <div class="task-detail-row">
                <label>Срок выполнения:</label>
                <input type="date" id="editDueDate" class="task-detail-input" value="${task.dueDate || ''}" ${isCompleted ? 'disabled' : ''}>
                <input type="time" id="editDueTime" class="task-detail-input" value="${task.dueTime || ''}" ${isCompleted ? 'disabled' : ''}>
                ${!isCompleted ? '<button id="editDueDateBtn" class="icon-btn" title="Выбрать дату/время">📅</button>' : ''}
            </div>

            <div class="task-detail-row">
                <label>Напоминание:</label>
                <input type="date" id="editReminderDate" class="task-detail-input" value="${task.reminderDate || ''}" ${isCompleted ? 'disabled' : ''}>
                <input type="time" id="editReminderTime" class="task-detail-input" value="${task.reminderTime || ''}" ${isCompleted || !task.reminderDate ? 'disabled' : ''}>
                <label for="editReminderFrequency" style="display: block; margin-top: 8px; font-size: 12px; color: var(--secondary-text-color);">Частота:</label>
                <select id="editReminderFrequency" class="task-detail-input" style="width:auto; display: inline-block; margin-right: 8px;" ${isCompleted ? 'disabled' : ''}>
                    <option value="once">Один раз</option>
                    <option value="daily">Ежедневно</option>
                    <option value="weekly">Еженедельно</option>
                    <option value="monthly">Ежемесячно</option>
                    <option value="yearly">Ежегодно</option>
                </select>
                 ${!isCompleted ? '<button id="editReminderDateBtn" class="icon-btn" title="Выбрать дату/время напоминания" style="top: auto; bottom: 5px;">🔔</button>' : ''}
            </div>

            <div class="task-detail-row">
                <label for="editTaskNotes">Заметки:</label>
                <textarea id="editTaskNotes" class="task-detail-textarea" placeholder="Добавьте заметки..." ${isCompleted ? 'readonly' : ''}>${escapeHtml(task.notes || '')}</textarea>
            </div>

            <div class="modal-buttons">
                <button id="cancelEditTaskBtn">Закрыть</button>
                ${!isCompleted ? '<button id="saveEditTaskBtn">Сохранить</button>' : ''}
            </div>
        </div>`;

        // Устанавливаем выбранное значение частоты в select
        const editFreqSelect = taskDetailsModal.querySelector('#editReminderFrequency');
        if (editFreqSelect) editFreqSelect.value = currentSelectedReminderFrequency;

        // Добавляем обработчики событий к кнопкам и полям ВНУТРИ модалки
        taskDetailsModal.querySelector('#cancelEditTaskBtn').addEventListener('click', closeTaskDetailsModal);

        if (!isCompleted) {
            taskDetailsModal.querySelector('#saveEditTaskBtn').addEventListener('click', saveEditedTask);
            // Кнопки открытия модалок выбора даты/напоминания
            taskDetailsModal.querySelector('#editDueDateBtn').addEventListener('click', (e) => {
                e.stopPropagation(); // Предотвращаем закрытие модалки деталей
                openDatePickerModal();
            });
            taskDetailsModal.querySelector('#editReminderDateBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                openReminderPickerModal();
            });

            // Обработчики изменения полей даты/времени/частоты прямо в модалке деталей
            const rdi = taskDetailsModal.querySelector('#editReminderDate');
            const rti = taskDetailsModal.querySelector('#editReminderTime');
            const rfi = taskDetailsModal.querySelector('#editReminderFrequency');

            if(rdi) {
                rdi.addEventListener('change', () => {
                    currentSelectedReminderDate = rdi.value || null;
                    tempSelectedReminderDate = currentSelectedReminderDate; // Синхронизируем temp
                    // Активируем/деактивируем поле времени и частоты
                    if(rti) rti.disabled = !currentSelectedReminderDate;
                    if(rfi) rfi.disabled = !currentSelectedReminderDate;
                    if (!currentSelectedReminderDate) { // Если дату убрали, сбрасываем время и частоту
                        if(rti) rti.value = '';
                        if(rfi) rfi.value = 'once';
                        currentSelectedReminderTime = null;
                        currentSelectedReminderFrequency = 'once';
                        tempSelectedReminderTime = null;
                        tempSelectedReminderFrequency = 'once';
                    }
                });
            }
             if(rti) {
                 rti.addEventListener('change', () => {
                     currentSelectedReminderTime = rti.value || null;
                     tempSelectedReminderTime = currentSelectedReminderTime; // Синхронизируем temp
                 });
             }
             if(rfi) {
                 rfi.addEventListener('change', () => {
                     currentSelectedReminderFrequency = rfi.value || 'once';
                     tempSelectedReminderFrequency = currentSelectedReminderFrequency; // Синхронизируем temp
                 });
             }

             const ddi = taskDetailsModal.querySelector('#editDueDate');
             const dti = taskDetailsModal.querySelector('#editDueTime');
             if(ddi) {
                 ddi.addEventListener('change', () => {
                     currentSelectedDate = ddi.value || null;
                     tempSelectedDate = currentSelectedDate; // Синхронизируем temp
                 });
             }
             if(dti) {
                 dti.addEventListener('change', () => {
                     currentSelectedTime = dti.value || null;
                     tempSelectedTime = currentSelectedTime; // Синхронизируем temp
                 });
             }
        }

        // Показываем модалку
        taskDetailsModal.classList.remove('hidden');
        // Обновляем состояние иконок/бэджей под основным полем ввода
        handleInputChange.call(taskInput);
    }

    function saveEditedTask() {
        if (!currentEditingTaskId || isEditingCompletedTask) return;

        // Собираем обновленные данные из полей модалки
        const updatedData = {
            text: taskDetailsModal.querySelector('#editTaskText').value.trim(),
            dueDate: taskDetailsModal.querySelector('#editDueDate').value || null,
            dueTime: taskDetailsModal.querySelector('#editDueTime').value || null,
            reminderDate: taskDetailsModal.querySelector('#editReminderDate').value || null,
            reminderTime: taskDetailsModal.querySelector('#editReminderTime').value || null,
            reminderFrequency: taskDetailsModal.querySelector('#editReminderFrequency').value || 'once',
            notes: taskDetailsModal.querySelector('#editTaskNotes').value.trim()
        };
        // Обновляем и основные переменные состояния (на случай если меняли напрямую в полях)
        currentSelectedDate = updatedData.dueDate;
        currentSelectedTime = updatedData.dueTime;
        currentSelectedReminderDate = updatedData.reminderDate;
        currentSelectedReminderTime = updatedData.reminderTime;
        currentSelectedReminderFrequency = updatedData.reminderFrequency;

        // Валидация
        if (!updatedData.text) {
            alert('Текст задачи не может быть пустым.');
            taskDetailsModal.querySelector('#editTaskText').focus();
            return;
        }
        // Если есть время напоминания, должна быть и дата
        if (updatedData.reminderTime && !updatedData.reminderDate) {
            alert('Выберите дату для напоминания или удалите время.');
            taskDetailsModal.querySelector('#editReminderDate').focus();
            return;
        }
        // Если нет даты напоминания, сбрасываем время и частоту
        if (!updatedData.reminderDate) {
            updatedData.reminderTime = null;
            updatedData.reminderFrequency = 'once';
             // Обновим и переменные состояния на всякий случай
             currentSelectedReminderTime = null;
             currentSelectedReminderFrequency = 'once';
        }

        // Вызываем функцию редактирования
        editTask(currentEditingTaskId, updatedData, false);
        closeTaskDetailsModal(); // Закрываем модалку
    }

    // Функция для экранирования HTML (простая защита от XSS)
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe; // Возвращаем как есть, если не строка
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    // --- Прогресс Бар ---
    function updateProgressBar() {
        if (!progressBarInner || !progressPercentage) return;

        const total = tasks.length + completedTasks.length;
        const completed = completedTasks.length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        progressBarInner.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;
    }
    initializeApp();



// В функцию addEventListeners добавим:
mainCalendar.addEventListener('mousedown', handleCalendarMouseDown);
mainCalendar.addEventListener('mouseover', handleCalendarMouseOver);
document.addEventListener('mouseup', handleCalendarMouseUp);

// Новые обработчики событий:
function handleCalendarMouseDown(e) {
    const day = e.target.closest('.calendar-day');
    if (!day) return;
    
    isSelectingDates = true;
    selectionStartDate = day.dataset.date;
    selectionEndDate = day.dataset.date;
    
    clearCalendarSelection();
    updateCalendarSelection();
}

function handleCalendarMouseOver(e) {
    if (!isSelectingDates) return;
    
    const day = e.target.closest('.calendar-day');
    if (!day || !day.dataset.date) return;
    
    selectionEndDate = day.dataset.date;
    updateCalendarSelection();
}

function handleCalendarMouseUp() {
    if (!isSelectingDates) return;
    
    isSelectingDates = false;
    filterTasksBySelectedDates();
}

function clearCalendarSelection() {
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selecting', 'range-selected');
    });
}

function updateCalendarSelection() {
    const start = parseDateSafe(selectionStartDate);
    const end = parseDateSafe(selectionEndDate);
    
    if (!start || !end) return;
    
    const [minDate, maxDate] = [start, end].sort((a, b) => a - b);
    const minDateStr = minDate.toISOString().split('T')[0];
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    document.querySelectorAll('.calendar-day').forEach(day => {
        const date = day.dataset.date;
        if (!date) return;
        
        const isInRange = date >= minDateStr && date <= maxDateStr;
        day.classList.toggle('selecting', isInRange);
    });
}

function filterTasksBySelectedDates() {
    const start = parseDateSafe(selectionStartDate);
    const end = parseDateSafe(selectionEndDate);
    if (!start || !end) return;
    
    const [minDate, maxDate] = [start, end].sort((a, b) => a - b);
    const minDateStr = minDate.toISOString().split('T')[0];
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    // Сохраняем выбранный диапазон
    currentCustomFilter = { start: minDateStr, end: maxDateStr };
    
    // Применяем фильтр
    currentTaskFilter = 'custom';
    renderTasks();
    
    // Подсветка в календаре
    document.querySelectorAll('.calendar-day').forEach(day => {
        const date = day.dataset.date;
        day.classList.toggle('range-selected', 
            date >= minDateStr && date <= maxDateStr
        );
    });
}

}); // Конец DOMContentLoaded