let tasks = [];
let currentFilter = "all";
let timers = {};

function addTask() {
  const input = document.getElementById("taskInput");
  const priority = document.getElementById("prioritySelect").value;
  const text = input.value.trim();

  if (text === "") return;

  const task = {
    id: Date.now(),
    text: text,
    completed: false,
    priority: priority,
    createdAt: new Date(),
  };

  tasks.push(task);
  input.value = "";
  updateUI();
  showNotification("Task added successfully! ✅");
}

function toggleTask(id) {
  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;

    // Stop timer if task is completed
    if (tasks[taskIndex].completed && timers[id]) {
      clearInterval(timers[id].interval);
      delete timers[id];
    }

    updateUI();
  }
}

function deleteTask(id) {
  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex !== -1) {
    const deletedTask = tasks[taskIndex];
    tasks = tasks.filter((t) => t.id !== id);

    // Stop timer if exists
    if (timers[id]) {
      clearInterval(timers[id].interval);
      delete timers[id];
    }

    updateUI();
    addActivity(`Deleted: ${deletedTask.text}`);
  }
}

function filterTasks(filter) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`[onclick="filterTasks('${filter}')"]`)
    .classList.add("active");
  updateUI();
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("pendingTasks").textContent = pending;
}

function addActivity(text) {
  if (!text.startsWith("Deleted:")) return;

  const activityLog = document.getElementById("activityLog");
  const activity = document.createElement("div");
  activity.className = "activity-item";
  activity.textContent = text;
  activityLog.insertBefore(activity, activityLog.firstChild);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

function updateUI() {
  const todoList = document.getElementById("todoList");
  todoList.innerHTML = "";

  let filteredTasks = tasks;
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.text.toLowerCase().includes(searchTerm);
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);
    return matchesSearch && matchesFilter;
  });

  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `todo-item ${task.completed ? "completed" : ""}`;

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" 
          ${task.completed ? "checked" : ""} 
          onclick="toggleTask(${task.id})">
      <div class="todo-content">
          <div class="todo-text">
              ${task.text}
              <span class="priority-badge priority-${task.priority}">
                  ${task.priority}
              </span>
          </div>
          <div class="todo-meta">
              ${formatDate(task.createdAt)}
              <span data-timer="${task.id}">0:00</span>
              <button onclick="showTimerDialog(${task.id})" class="action-btn">
                  ⏱️ Set Timer
              </button>
          </div>
      </div>
      <div class="todo-actions">
          <button onclick="deleteTask(${task.id})" 
              class="action-btn delete-btn">Delete</button>
      </div>
  `;

    todoList.appendChild(li);
  });

  updateStats();
}

function showTimerDialog(taskId) {
  const timerContainer = document.createElement("div");
  timerContainer.className = "timer-modal";
  timerContainer.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 300px;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

  timerContainer.innerHTML = `
  <h3 style="margin:0; color: #1f2937;">Set Timer</h3>
  <input type="number" id="timerMinutes" placeholder="Minutes" min="1" value="25"
      style="padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.9);">
  <div style="display: flex; gap: 1rem;">
      <button onclick="startCustomTimer(${taskId})" style="flex: 1; padding: 0.5rem; border-radius: 8px; border: none; background: #2563eb; color: white; cursor: pointer;">Start</button>
      <button onclick="closeTimerDialog()" style="flex: 1; padding: 0.5rem; border-radius: 8px; border: none; background: #dc2626; color: white; cursor: pointer;">Cancel</button>
  </div>
`;

  document.body.appendChild(timerContainer);
}

function closeTimerDialog() {
  const modal = document.querySelector(".timer-modal");
  if (modal) modal.remove();
}

function startCustomTimer(taskId) {
  const minutes = parseInt(document.getElementById("timerMinutes").value);
  closeTimerDialog();
  if (isNaN(minutes) || minutes <= 0) return;

  startTimer(taskId, minutes * 60);
}

function startTimer(taskId, totalSeconds) {
  if (timers[taskId]) {
    clearInterval(timers[taskId].interval);
  }

  const timerDisplay = document.querySelector(`[data-timer="${taskId}"]`);
  timerDisplay.className = "modern-timer";
  timerDisplay.style.cssText = `
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: inline-block;
  margin: 0 0.5rem;
  font-weight: bold;
  color: #2563eb;
  transition: all 0.3s ease;
`;

  let remainingSeconds = totalSeconds;
  updateTimerDisplay(timerDisplay, remainingSeconds);

  const interval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay(timerDisplay, remainingSeconds);

    if (remainingSeconds <= 60) {
      timerDisplay.style.animation = "pulse 1s infinite";
    }

    if (remainingSeconds <= 0) {
      clearInterval(interval);
      delete timers[taskId];
      showCompletionDialog(taskId);
    }
  }, 1000);

  timers[taskId] = {
    interval: interval,
    remainingSeconds: remainingSeconds,
  };
}

function showCompletionDialog(taskId) {
  const completionContainer = document.createElement("div");
  completionContainer.className = "completion-modal";
  completionContainer.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  text-align: center;
  min-width: 300px;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

  completionContainer.innerHTML = `
  <h3 style="margin-bottom: 1rem; color: #1f2937;">Time's Up!</h3>
  <p style="margin-bottom: 1.5rem; color: #4b5563;">Did you complete your task?</p>
  <div style="display: flex; gap: 1rem;">
      <button onclick="handleTaskCompletion(${taskId}, true)" 
          style="flex: 1; padding: 0.5rem; border-radius: 8px; border: none; background: #059669; color: white; cursor: pointer;">
          Yes, Done!
      </button>
      <button onclick="handleTaskCompletion(${taskId}, false)" 
          style="flex: 1; padding: 0.5rem; border-radius: 8px; border: none; background: #dc2626; color: white; cursor: pointer;">
          Not Yet
      </button>
  </div>
`;

  document.body.appendChild(completionContainer);
}

function handleTaskCompletion(taskId, completed) {
  const modal = document.querySelector(".completion-modal");
  const timerDisplay = document.querySelector(`[data-timer="${taskId}"]`);

  if (completed) {
    toggleTask(taskId);
    showNotification("Great job! Task completed! 🎉");
  } else {
    timerDisplay.style.animation = "shake 0.5s ease-in-out";
    showNotification("Keep going! You can do it! 💪");
  }

  modal.remove();
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: #1f2937;
  transform: translateX(100%);
  animation: slideIn 0.3s forwards;
  z-index: 1000;
`;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function updateTimerDisplay(display, seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  display.textContent = `${minutes}:${
    remainingSeconds < 10 ? "0" : ""
  }${remainingSeconds}`;
}

// Add event listeners
document.getElementById("taskInput").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    addTask();
  }
});

document.getElementById("searchInput").addEventListener("input", updateUI);

// Add animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideOut {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}

.modern-timer {
  transition: all 0.3s ease;
}
`;
document.head.appendChild(styleSheet);

// Initialize UI
updateUI();
