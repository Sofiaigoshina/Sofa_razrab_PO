document.addEventListener("DOMContentLoaded", function () {
    const myDayList = document.getElementById("myDayList");
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let myDayTasks = JSON.parse(localStorage.getItem("myDayTasks")) || [];

    // Функция для рендеринга задач в "Мой день"
    function renderMyDay() {
        myDayList.innerHTML = '';
        myDayTasks.forEach((task, index) => {
            const taskElement = document.createElement("li");
            taskElement.className = "task";
            taskElement.innerHTML = `
                <button class="circle-btn" onclick="moveToTasks(${index})">⭕</button>
                <span>${task.text}</span>
                <div>
                    <button class="star-btn ${task.isStarred ? 'starred' : ''}" onclick="removeStarFromMyDay(${index})">★</button>
                    <button onclick="deleteFromMyDay(${index})">❌</button>
                </div>
            `;
            myDayList.appendChild(taskElement);
        });
    }

   
    

    // Снятие звездочки с задачи из "Мой день"
    window.removeStarFromMyDay = (index) => {
        const task = myDayTasks.splice(index, 1)[0]; // Убираем задачу из "Мой день"
        
        // Проверяем, если такая задача уже есть в основном списке, то не добавляем ее снова
        if (!tasks.some(existingTask => existingTask.text === task.text)) {
            tasks.push(task); // Добавляем задачу обратно в основной список, если её нет
        }
        
        localStorage.setItem("tasks", JSON.stringify(tasks));
        localStorage.setItem("myDayTasks", JSON.stringify(myDayTasks));
        renderMyDay(); // Обновляем список "Мой день"
    };
    

    // Удаление задачи из "Мой день"
    window.deleteFromMyDay = (index) => {
        myDayTasks.splice(index, 1); // Удаляем задачу из "Мой день"
        localStorage.setItem("myDayTasks", JSON.stringify(myDayTasks));
        renderMyDay(); // Обновляем список "Мой день"
    };

    // Первоначальный рендер
    renderMyDay();
});


