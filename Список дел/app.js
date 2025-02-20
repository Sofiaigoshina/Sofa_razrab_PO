document.addEventListener("DOMContentLoaded", function () {
    const taskList = document.getElementById("taskList");
    const completedTaskList = document.getElementById("completedTaskList");
    const taskInput = document.getElementById("taskInput");
    const addTaskBtn = document.getElementById("addTaskBtn");

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let completedTasks = JSON.parse(localStorage.getItem("completedTasks")) || [];
    let myDayTasks = JSON.parse(localStorage.getItem("myDayTasks")) || [];

    // Функция рендеринга задач

// Функция рендеринга задач
function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const taskElement = document.createElement("li");
        taskElement.className = "task";
        taskElement.innerHTML = `
            <button class="circle-btn ${task.isCompleted ? 'completed' : ''}" onclick="completeTask(${index})">⭕</button>
            <span class="${task.isCompleted ? 'completed-text' : ''}">${task.text}</span>
            <div>
                <button class="star-btn ${task.isStarred ? 'starred' : ''}" onclick="toggleStar(${index})">★</button>
                <button onclick="editTask(${index})">✎</button>
                <button onclick="deleteTask(${index})">❌</button>
            </div>
        `;
        taskList.appendChild(taskElement);
    });

    completedTaskList.innerHTML = '';
    completedTasks.forEach((task, index) => {
        const taskElement = document.createElement("li");
        taskElement.className = "task";
        taskElement.innerHTML = `
            <span class="completed-text">${task.text}</span>
            <div>
                <button onclick="restoreTask(${index})">↩️</button>
                <button onclick="deleteCompletedTask(${index})">❌</button>
            </div>
        `;
        completedTaskList.appendChild(taskElement);
    });

    // Отображение задач в "Мой день"
    const myDayList = document.getElementById("myDayList");
    myDayList.innerHTML = '';
    myDayTasks.forEach((task, index) => {
        const taskElement = document.createElement("li");
        taskElement.className = "task";
        taskElement.innerHTML = `
            <span>${task.text}</span>
            <div>
                <button onclick="deleteFromMyDay(${index})">❌</button>
            </div>
        `;
        myDayList.appendChild(taskElement);
    });
}




    // Добавление задачи
    addTaskBtn.addEventListener("click", () => {
        const taskText = taskInput.value.trim();
        if (taskText && !tasks.some(task => task.text === taskText)) { // Проверка на уникальность
            tasks.push({ text: taskText, isStarred: false, completed: false });
            localStorage.setItem("tasks", JSON.stringify(tasks));
            taskInput.value = "";
            renderTasks();
        }
    });

    // Завершение задачи (перемещение в завершенные)
    window.completeTask = (index) => {
        const task = tasks.splice(index, 1)[0]; // Убираем задачу из активных
        task.isCompleted = true; // Добавляем флаг, чтобы задача была завершена
    
        completedTasks.push(task); // Добавляем задачу в завершенные
        localStorage.setItem("tasks", JSON.stringify(tasks));
        localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
        renderTasks(); // Обновляем отображение всех задач
    };
    

    // Восстановление задачи из завершенных
window.restoreTask = (index) => {
    const task = completedTasks.splice(index, 1)[0]; // Забираем задачу из завершенных
    task.isCompleted = false; // Сбрасываем флаг завершенности

    tasks.push(task); // Добавляем задачу обратно в активный список
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
    renderTasks(); // Обновляем отображение всех задач
};


    // Удаление задачи из основного списка
    window.deleteTask = (index) => {
        tasks.splice(index, 1);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
    };

    // Удаление задачи из завершенных
window.deleteCompletedTask = (index) => {
    completedTasks.splice(index, 1); // Убираем задачу из завершенных
    localStorage.setItem("completedTasks", JSON.stringify(completedTasks)); // Обновляем localStorage
    renderTasks(); // Перерисовываем отображение
};


    // Переключение звезды (добавление/удаление из "Мой день")
    window.toggleStar = (index) => {
        const taskToMove = tasks[index];
        
        tasks[index].isStarred = !tasks[index].isStarred;
        localStorage.setItem("tasks", JSON.stringify(tasks));
    
        if (tasks[index].isStarred) {
            // Добавление задачи в "Мой день", если ее там еще нет
            if (!myDayTasks.some(task => task.text === taskToMove.text)) {
                myDayTasks.push(taskToMove);
            }
        } else {
            // Убираем задачу из "Мой день", если она была там
            myDayTasks = myDayTasks.filter(task => task.text !== taskToMove.text);
        }
    
        localStorage.setItem("myDayTasks", JSON.stringify(myDayTasks));
        renderTasks();
    };
    

    // Снятие звездочки из "Мой день"
    window.toggleStarFromMyDay = (index) => {
        const taskToMove = myDayTasks[index];
        
        // Проверка, если задача с таким текстом уже есть в основном списке
        if (!tasks.some(task => task.text === taskToMove.text)) {
            tasks.push(taskToMove); // Добавляем только если такой задачи нет
        }
        
        myDayTasks.splice(index, 1); // Убираем задачу из "Мой день"
        localStorage.setItem("tasks", JSON.stringify(tasks));
        localStorage.setItem("myDayTasks", JSON.stringify(myDayTasks));
        renderTasks(); // Обновляем отображение
    };
    

    // Удаление задачи из "Мой день"
    window.deleteFromMyDay = (index) => {
        myDayTasks.splice(index, 1);
        localStorage.setItem("myDayTasks", JSON.stringify(myDayTasks));
        renderTasks();
    };

    renderTasks();
});
