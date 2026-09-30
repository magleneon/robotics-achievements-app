// Копилка достижений юного робототехника
// Данные хранятся в общей базе Firestore — прогресс виден с любого устройства.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6lAa8_cYb1ROAIEMbFc_p5z9UCrYePlc",
  authDomain: "robotics-achievements-app.firebaseapp.com",
  projectId: "robotics-achievements-app",
  storageBucket: "robotics-achievements-app.firebasestorage.app",
  messagingSenderId: "146729686097",
  appId: "1:146729686097:web:b66e1afd159d3fe6101470",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const studentsCol = collection(db, "students");

const ACHIEVEMENTS = [
  {
    id: "intro", icon: "🔍", category: "Знакомство", xp: 10,
    title: "Познакомился(лась) с устройством робота и его частями",
    description: "Рассмотри робота по частям: корпус, моторы, плата управления, датчики и провода. Узнай, как называется каждый элемент и за что он отвечает.",
    tip: "Сфотографируй робота в разобранном виде и подпиши детали — так легче запомнить, что где находится.",
  },
  {
    id: "chassis", icon: "🔧", category: "Сборка", xp: 15,
    title: "Собрал(а) шасси робота",
    description: "Собери основание робота по инструкции: скрепи детали корпуса и закрепи крепления для моторов и колёс или ног.",
    tip: "Не затягивай винты до конца сразу — сначала собери всю конструкцию целиком, а затем подтяни крепления.",
  },
  {
    id: "motors", icon: "⚙️", category: "Сборка", xp: 15,
    title: "Установил(а) моторы и подвижные части (колёса/ноги)",
    description: "Закрепи моторы на шасси и подключи к ним колёса или ноги робота. Проверь, что подвижные части не задевают друг друга.",
    tip: "Перед включением питания прокрути колесо или ногу рукой — оно должно вращаться свободно, без заеданий.",
  },
  {
    id: "electronics", icon: "🔌", category: "Электроника", xp: 20,
    title: "Подключил(а) плату, провода и датчики",
    description: "Подключи плату управления к моторам и питанию, аккуратно разведи провода согласно схеме подключения.",
    tip: "Сверяйся со схемой на каждом шаге и фотографируй промежуточный результат — так проще найти ошибку, если что-то не заработает.",
  },
  {
    id: "setup", icon: "💻", category: "Программирование", xp: 10,
    title: "Установил(а) и настроил(а) программную среду",
    description: "Установи на компьютер программу для написания и загрузки кода и подключи к ней робота.",
    tip: "Проверь подключение простым тестовым скетчем — например, миганием встроенного светодиода.",
  },
  {
    id: "first-program", icon: "▶️", category: "Программирование", xp: 15,
    title: "Написал(а) и запустил(а) первую программу для робота",
    description: "Напиши простейшую программу и загрузи её в робота — например, мигание светодиодом или вывод сообщения.",
    tip: "Начинай с малого: если первая простая программа заработала — двигайся дальше, не усложняй сразу.",
  },
  {
    id: "movement", icon: "🚶", category: "Программирование", xp: 20,
    title: "Запрограммировал(а) движение робота (вперёд, назад, повороты)",
    description: "Напиши код, который управляет моторами: робот должен ехать вперёд, назад и поворачивать по команде.",
    tip: "Тестируй каждое движение отдельно (только вперёд, только поворот), прежде чем объединять их в одну программу.",
  },
  {
    id: "sensor", icon: "📡", category: "Электроника", xp: 20,
    title: "Подключил(а) и запрограммировал(а) датчик (расстояния, света и т.п.)",
    description: "Подключи датчик к плате и напиши код, который считывает и обрабатывает его показания.",
    tip: "Выведи показания датчика на экран или в монитор порта — так удобно проверить, что он работает правильно.",
  },
  {
    id: "algorithm", icon: "🧠", category: "Программирование", xp: 25,
    title: "Написал(а) алгоритм объезда препятствий",
    description: "Используя показания датчика, напиши алгоритм: если на пути препятствие — робот останавливается, поворачивает и едет дальше.",
    tip: "Продумай порядок действий на бумаге в виде блок-схемы, прежде чем писать код — так легче не запутаться.",
  },
  {
    id: "debug", icon: "🐞", category: "Тестирование", xp: 20,
    title: "Нашёл(шла) и исправил(а) ошибку в работе робота",
    description: "Протестируй робота в деле, найди ситуацию, в которой он ведёт себя неправильно, и исправь код или сборку.",
    tip: "Меняй в коде только одну вещь за раз — так проще понять, что именно повлияло на результат.",
  },
  {
    id: "present", icon: "🎤", category: "Презентация", xp: 15,
    title: "Представил(а) свой проект перед группой",
    description: "Расскажи группе, что делает твой робот, покажи его в работе и ответь на вопросы.",
    tip: "Заранее продумай короткий план рассказа: что делает робот, как ты его собирал и что было сложнее всего.",
  },
  {
    id: "help", icon: "🤝", category: "Командная работа", xp: 15,
    title: "Помог(ла) товарищу решить техническую проблему",
    description: "Помоги другому участнику кружка разобраться с его роботом или программой — объясни, а не делай за него.",
    tip: "Задавай наводящие вопросы вместо готовых ответов — так товарищ научится решать похожие проблемы сам.",
  },
];

const TOTAL_XP = ACHIEVEMENTS.reduce((sum, a) => sum + a.xp, 0);

const QUIZZES = [
  {
    id: "safety",
    icon: "🦺",
    title: "Техника безопасности",
    description: "Проверь, как хорошо ты помнишь правила безопасной работы в мастерской.",
    bonusXp: 20,
    questions: [
      {
        q: "Что нужно сделать перед началом работы с паяльником?",
        options: [
          "Сразу начать паять",
          "Убедиться, что рабочее место свободно, а паяльник — на подставке",
          "Взять паяльник голыми руками за жало",
          "Ничего, можно начинать в любой момент",
        ],
        correct: 1,
      },
      {
        q: "Что делать, если почувствовал запах гари от платы или проводов?",
        options: [
          "Продолжить работу — само пройдёт",
          "Полить провода водой, не отключая питание",
          "Сразу отключить питание и сообщить педагогу",
          "Ничего, это нормально",
        ],
        correct: 2,
      },
      {
        q: "Где должны находиться инструменты и провода во время работы?",
        options: [
          "На полу под ногами",
          "На самом краю стола",
          "Аккуратно на рабочем месте, не мешая движениям",
          "В кармане",
        ],
        correct: 2,
      },
      {
        q: "Можно ли подключать робота к питанию, не проверив схему и полярность?",
        options: [
          "Да, всегда так делают",
          "Нет, сначала нужно свериться со схемой подключения",
          "Можно, если торопишься",
          "Неважно, робот сам разберётся",
        ],
        correct: 1,
      },
    ],
  },
  {
    id: "electronics",
    icon: "🔋",
    title: "Основы электроники",
    description: "Небольшой тест на знание базовых понятий электроники и датчиков.",
    bonusXp: 20,
    questions: [
      {
        q: "Какой элемент используют, чтобы ограничить ток в цепи со светодиодом?",
        options: ["Конденсатор", "Резистор", "Провод", "Батарейка"],
        correct: 1,
      },
      {
        q: "Что произойдёт, если подключить светодиод в обратной полярности?",
        options: ["Будет светить ярче", "Ничего не изменится", "Он не загорится", "Он зарядится"],
        correct: 2,
      },
      {
        q: "Что измеряется в вольтах?",
        options: ["Сила тока", "Напряжение", "Сопротивление", "Масса"],
        correct: 1,
      },
      {
        q: "Для чего на роботе нужен датчик расстояния?",
        options: [
          "Для измерения температуры",
          "Для определения препятствий на пути",
          "Для зарядки батареи",
          "Для включения света в комнате",
        ],
        correct: 1,
      },
    ],
  },
  {
    id: "programming",
    icon: "🖥️",
    title: "Основы программирования",
    description: "Проверь базовые понятия программирования, которые нужны для управления роботом.",
    bonusXp: 20,
    questions: [
      {
        q: "Что такое переменная в программе?",
        options: [
          "Часть корпуса робота",
          "Именованное место для хранения данных",
          "Вид датчика",
          "Ошибка в коде",
        ],
        correct: 1,
      },
      {
        q: "Какая конструкция используется, чтобы повторить действие несколько раз?",
        options: ["Условие (if)", "Цикл", "Комментарий", "Переменная"],
        correct: 1,
      },
      {
        q: "Что делает условная конструкция if?",
        options: [
          "Повторяет код много раз",
          "Останавливает программу навсегда",
          "Выполняет код только при определённом условии",
          "Хранит числа",
        ],
        correct: 2,
      },
      {
        q: "Зачем в коде нужны комментарии?",
        options: [
          "Чтобы программа работала быстрее",
          "Чтобы объяснить код человеку, не влияя на его работу",
          "Чтобы робот двигался",
          "Без них код не запустится",
        ],
        correct: 1,
      },
    ],
  },
];

// Раскрытые карточки — только состояние текущей сессии, не сохраняется
const expandedIds = new Set();

const CATEGORY_META = {
  "Знакомство": { icon: "🕵️", label: "Исследователь" },
  "Сборка": { icon: "🛠️", label: "Сборщик" },
  "Электроника": { icon: "🔋", label: "Электронщик" },
  "Программирование": { icon: "🖥️", label: "Программист" },
  "Тестирование": { icon: "🐛", label: "Тестировщик" },
  "Презентация": { icon: "🎙️", label: "Спикер" },
  "Командная работа": { icon: "🤝", label: "Командный игрок" },
};

const CATEGORY_GROUPS = new Map();
ACHIEVEMENTS.forEach((a) => {
  if (!CATEGORY_GROUPS.has(a.category)) CATEGORY_GROUPS.set(a.category, []);
  CATEGORY_GROUPS.get(a.category).push(a.id);
});

const LEVELS = [
  { min: 0, icon: "🌱", title: "Новичок" },
  { min: 25, icon: "🔩", title: "Стажёр" },
  { min: 50, icon: "⚡", title: "Инженер" },
  { min: 75, icon: "🚀", title: "Мастер" },
  { min: 100, icon: "🏆", title: "Легенда кружка" },
];

const loginScreen = document.getElementById("loginScreen");
const mainScreen = document.getElementById("mainScreen");
const loginForm = document.getElementById("loginForm");
const nameInput = document.getElementById("nameInput");
const namesList = document.getElementById("namesList");
const userNameEl = document.getElementById("userName");
const switchUserBtn = document.getElementById("switchUserBtn");
const resetBtn = document.getElementById("resetBtn");
const achievementsListEl = document.getElementById("achievementsList");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const levelIcon = document.getElementById("levelIcon");
const levelTitle = document.getElementById("levelTitle");
const celebration = document.getElementById("celebration");
const closeCelebration = document.getElementById("closeCelebration");
const leaderboardList = document.getElementById("leaderboardList");
const leaderboardEmpty = document.getElementById("leaderboardEmpty");
const badgesRow = document.getElementById("badgesRow");
const confettiLayer = document.getElementById("confettiLayer");
const certificateBtn = document.getElementById("certificateBtn");
const openCertificateBtn = document.getElementById("openCertificateBtn");
const certificate = document.getElementById("certificate");
const closeCertificate = document.getElementById("closeCertificate");
const printCertificateBtn = document.getElementById("printCertificateBtn");
const certName = document.getElementById("certName");
const certLevel = document.getElementById("certLevel");
const certCount = document.getElementById("certCount");
const certTotal = document.getElementById("certTotal");
const certXp = document.getElementById("certXp");
const certBadges = document.getElementById("certBadges");
const certDate = document.getElementById("certDate");
const certEgg = document.getElementById("certEgg");
const teacherScreen = document.getElementById("teacherScreen");
const teacherPanelBtn = document.getElementById("teacherPanelBtn");
const closeTeacherBtn = document.getElementById("closeTeacherBtn");
const printTeacherBtn = document.getElementById("printTeacherBtn");
const teacherStats = document.getElementById("teacherStats");
const teacherTableBody = document.getElementById("teacherTableBody");
const companionSvg = document.getElementById("companionSvg");
const companionCaption = document.getElementById("companionCaption");
const quizzesRow = document.getElementById("quizzesRow");
const quizModal = document.getElementById("quizModal");
const quizIcon = document.getElementById("quizIcon");
const quizTitle = document.getElementById("quizTitle");
const quizDesc = document.getElementById("quizDesc");
const quizForm = document.getElementById("quizForm");
const quizResult = document.getElementById("quizResult");
const closeQuiz = document.getElementById("closeQuiz");
const certQuizCount = document.getElementById("certQuizCount");
const certQuizzes = document.getElementById("certQuizzes");

const RANK_BADGES = ["🥇", "🥈", "🥉"];

const COMPANION_CAPTIONS = [
  "Пока только детали на столе — начни отмечать достижения!",
  "Корпус собран, робот обретает форму!",
  "Руки и голова на месте — робот почти готов к работе!",
  "Робот включён и полон энергии!",
  "Робот полностью собран — перед тобой Легенда кружка!",
];

const NETWORK_ERROR_TOAST = "⚠️ Не удалось связаться с базой данных — проверь интернет-соединение.";

let currentUser = null;
let currentUserData = null; // кэш документа текущего ученика из Firestore

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function studentRef(name) {
  return doc(db, "students", normalizeName(name));
}

// Загружает документ ученика; создаёт новый, если его ещё нет
async function loadOrCreateStudent(name) {
  const ref = studentRef(name);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }
  const fresh = { name, checked: [], quizzes: {}, note: "", lastActive: null, easterEgg: false };
  await setDoc(ref, fresh);
  return fresh;
}

// Сохраняет изменения в фоне (не блокирует интерфейс); при сбое показывает тост
function saveStudentData(name, partial) {
  if (!name) return;
  setDoc(studentRef(name), partial, { merge: true }).catch((err) => {
    console.error("Firestore save error:", err);
    showToast(NETWORK_ERROR_TOAST);
  });
}

// Ищет уже существующего ученика без учёта регистра/лишних пробелов,
// чтобы «Соня» и «соня» не превращались в двух разных учеников.
async function findExistingName(rawName) {
  const snap = await getDoc(studentRef(rawName));
  return snap.exists() ? (snap.data().name || rawName) : null;
}

async function getKnownNames() {
  const snap = await getDocs(studentsCol);
  return snap.docs.map((d) => d.data().name || d.id);
}

function getUserChecked() {
  return (currentUserData && currentUserData.checked) || [];
}

function setUserChecked(checked) {
  currentUserData.checked = checked;
  saveStudentData(currentUser, { checked });
}

function getUserQuizzes() {
  return (currentUserData && currentUserData.quizzes) || {};
}

function setUserQuizResult(quizId, score, total, passed) {
  const quizzes = { ...getUserQuizzes() };
  const prev = quizzes[quizId] || { bestScore: 0, passed: false };
  const wasPassed = prev.passed;
  quizzes[quizId] = {
    bestScore: Math.max(prev.bestScore, score),
    total,
    passed: wasPassed || passed,
  };
  currentUserData.quizzes = quizzes;
  saveStudentData(currentUser, { quizzes });
  return { wasPassed, nowPassed: wasPassed || passed };
}

function computeQuizBonusXp(quizzes) {
  return QUIZZES.filter((q) => quizzes[q.id] && quizzes[q.id].passed).reduce((sum, q) => sum + q.bonusXp, 0);
}

function computeQuizPassedCount(quizzes) {
  return QUIZZES.filter((q) => quizzes[q.id] && quizzes[q.id].passed).length;
}

function getQuizBonusXp() {
  return computeQuizBonusXp(getUserQuizzes());
}

function getQuizPassedCount() {
  return computeQuizPassedCount(getUserQuizzes());
}

function hasEasterEgg() {
  return Boolean(currentUserData && currentUserData.easterEgg);
}

function touchLastActive() {
  const ts = Date.now();
  if (currentUserData) currentUserData.lastActive = ts;
  saveStudentData(currentUser, { lastActive: ts });
}

function setUserNote(name, note) {
  saveStudentData(name, { note });
}

function formatRelativeDate(ts) {
  if (!ts) return "—";
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return new Date(ts).toLocaleDateString("ru-RU");
}

function getBadgeStatus(checkedSet) {
  const result = [];
  CATEGORY_GROUPS.forEach((ids, category) => {
    const done = ids.filter((id) => checkedSet.has(id)).length;
    result.push({
      category,
      done,
      total: ids.length,
      unlocked: done === ids.length,
      meta: CATEGORY_META[category],
    });
  });
  return result;
}

async function fillNamesList() {
  let names = [];
  try {
    names = await getKnownNames();
  } catch (e) {
    console.error(e);
    return;
  }
  namesList.innerHTML = "";
  names.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    namesList.appendChild(opt);
  });
}

async function getLeaderboardData() {
  const snap = await getDocs(studentsCol);
  return snap.docs
    .map((d) => {
      const data = d.data();
      const checked = data.checked || [];
      const achievementXp = ACHIEVEMENTS
        .filter((a) => checked.includes(a.id))
        .reduce((sum, a) => sum + a.xp, 0);
      const percent = Math.round((checked.length / ACHIEVEMENTS.length) * 100);
      return {
        name: data.name || d.id,
        count: checked.length,
        xp: achievementXp + computeQuizBonusXp(data.quizzes || {}),
        percent,
      };
    })
    .filter((u) => u.count > 0)
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, "ru"));
}

async function renderLeaderboard() {
  leaderboardList.innerHTML = "";
  leaderboardEmpty.hidden = false;
  leaderboardEmpty.textContent = "Загрузка рейтинга…";

  let top = [];
  try {
    top = (await getLeaderboardData()).slice(0, 5);
  } catch (e) {
    console.error(e);
    leaderboardEmpty.textContent = "Не удалось загрузить рейтинг — проверь интернет-соединение.";
    return;
  }

  if (top.length === 0) {
    leaderboardEmpty.textContent = "Рейтинг пока пуст — введи имя и стань первым в списке!";
    leaderboardEmpty.hidden = false;
    return;
  }
  leaderboardEmpty.hidden = true;

  top.forEach((u, i) => {
    const li = document.createElement("li");
    li.className = "leaderboard-row" + (i < 3 ? " top" + (i + 1) : "");
    const level = getLevel(u.percent);
    li.innerHTML = `
      <span class="rank">${RANK_BADGES[i] || "#" + (i + 1)}</span>
      <span class="rank-name">${u.name}</span>
      <span class="rank-level" title="${level.title}">${level.icon}</span>
      <span class="rank-xp">⭐ ${u.xp} XP</span>
    `;
    li.addEventListener("click", () => showMainScreen(u.name));
    leaderboardList.appendChild(li);
  });
}

function getLevel(percent) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (percent >= l.min) level = l;
  }
  return level;
}

function renderAchievements() {
  const checked = new Set(getUserChecked());
  achievementsListEl.innerHTML = "";

  ACHIEVEMENTS.forEach((a) => {
    const isDone = checked.has(a.id);
    const isExpanded = expandedIds.has(a.id);

    const li = document.createElement("li");
    li.className = "achievement-card" + (isDone ? " done" : "") + (isExpanded ? " expanded" : "");
    li.dataset.id = a.id;
    li.innerHTML = `
      <div class="achievement-header">
        <span class="achievement-icon">${a.icon}</span>
        <span class="achievement-main">
          <span class="achievement-title">${a.title}</span>
          <span class="achievement-meta">
            <span class="achievement-category">${a.category}</span>
            <span class="achievement-xp">⭐ +${a.xp} XP</span>
          </span>
        </span>
        <button type="button" class="achievement-check" aria-label="Отметить выполненным">✓</button>
        <button type="button" class="achievement-toggle" aria-label="Подробнее">⌄</button>
      </div>
      <div class="achievement-details">
        <p class="achievement-desc">${a.description}</p>
        <div class="achievement-tip"><span class="tip-label">💡 Совет:</span> ${a.tip}</div>
      </div>
    `;

    li.querySelector(".achievement-check").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleAchievement(a.id);
    });
    li.querySelector(".achievement-header").addEventListener("click", () => {
      toggleExpanded(a.id);
    });

    achievementsListEl.appendChild(li);
  });

  updateProgress(checked);
  renderBadges(checked);
}

function renderBadges(checkedSet) {
  const statuses = getBadgeStatus(checkedSet);
  badgesRow.innerHTML = "";
  statuses.forEach((s) => {
    const div = document.createElement("div");
    div.className = "badge" + (s.unlocked ? " unlocked" : "");
    div.title = `${s.meta.icon} ${s.meta.label} (${s.category}): ${s.done}/${s.total}`;
    div.innerHTML = `<span class="badge-icon">${s.meta.icon}</span>`;
    badgesRow.appendChild(div);
  });
}

function renderQuizzes() {
  const quizzes = getUserQuizzes();
  quizzesRow.innerHTML = "";

  QUIZZES.forEach((quiz) => {
    const state = quizzes[quiz.id];
    const div = document.createElement("div");
    div.className = "quiz-item" + (state && state.passed ? " passed" : "");

    let statusText = "Ещё не пройден";
    if (state && state.passed) {
      statusText = `✅ Пройден: ${state.bestScore}/${state.total} · +${quiz.bonusXp} XP`;
    } else if (state) {
      statusText = `Лучший результат: ${state.bestScore}/${state.total} — попробуй ещё раз`;
    }

    div.innerHTML = `
      <div class="quiz-item-icon">${quiz.icon}</div>
      <div class="quiz-item-body">
        <div class="quiz-item-title">${quiz.title}</div>
        <div class="quiz-item-desc">${quiz.description}</div>
        <div class="quiz-item-status">${statusText}</div>
      </div>
      <button type="button" class="btn btn-ghost btn-small quiz-start-btn">${
        state && state.passed ? "Пройти ещё раз" : "Начать тест"
      }</button>
    `;

    div.querySelector(".quiz-start-btn").addEventListener("click", () => openQuiz(quiz.id));
    quizzesRow.appendChild(div);
  });
}

let activeQuizId = null;

function openQuiz(quizId) {
  const quiz = QUIZZES.find((q) => q.id === quizId);
  if (!quiz) return;
  activeQuizId = quizId;

  quizIcon.textContent = quiz.icon;
  quizTitle.textContent = quiz.title;
  quizDesc.textContent = quiz.description;

  quizResult.hidden = true;
  quizResult.innerHTML = "";
  quizForm.hidden = false;
  quizForm.innerHTML = "";

  quiz.questions.forEach((q, qi) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "quiz-question";
    const legend = document.createElement("legend");
    legend.textContent = `${qi + 1}. ${q.q}`;
    fieldset.appendChild(legend);

    q.options.forEach((opt, oi) => {
      const label = document.createElement("label");
      label.className = "quiz-option";
      label.innerHTML = `<input type="radio" name="q${qi}" value="${oi}" required> <span>${opt}</span>`;
      fieldset.appendChild(label);
    });

    quizForm.appendChild(fieldset);
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary quiz-submit";
  submitBtn.textContent = "Проверить ответы";
  quizForm.appendChild(submitBtn);

  quizModal.hidden = false;
}

quizForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const quiz = QUIZZES.find((q) => q.id === activeQuizId);
  if (!quiz) return;

  let score = 0;
  quiz.questions.forEach((q, qi) => {
    const checked = quizForm.querySelector(`input[name="q${qi}"]:checked`);
    if (checked && parseInt(checked.value, 10) === q.correct) score++;
  });

  const total = quiz.questions.length;
  const passed = score / total >= 0.75;
  const { wasPassed } = setUserQuizResult(quiz.id, score, total, passed);
  touchLastActive();

  quizForm.hidden = true;
  quizResult.hidden = false;
  quizResult.innerHTML = `
    <div class="quiz-result-score">${score} из ${total} правильных ответов</div>
    ${
      passed
        ? `<div class="quiz-result-passed">🎉 Тест пройден!${wasPassed ? "" : ` +${quiz.bonusXp} XP начислено в сертификат.`}</div>`
        : `<div class="quiz-result-failed">Пока не зачтено — нужно верно ответить минимум на ${Math.ceil(total * 0.75)} из ${total}. Попробуй ещё раз!</div>`
    }
    <div class="quiz-result-actions">
      <button type="button" id="quizRetryBtn" class="btn btn-ghost">Пройти ещё раз</button>
      <button type="button" id="quizDoneBtn" class="btn btn-primary">Готово</button>
    </div>
  `;

  document.getElementById("quizRetryBtn").addEventListener("click", () => openQuiz(quiz.id));
  document.getElementById("quizDoneBtn").addEventListener("click", () => {
    quizModal.hidden = true;
  });

  if (passed && !wasPassed) {
    showToast(`🧪 Тест «${quiz.title}» пройден! +${quiz.bonusXp} XP`);
  }

  renderQuizzes();
});

closeQuiz.addEventListener("click", () => {
  quizModal.hidden = true;
});

function toggleExpanded(id) {
  if (expandedIds.has(id)) {
    expandedIds.delete(id);
  } else {
    expandedIds.add(id);
  }
  const card = achievementsListEl.querySelector(`.achievement-card[data-id="${id}"]`);
  if (card) card.classList.toggle("expanded");
}

function updateProgress(checkedSet) {
  const total = ACHIEVEMENTS.length;
  const done = checkedSet.size;
  const percent = Math.round((done / total) * 100);
  const earnedXp = ACHIEVEMENTS
    .filter((a) => checkedSet.has(a.id))
    .reduce((sum, a) => sum + a.xp, 0);

  progressFill.style.width = percent + "%";
  progressText.textContent = `${done} из ${total} достижений · ⭐ ${earnedXp} из ${TOTAL_XP} XP`;

  const level = getLevel(percent);
  levelIcon.textContent = level.icon;
  levelTitle.textContent = level.title;
  certificateBtn.hidden = percent < 100;
  renderCompanion(percent);

  return percent;
}

function renderCompanion(percent) {
  const level = getLevel(percent);
  const stage = LEVELS.indexOf(level);

  companionSvg.querySelectorAll(".companion-part").forEach((el) => {
    const minStage = parseInt(el.dataset.minStage, 10);
    el.classList.toggle("active", stage >= minStage);
  });
  companionSvg.classList.toggle("stage-final", stage === LEVELS.length - 1);

  let caption = COMPANION_CAPTIONS[stage] || COMPANION_CAPTIONS[0];
  if (hasEasterEgg()) caption += " 🥚";
  companionCaption.textContent = caption;
}

// Секретная пасхалка: несколько быстрых кликов по роботу
let eggClickTimestamps = [];
companionSvg.addEventListener("click", () => {
  if (!currentUser) return;
  const now = Date.now();
  eggClickTimestamps.push(now);
  eggClickTimestamps = eggClickTimestamps.filter((t) => now - t < 2500);
  if (eggClickTimestamps.length >= 6) {
    eggClickTimestamps = [];
    triggerEasterEgg();
  }
});

function triggerEasterEgg() {
  const alreadyFound = hasEasterEgg();
  if (currentUserData) currentUserData.easterEgg = true;
  saveStudentData(currentUser, { easterEgg: true });

  companionSvg.classList.remove("egg-spin");
  void companionSvg.offsetWidth;
  companionSvg.classList.add("egg-spin");
  setTimeout(() => companionSvg.classList.remove("egg-spin"), 1000);

  if (!alreadyFound) {
    showToast("🥚 Секретная пасхалка найдена! Робот теперь умеет танцевать.");
  }

  const checked = new Set(getUserChecked());
  const percent = Math.round((checked.size / ACHIEVEMENTS.length) * 100);
  renderCompanion(percent);
}

function toggleAchievement(id) {
  const checkedBefore = new Set(getUserChecked());
  const wasComplete = checkedBefore.size === ACHIEVEMENTS.length;
  const badgesBefore = getBadgeStatus(checkedBefore)
    .filter((s) => s.unlocked)
    .map((s) => s.category);

  const checked = new Set(checkedBefore);
  if (checked.has(id)) {
    checked.delete(id);
  } else {
    checked.add(id);
  }

  setUserChecked(Array.from(checked));
  touchLastActive();
  renderAchievements();

  const badgesAfter = getBadgeStatus(checked).filter((s) => s.unlocked).map((s) => s.category);
  badgesAfter
    .filter((cat) => !badgesBefore.includes(cat))
    .forEach((cat) => showToast(`🏅 Новый значок «${CATEGORY_META[cat].label}» получен!`));

  const isComplete = checked.size === ACHIEVEMENTS.length;
  if (isComplete && !wasComplete) {
    showCelebration();
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function showCelebration() {
  celebration.hidden = false;
  spawnConfetti();
}

function spawnConfetti() {
  confettiLayer.innerHTML = "";
  const colors = ["#35d0ba", "#7c5cff", "#f3c65f", "#ff6b6b", "#5fb8ff"];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2 + Math.random() * 1.5) + "s";
    piece.style.animationDelay = (Math.random() * 0.4) + "s";
    piece.style.setProperty("--rot", Math.round(Math.random() * 360) + "deg");
    confettiLayer.appendChild(piece);
  }
  setTimeout(() => {
    confettiLayer.innerHTML = "";
  }, 4200);
}

closeCelebration.addEventListener("click", () => {
  celebration.hidden = true;
});

openCertificateBtn.addEventListener("click", () => {
  celebration.hidden = true;
  openCertificate();
});

certificateBtn.addEventListener("click", openCertificate);

closeCertificate.addEventListener("click", () => {
  certificate.hidden = true;
});

printCertificateBtn.addEventListener("click", () => {
  window.print();
});

function openCertificate() {
  const checked = new Set(getUserChecked());
  const percent = Math.round((checked.size / ACHIEVEMENTS.length) * 100);
  const level = getLevel(percent);
  const achievementXp = ACHIEVEMENTS.filter((a) => checked.has(a.id)).reduce((sum, a) => sum + a.xp, 0);
  const quizBonusXp = getQuizBonusXp();
  const quizPassedCount = getQuizPassedCount();
  const userQuizzes = getUserQuizzes();

  certName.textContent = currentUser;
  certLevel.textContent = level.title;
  certCount.textContent = checked.size;
  certTotal.textContent = ACHIEVEMENTS.length;
  certXp.textContent = achievementXp + quizBonusXp;
  certQuizCount.textContent = quizPassedCount;
  certDate.textContent = new Date().toLocaleDateString("ru-RU");
  certEgg.hidden = !hasEasterEgg();

  certBadges.innerHTML = "";
  getBadgeStatus(checked)
    .filter((s) => s.unlocked)
    .forEach((s) => {
      const span = document.createElement("span");
      span.className = "certificate-badge";
      span.title = s.meta.label;
      span.textContent = s.meta.icon;
      certBadges.appendChild(span);
    });

  certQuizzes.innerHTML = "";
  QUIZZES.forEach((q) => {
    const state = userQuizzes[q.id];
    const passed = Boolean(state && state.passed);
    const span = document.createElement("span");
    span.className = "certificate-badge" + (passed ? "" : " certificate-badge-locked");
    span.title = `${q.title} — ${passed ? "тест пройден" : "тест не пройден"}`;
    span.textContent = q.icon;
    certQuizzes.appendChild(span);
  });

  certificate.hidden = false;
}

async function showMainScreen(name) {
  try {
    currentUserData = await loadOrCreateStudent(name);
  } catch (e) {
    console.error(e);
    showToast(NETWORK_ERROR_TOAST);
    return;
  }
  currentUser = currentUserData.name || name;
  userNameEl.textContent = currentUser;
  loginScreen.hidden = true;
  teacherScreen.hidden = true;
  mainScreen.hidden = false;
  renderAchievements();
  renderQuizzes();
}

function showLoginScreen() {
  currentUser = null;
  currentUserData = null;
  mainScreen.hidden = true;
  teacherScreen.hidden = true;
  loginScreen.hidden = false;
  nameInput.value = "";
  nameInput.focus();
  fillNamesList();
  renderLeaderboard();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const raw = nameInput.value.trim().replace(/\s+/g, " ");
  if (!raw) return;

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Загрузка…";

  try {
    const existing = await findExistingName(raw);
    await showMainScreen(existing || raw);
  } catch (err) {
    console.error(err);
    showToast(NETWORK_ERROR_TOAST);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});

switchUserBtn.addEventListener("click", showLoginScreen);

resetBtn.addEventListener("click", () => {
  if (!currentUser) return;
  const ok = confirm(`Сбросить весь прогресс ученика «${currentUser}», включая результаты тестов?`);
  if (!ok) return;
  currentUserData.checked = [];
  currentUserData.quizzes = {};
  saveStudentData(currentUser, { checked: [], quizzes: {} });
  renderAchievements();
  renderQuizzes();
});

async function getAllStudentsData() {
  const snap = await getDocs(studentsCol);
  return snap.docs
    .map((d) => {
      const data = d.data();
      const checked = data.checked || [];
      const checkedSet = new Set(checked);
      const quizzes = data.quizzes || {};
      const achievementXp = ACHIEVEMENTS.filter((a) => checkedSet.has(a.id)).reduce((sum, a) => sum + a.xp, 0);
      const quizBonusXp = computeQuizBonusXp(quizzes);
      const percent = Math.round((checked.length / ACHIEVEMENTS.length) * 100);
      const badgesCount = getBadgeStatus(checkedSet).filter((s) => s.unlocked).length;
      const quizCount = computeQuizPassedCount(quizzes);
      return {
        name: data.name || d.id,
        count: checked.length,
        xp: achievementXp + quizBonusXp,
        percent,
        badgesCount,
        quizCount,
        level: getLevel(percent),
        lastActive: data.lastActive,
        note: data.note || "",
      };
    })
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, "ru"));
}

async function renderTeacherPanel() {
  teacherStats.innerHTML = "";
  teacherTableBody.innerHTML =
    '<tr><td colspan="9" class="teacher-empty">Загрузка данных…</td></tr>';

  let students;
  try {
    students = await getAllStudentsData();
  } catch (e) {
    console.error(e);
    teacherTableBody.innerHTML =
      '<tr><td colspan="9" class="teacher-empty">Не удалось загрузить данные — проверь интернет-соединение.</td></tr>';
    return;
  }

  const totalXp = students.reduce((sum, u) => sum + u.xp, 0);
  const avgPercent = students.length
    ? Math.round(students.reduce((sum, u) => sum + u.percent, 0) / students.length)
    : 0;

  teacherStats.innerHTML = `
    <div class="teacher-stat"><span class="teacher-stat-value">${students.length}</span><span class="teacher-stat-label">учеников</span></div>
    <div class="teacher-stat"><span class="teacher-stat-value">${totalXp}</span><span class="teacher-stat-label">XP собрано всего</span></div>
    <div class="teacher-stat"><span class="teacher-stat-value">${avgPercent}%</span><span class="teacher-stat-label">средний прогресс</span></div>
  `;

  teacherTableBody.innerHTML = "";

  if (students.length === 0) {
    teacherTableBody.innerHTML =
      '<tr><td colspan="9" class="teacher-empty">Пока никто не начал — список появится, как только ученики отметят первые достижения.</td></tr>';
    return;
  }

  students.forEach((u) => {
    const isStale = u.lastActive && Date.now() - u.lastActive > 14 * 86400000;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.level.icon} ${u.level.title}</td>
      <td>
        <div class="teacher-progress"><div class="teacher-progress-fill" style="width:${u.percent}%"></div></div>
        <span class="teacher-progress-text">${u.count}/${ACHIEVEMENTS.length} · ${u.percent}%</span>
      </td>
      <td>⭐ ${u.xp}</td>
      <td>🏅 ${u.badgesCount}/${CATEGORY_GROUPS.size}</td>
      <td>🧪 ${u.quizCount}/${QUIZZES.length}</td>
      <td class="${isStale ? "teacher-stale" : ""}">${formatRelativeDate(u.lastActive)}</td>
    `;

    const noteTd = document.createElement("td");
    noteTd.className = "no-print";
    const noteTextarea = document.createElement("textarea");
    noteTextarea.className = "teacher-note";
    noteTextarea.placeholder = "Заметка…";
    noteTextarea.value = u.note;
    noteTextarea.addEventListener("blur", () => setUserNote(u.name, noteTextarea.value));
    noteTd.appendChild(noteTextarea);
    tr.appendChild(noteTd);

    const deleteTd = document.createElement("td");
    deleteTd.className = "no-print";
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "teacher-delete";
    deleteBtn.setAttribute("aria-label", "Удалить ученика");
    deleteBtn.textContent = "🗑";
    deleteBtn.addEventListener("click", () => deleteStudent(u.name));
    deleteTd.appendChild(deleteBtn);
    tr.appendChild(deleteTd);

    teacherTableBody.appendChild(tr);
  });
}

async function deleteStudent(name) {
  const ok = confirm(`Удалить ученика «${name}» и весь его прогресс без возможности восстановления?`);
  if (!ok) return;
  try {
    await deleteDoc(studentRef(name));
  } catch (e) {
    console.error(e);
    showToast(NETWORK_ERROR_TOAST);
    return;
  }
  renderTeacherPanel();
}

teacherPanelBtn.addEventListener("click", () => {
  loginScreen.hidden = true;
  teacherScreen.hidden = false;
  renderTeacherPanel();
});

closeTeacherBtn.addEventListener("click", () => {
  teacherScreen.hidden = true;
  loginScreen.hidden = false;
});

printTeacherBtn.addEventListener("click", () => {
  window.print();
});

// Старт приложения
fillNamesList();
renderLeaderboard();
