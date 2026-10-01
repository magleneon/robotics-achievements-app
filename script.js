// Учебная платформа: группы, лекции, тесты и полезные ресурсы.
// Данные хранятся в общей базе Firestore — доступны с любого устройства.

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
const groupsCol = collection(db, "groups");

// ---------- DOM ----------

const loginScreen = document.getElementById("loginScreen");
const mainScreen = document.getElementById("mainScreen");
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");
const teacherLoginScreen = document.getElementById("teacherLoginScreen");
const teacherLoginForm = document.getElementById("teacherLoginForm");
const teacherUsernameInput = document.getElementById("teacherUsernameInput");
const teacherPasswordInput = document.getElementById("teacherPasswordInput");
const teacherLoginError = document.getElementById("teacherLoginError");
const closeTeacherLoginBtn = document.getElementById("closeTeacherLoginBtn");
const userNameEl = document.getElementById("userName");
const switchUserBtn = document.getElementById("switchUserBtn");
const groupTabsEl = document.getElementById("groupTabs");
const groupContentEl = document.getElementById("groupContent");

const teacherScreen = document.getElementById("teacherScreen");
const teacherPanelBtn = document.getElementById("teacherPanelBtn");
const closeTeacherBtn = document.getElementById("closeTeacherBtn");
const printTeacherBtn = document.getElementById("printTeacherBtn");
const teacherStats = document.getElementById("teacherStats");
const teacherTableBody = document.getElementById("teacherTableBody");

const addGroupForm = document.getElementById("addGroupForm");
const newGroupName = document.getElementById("newGroupName");
const addGroupMessage = document.getElementById("addGroupMessage");
const groupsListEl = document.getElementById("groupsList");

const addStudentForm = document.getElementById("addStudentForm");
const newStudentFullName = document.getElementById("newStudentFullName");
const newStudentUsername = document.getElementById("newStudentUsername");
const newStudentPassword = document.getElementById("newStudentPassword");
const generatePasswordBtn = document.getElementById("generatePasswordBtn");
const newStudentGroups = document.getElementById("newStudentGroups");
const addStudentMessage = document.getElementById("addStudentMessage");

const exportGroupSelect = document.getElementById("exportGroupSelect");
const exportPasswordsBtn = document.getElementById("exportPasswordsBtn");

const editGroupsModal = document.getElementById("editGroupsModal");
const closeEditGroups = document.getElementById("closeEditGroups");
const editGroupsName = document.getElementById("editGroupsName");
const editGroupsCheckboxes = document.getElementById("editGroupsCheckboxes");
const saveEditGroups = document.getElementById("saveEditGroups");

const manageContentModal = document.getElementById("manageContentModal");
const closeManageContent = document.getElementById("closeManageContent");
const manageContentName = document.getElementById("manageContentName");
const manageTestsList = document.getElementById("manageTestsList");
const addTestBtn = document.getElementById("addTestBtn");
const manageLecturesList = document.getElementById("manageLecturesList");
const addLectureBtn = document.getElementById("addLectureBtn");
const manageResourcesList = document.getElementById("manageResourcesList");
const addResourceForm = document.getElementById("addResourceForm");
const newResourceLabel = document.getElementById("newResourceLabel");
const newResourceUrl = document.getElementById("newResourceUrl");

const lectureEditorModal = document.getElementById("lectureEditorModal");
const closeLectureEditor = document.getElementById("closeLectureEditor");
const lectureEditorForm = document.getElementById("lectureEditorForm");
const lectureTitleInput = document.getElementById("lectureTitleInput");
const lectureBodyInput = document.getElementById("lectureBodyInput");
const lectureVideoInput = document.getElementById("lectureVideoInput");
const lectureFileInput = document.getElementById("lectureFileInput");

const testEditorModal = document.getElementById("testEditorModal");
const closeTestEditor = document.getElementById("closeTestEditor");
const testTitleInput = document.getElementById("testTitleInput");
const testQuestionsList = document.getElementById("testQuestionsList");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const saveTestBtn = document.getElementById("saveTestBtn");

const takeTestModal = document.getElementById("takeTestModal");
const closeTakeTest = document.getElementById("closeTakeTest");
const takeTestTitle = document.getElementById("takeTestTitle");
const takeTestForm = document.getElementById("takeTestForm");
const takeTestResult = document.getElementById("takeTestResult");

const viewLectureModal = document.getElementById("viewLectureModal");
const closeViewLecture = document.getElementById("closeViewLecture");
const viewLectureTitle = document.getElementById("viewLectureTitle");
const viewLectureBody = document.getElementById("viewLectureBody");
const viewLectureVideo = document.getElementById("viewLectureVideo");
const viewLectureFile = document.getElementById("viewLectureFile");

let currentUser = null;
let currentUserData = null; // кэш документа текущего ученика из Firestore
let allGroupsCache = [];    // кэш списка всех групп (обновляется при входе/открытии панели)
let activeGroupId = null;
let activeSubTab = "tests"; // tests | lectures | resources
let editingStudentName = null;

// ---------- Утилиты ----------

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function studentRef(name) {
  return doc(db, "students", normalizeName(name));
}

function groupRef(name) {
  return doc(db, "groups", normalizeName(name));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyTeacherAuth(username, password) {
  const snap = await getDoc(doc(db, "config", "teacherAuth"));
  if (!snap.exists()) return false;
  const data = snap.data();
  const hash = await sha256Hex(password);
  return data.username === username && data.passwordHash === hash;
}

function saveStudentData(name, partial) {
  if (!name) return;
  setDoc(studentRef(name), partial, { merge: true }).catch(reportError);
}

function touchLastActive() {
  const ts = Date.now();
  if (currentUserData) currentUserData.lastActive = ts;
  saveStudentData(currentUser, { lastActive: ts });
}

function formatRelativeDate(ts) {
  if (!ts) return "—";
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return new Date(ts).toLocaleDateString("ru-RU");
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

function reportError(err) {
  console.error(err);
  const detail = (err && (err.code || err.message)) || "неизвестная ошибка";
  showToast(`⚠️ Не удалось сохранить (${detail}). Если это повторяется — сообщи разработчику.`);
}

function toYouTubeEmbed(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// ---------- Группы ----------

async function getAllGroups() {
  const snap = await getDocs(groupsCol);
  return snap.docs
    .map((d) => ({
      id: d.id,
      name: d.data().name || d.id,
      lectures: d.data().lectures || [],
      tests: d.data().tests || [],
      resources: d.data().resources || [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

async function createGroup(name) {
  const ref = groupRef(name);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return { ok: false, reason: "exists" };
  }
  await setDoc(ref, { name, lectures: [], tests: [], resources: [] });
  return { ok: true };
}

async function deleteGroup(groupId, groupName) {
  const ok = confirm(`Удалить группу «${groupName}»? Она пропадёт у всех учеников, которые в неё входили.`);
  if (!ok) return;
  try {
    await deleteDoc(groupRef(groupId));
    renderGroupsManagement();
    renderTeacherPanel();
  } catch (e) {
    reportError(e);
  }
}

async function renderGroupsManagement() {
  let groups = [];
  try {
    groups = await getAllGroups();
  } catch (e) {
    console.error(e);
    return;
  }
  allGroupsCache = groups;

  groupsListEl.innerHTML = "";
  if (groups.length === 0) {
    groupsListEl.innerHTML = '<p class="group-checkboxes-empty">Групп пока нет — создай первую выше.</p>';
  } else {
    groups.forEach((g) => {
      const pill = document.createElement("span");
      pill.className = "group-pill";
      pill.innerHTML = `${g.name} `;

      const contentBtn = document.createElement("button");
      contentBtn.type = "button";
      contentBtn.textContent = "⚙️";
      contentBtn.setAttribute("aria-label", `Содержимое группы ${g.name}`);
      contentBtn.addEventListener("click", () => openManageContent(g.id));
      pill.appendChild(contentBtn);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.setAttribute("aria-label", `Удалить группу ${g.name}`);
      delBtn.addEventListener("click", () => deleteGroup(g.id, g.name));
      pill.appendChild(delBtn);

      groupsListEl.appendChild(pill);
    });
  }

  renderStudentGroupCheckboxes();
  populateExportGroupSelect();
}

function renderStudentGroupCheckboxes() {
  newStudentGroups.innerHTML = "";
  if (allGroupsCache.length === 0) {
    newStudentGroups.innerHTML = '<p class="group-checkboxes-empty">Сначала создай хотя бы одну группу.</p>';
    return;
  }
  allGroupsCache.forEach((g) => {
    const label = document.createElement("label");
    label.className = "group-checkbox-item";
    label.innerHTML = `<input type="checkbox" value="${g.id}"> ${g.name}`;
    newStudentGroups.appendChild(label);
  });
}

function populateExportGroupSelect() {
  exportGroupSelect.innerHTML = '<option value="__all__">Все ученики</option>';
  allGroupsCache.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    exportGroupSelect.appendChild(opt);
  });
}

addGroupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = newGroupName.value.trim();
  addGroupMessage.hidden = true;
  if (!name) return;

  try {
    const result = await createGroup(name);
    if (!result.ok) {
      addGroupMessage.textContent = "Такая группа уже существует.";
      addGroupMessage.hidden = false;
      return;
    }
    newGroupName.value = "";
    renderGroupsManagement();
    renderTeacherPanel();
  } catch (err) {
    console.error(err);
    addGroupMessage.textContent = "Не удалось создать — проверь интернет-соединение.";
    addGroupMessage.hidden = false;
  }
});

// ---------- Содержимое группы: управление (педагог) ----------

let managingGroupId = null;
let editingLectureId = null;
let editingTestId = null;
let currentQuestions = [];

function openManageContent(groupId) {
  managingGroupId = groupId;
  const group = allGroupsCache.find((g) => g.id === groupId);
  if (!group) return;
  manageContentName.textContent = group.name;
  renderManageLists(group);
  manageContentModal.hidden = false;
}

function renderManageLists(group) {
  manageTestsList.innerHTML = "";
  if (!(group.tests || []).length) {
    manageTestsList.innerHTML = '<p class="group-checkboxes-empty">Тестов пока нет.</p>';
  } else {
    group.tests.forEach((t) => {
      const pill = document.createElement("span");
      pill.className = "group-pill";
      pill.style.cursor = "pointer";
      pill.innerHTML = `${t.title} (${(t.questions || []).length}) `;
      pill.addEventListener("click", () => openEditTest(t));
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeTest(t.id);
      });
      pill.appendChild(delBtn);
      manageTestsList.appendChild(pill);
    });
  }

  manageLecturesList.innerHTML = "";
  if (!(group.lectures || []).length) {
    manageLecturesList.innerHTML = '<p class="group-checkboxes-empty">Лекций пока нет.</p>';
  } else {
    group.lectures.forEach((l) => {
      const pill = document.createElement("span");
      pill.className = "group-pill";
      pill.style.cursor = "pointer";
      pill.innerHTML = `${l.title} `;
      pill.addEventListener("click", () => openEditLecture(l));
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeLecture(l.id);
      });
      pill.appendChild(delBtn);
      manageLecturesList.appendChild(pill);
    });
  }

  manageResourcesList.innerHTML = "";
  if (!(group.resources || []).length) {
    manageResourcesList.innerHTML = '<p class="group-checkboxes-empty">Ссылок пока нет.</p>';
  } else {
    group.resources.forEach((r, idx) => {
      const pill = document.createElement("span");
      pill.className = "group-pill";
      pill.innerHTML = `${r.label} `;
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", () => removeResource(idx));
      pill.appendChild(delBtn);
      manageResourcesList.appendChild(pill);
    });
  }
}

closeManageContent.addEventListener("click", () => {
  manageContentModal.hidden = true;
});

// --- Ресурсы ---

addResourceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const label = newResourceLabel.value.trim();
  const url = newResourceUrl.value.trim();
  if (!label || !url) return;
  const group = allGroupsCache.find((g) => g.id === managingGroupId);
  if (!group) return;
  const resources = [...(group.resources || []), { label, url }];
  try {
    await setDoc(groupRef(managingGroupId), { resources }, { merge: true });
    group.resources = resources;
    renderManageLists(group);
    newResourceLabel.value = "";
    newResourceUrl.value = "";
  } catch (err) {
    reportError(err);
  }
});

async function removeResource(idx) {
  const group = allGroupsCache.find((g) => g.id === managingGroupId);
  if (!group) return;
  const resources = (group.resources || []).filter((_, i) => i !== idx);
  try {
    await setDoc(groupRef(managingGroupId), { resources }, { merge: true });
    group.resources = resources;
    renderManageLists(group);
  } catch (e) {
    reportError(e);
  }
}

// --- Лекции ---

addLectureBtn.addEventListener("click", () => {
  editingLectureId = null;
  lectureTitleInput.value = "";
  lectureBodyInput.value = "";
  lectureVideoInput.value = "";
  lectureFileInput.value = "";
  lectureEditorModal.hidden = false;
});

function openEditLecture(l) {
  editingLectureId = l.id;
  lectureTitleInput.value = l.title;
  lectureBodyInput.value = l.body || "";
  lectureVideoInput.value = l.videoUrl || "";
  lectureFileInput.value = l.fileUrl || "";
  lectureEditorModal.hidden = false;
}

lectureEditorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = lectureTitleInput.value.trim();
  const body = lectureBodyInput.value.trim();
  const videoUrl = lectureVideoInput.value.trim();
  const fileUrl = lectureFileInput.value.trim();
  if (!title) return;

  const group = allGroupsCache.find((g) => g.id === managingGroupId);
  if (!group) return;
  const lectures = [...(group.lectures || [])];
  if (editingLectureId) {
    const idx = lectures.findIndex((l) => l.id === editingLectureId);
    if (idx !== -1) lectures[idx] = { id: editingLectureId, title, body, videoUrl, fileUrl };
  } else {
    lectures.push({ id: genId(), title, body, videoUrl, fileUrl });
  }

  try {
    await setDoc(groupRef(managingGroupId), { lectures }, { merge: true });
    group.lectures = lectures;
    renderManageLists(group);
    lectureEditorModal.hidden = true;
  } catch (err) {
    reportError(err);
  }
});

async function removeLecture(id) {
  const ok = confirm("Удалить эту лекцию?");
  if (!ok) return;
  const group = allGroupsCache.find((g) => g.id === managingGroupId);
  if (!group) return;
  const lectures = (group.lectures || []).filter((l) => l.id !== id);
  try {
    await setDoc(groupRef(managingGroupId), { lectures }, { merge: true });
    group.lectures = lectures;
    renderManageLists(group);
  } catch (e) {
    reportError(e);
  }
}

closeLectureEditor.addEventListener("click", () => {
  lectureEditorModal.hidden = true;
});

// --- Тесты ---

addTestBtn.addEventListener("click", () => {
  editingTestId = null;
  testTitleInput.value = "";
  currentQuestions = [];
  renderQuestionsEditor();
  testEditorModal.hidden = false;
});

function openEditTest(t) {
  editingTestId = t.id;
  testTitleInput.value = t.title;
  currentQuestions = JSON.parse(JSON.stringify(t.questions || []));
  renderQuestionsEditor();
  testEditorModal.hidden = false;
}

function renderQuestionsEditor() {
  testQuestionsList.innerHTML = "";
  currentQuestions.forEach((q, qi) => {
    const block = document.createElement("div");
    block.className = "question-block";

    const qInput = document.createElement("input");
    qInput.type = "text";
    qInput.placeholder = `Вопрос ${qi + 1}`;
    qInput.value = q.q || "";
    qInput.addEventListener("input", () => {
      q.q = qInput.value;
    });
    block.appendChild(qInput);

    if (!q.options || q.options.length === 0) q.options = ["", "", "", ""];

    q.options.forEach((opt, oi) => {
      const row = document.createElement("div");
      row.className = "question-option-row";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `correct-${qi}`;
      radio.checked = q.correct === oi;
      radio.addEventListener("change", () => {
        q.correct = oi;
      });
      row.appendChild(radio);

      const optInput = document.createElement("input");
      optInput.type = "text";
      optInput.placeholder = `Вариант ${oi + 1}`;
      optInput.value = opt;
      optInput.style.flex = "1";
      optInput.addEventListener("input", () => {
        q.options[oi] = optInput.value;
      });
      row.appendChild(optInput);

      block.appendChild(row);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "question-remove-btn";
    removeBtn.textContent = "Удалить вопрос";
    removeBtn.addEventListener("click", () => {
      currentQuestions.splice(qi, 1);
      renderQuestionsEditor();
    });
    block.appendChild(removeBtn);

    testQuestionsList.appendChild(block);
  });
}

addQuestionBtn.addEventListener("click", () => {
  currentQuestions.push({ q: "", options: ["", "", "", ""], correct: 0 });
  renderQuestionsEditor();
});

saveTestBtn.addEventListener("click", async () => {
  const title = testTitleInput.value.trim();
  if (!title) {
    showToast("Укажи название теста.");
    return;
  }
  if (currentQuestions.length === 0) {
    showToast("Добавь хотя бы один вопрос.");
    return;
  }

  const cleanQuestions = currentQuestions
    .map((q) => ({
      q: (q.q || "").trim(),
      options: (q.options || []).map((o) => (o || "").trim()),
      correct: q.correct || 0,
    }))
    .filter((q) => q.q && q.options.filter(Boolean).length >= 2);

  if (cleanQuestions.length === 0) {
    showToast("Заполни вопросы и минимум по два варианта ответа.");
    return;
  }

  const group = allGroupsCache.find((g) => g.id === managingGroupId);
  if (!group) return;
  const tests = [...(group.tests || [])];
  if (editingTestId) {
    const idx = tests.findIndex((t) => t.id === editingTestId);
    if (idx !== -1) tests[idx] = { id: editingTestId, title, questions: cleanQuestions };
  } else {
    tests.push({ id: genId(), title, questions: cleanQuestions });
  }

  try {
    await setDoc(groupRef(managingGroupId), { tests }, { merge: true });
    group.tests = tests;
    renderManageLists(group);
    testEditorModal.hidden = true;
  } catch (e) {
    reportError(e);
  }
});

async function removeTest(id) {
  const ok = confirm("Удалить этот тест?");
  if (!ok) return;
  const group = allGroupsCache.find((g) => g.id === managingGroupId);
  if (!group) return;
  const tests = (group.tests || []).filter((t) => t.id !== id);
  try {
    await setDoc(groupRef(managingGroupId), { tests }, { merge: true });
    group.tests = tests;
    renderManageLists(group);
  } catch (e) {
    reportError(e);
  }
}

closeTestEditor.addEventListener("click", () => {
  testEditorModal.hidden = true;
});

// ---------- Экран ученика: вкладки групп ----------

function renderGroupTabs() {
  const myGroups = new Set(currentUserData.groups || []);
  groupTabsEl.innerHTML = "";

  if (allGroupsCache.length === 0) {
    groupContentEl.innerHTML = '<p class="group-content-empty">Педагог ещё не создал ни одной группы.</p>';
    return;
  }

  allGroupsCache.forEach((g) => {
    const isMember = myGroups.has(g.id);
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "group-tab" + (isMember ? "" : " locked") + (g.id === activeGroupId ? " active" : "");
    tab.textContent = (isMember ? "" : "🔒 ") + g.name;
    if (isMember) {
      tab.addEventListener("click", () => {
        activeGroupId = g.id;
        activeSubTab = "tests";
        renderGroupTabs();
        renderGroupContent();
      });
    } else {
      tab.title = "Ты не состоишь в этой группе — обратись к педагогу";
    }
    groupTabsEl.appendChild(tab);
  });

  const myGroupIds = allGroupsCache.filter((g) => myGroups.has(g.id)).map((g) => g.id);
  if (!activeGroupId || !myGroupIds.includes(activeGroupId)) {
    activeGroupId = myGroupIds[0] || null;
  }
  renderGroupContent();
}

function renderGroupContent() {
  if (!activeGroupId) {
    groupContentEl.innerHTML =
      '<p class="group-content-empty">Педагог пока не добавил тебя ни в одну группу. Как только добавит — здесь появятся материалы.</p>';
    return;
  }

  const group = allGroupsCache.find((g) => g.id === activeGroupId);
  if (!group) {
    groupContentEl.innerHTML = "";
    return;
  }

  const tabs = [
    { id: "tests", label: "🧪 Тесты" },
    { id: "lectures", label: "📖 Лекции" },
    { id: "resources", label: "🔗 Полезные ресурсы" },
  ];

  groupContentEl.innerHTML = `
    <div class="group-content-title">${group.name}</div>
    <div class="sub-tabs">
      ${tabs
        .map(
          (t) =>
            `<button type="button" class="sub-tab${t.id === activeSubTab ? " active" : ""}" data-tab="${t.id}">${t.label}</button>`
        )
        .join("")}
    </div>
    <div id="subTabContent"></div>
  `;

  groupContentEl.querySelectorAll(".sub-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSubTab = btn.dataset.tab;
      renderGroupContent();
    });
  });

  renderSubTabContent(group);
}

function renderSubTabContent(group) {
  const container = document.getElementById("subTabContent");
  if (!container) return;

  if (activeSubTab === "tests") {
    const tests = group.tests || [];
    if (tests.length === 0) {
      container.innerHTML = '<p class="group-content-empty">Тестов пока нет.</p>';
      return;
    }
    container.innerHTML = `<ul class="content-item-list">${tests
      .map(
        (t) =>
          `<li class="content-item" data-id="${t.id}"><div><div class="content-item-title">${t.title}</div><div class="content-item-sub">${(t.questions || []).length} вопрос(ов)</div></div><span class="content-item-arrow">→</span></li>`
      )
      .join("")}</ul>`;
    container.querySelectorAll(".content-item").forEach((el) => {
      el.addEventListener("click", () => openTakeTest(tests.find((t) => t.id === el.dataset.id)));
    });
    return;
  }

  if (activeSubTab === "lectures") {
    const lectures = group.lectures || [];
    if (lectures.length === 0) {
      container.innerHTML = '<p class="group-content-empty">Лекций пока нет.</p>';
      return;
    }
    container.innerHTML = `<ul class="content-item-list">${lectures
      .map(
        (l) =>
          `<li class="content-item" data-id="${l.id}"><div class="content-item-title">${l.title}</div><span class="content-item-arrow">→</span></li>`
      )
      .join("")}</ul>`;
    container.querySelectorAll(".content-item").forEach((el) => {
      el.addEventListener("click", () => openViewLecture(lectures.find((l) => l.id === el.dataset.id)));
    });
    return;
  }

  if (activeSubTab === "resources") {
    const resources = group.resources || [];
    if (resources.length === 0) {
      container.innerHTML = '<p class="group-content-empty">Ссылок пока нет.</p>';
      return;
    }
    container.innerHTML = `<div class="content-item-list">${resources
      .map((r) => `<a class="resource-link" href="${r.url}" target="_blank" rel="noopener">🔗 ${r.label}</a>`)
      .join("")}</div>`;
  }
}

// --- Просмотр лекции (ученик) ---

function openViewLecture(lecture) {
  if (!lecture) return;
  viewLectureTitle.textContent = lecture.title;
  viewLectureBody.textContent = lecture.body || "";

  viewLectureVideo.innerHTML = "";
  if (lecture.videoUrl) {
    const embedUrl = toYouTubeEmbed(lecture.videoUrl);
    if (embedUrl) {
      viewLectureVideo.innerHTML = `<div class="lecture-video-embed"><iframe src="${embedUrl}" allowfullscreen></iframe></div>`;
    } else {
      const a = document.createElement("a");
      a.className = "lecture-video-link";
      a.href = lecture.videoUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "▶️ Открыть видео";
      viewLectureVideo.appendChild(a);
    }
  }

  if (lecture.fileUrl) {
    viewLectureFile.href = lecture.fileUrl;
    viewLectureFile.hidden = false;
  } else {
    viewLectureFile.hidden = true;
  }

  viewLectureModal.hidden = false;
}

closeViewLecture.addEventListener("click", () => {
  viewLectureModal.hidden = true;
});

// --- Прохождение теста (ученик) ---

let activeTakeTest = null;

function openTakeTest(test) {
  if (!test) return;
  activeTakeTest = test;
  takeTestTitle.textContent = test.title;
  takeTestResult.hidden = true;
  takeTestResult.innerHTML = "";
  takeTestForm.hidden = false;
  takeTestForm.innerHTML = "";

  test.questions.forEach((q, qi) => {
    const block = document.createElement("div");
    block.className = "take-test-question";
    const title = document.createElement("div");
    title.className = "take-test-question-title";
    title.textContent = `${qi + 1}. ${q.q}`;
    block.appendChild(title);

    q.options.forEach((opt, oi) => {
      if (!opt) return;
      const label = document.createElement("label");
      label.className = "take-test-option";
      label.innerHTML = `<input type="radio" name="tq${qi}" value="${oi}" required> <span>${opt}</span>`;
      block.appendChild(label);
    });

    takeTestForm.appendChild(block);
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn-primary";
  submitBtn.style.width = "100%";
  submitBtn.textContent = "Проверить ответы";
  takeTestForm.appendChild(submitBtn);

  takeTestModal.hidden = false;
}

takeTestForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!activeTakeTest) return;
  let score = 0;
  activeTakeTest.questions.forEach((q, qi) => {
    const checked = takeTestForm.querySelector(`input[name="tq${qi}"]:checked`);
    if (checked && parseInt(checked.value, 10) === q.correct) score++;
  });
  takeTestForm.hidden = true;
  takeTestResult.hidden = false;
  takeTestResult.innerHTML = `<div class="take-test-result-score">${score} из ${activeTakeTest.questions.length} правильно</div>`;
});

closeTakeTest.addEventListener("click", () => {
  takeTestModal.hidden = true;
});

// ---------- Вход ученика ----------

function enterMainScreen(name, data) {
  currentUserData = data;
  currentUserData.groups = currentUserData.groups || [];
  currentUser = data.name || name;
  activeGroupId = null;
  activeSubTab = "tests";
  userNameEl.textContent = currentUser;
  loginScreen.hidden = true;
  teacherScreen.hidden = true;
  teacherLoginScreen.hidden = true;
  mainScreen.hidden = false;

  getAllGroups()
    .then((groups) => {
      allGroupsCache = groups;
      renderGroupTabs();
    })
    .catch((e) => {
      reportError(e);
    });
}

function showLoginScreen() {
  currentUser = null;
  currentUserData = null;
  mainScreen.hidden = true;
  teacherScreen.hidden = true;
  teacherLoginScreen.hidden = true;
  loginScreen.hidden = false;
  usernameInput.value = "";
  passwordInput.value = "";
  loginError.hidden = true;
  usernameInput.focus();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) return;

  loginError.hidden = true;
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Вход…";

  try {
    const snap = await getDoc(studentRef(username));
    if (!snap.exists()) {
      loginError.hidden = false;
      return;
    }
    const data = snap.data();
    const hash = await sha256Hex(password);
    if (data.passwordHash !== hash) {
      loginError.hidden = false;
      return;
    }
    passwordInput.value = "";
    enterMainScreen(username, data);
    touchLastActive();
  } catch (err) {
    reportError(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});

switchUserBtn.addEventListener("click", showLoginScreen);

// ---------- Панель педагога ----------

async function getAllStudentsData() {
  const snap = await getDocs(studentsCol);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        name: data.name || d.id,
        fullName: data.fullName || "",
        password: data.password || "",
        groups: data.groups || [],
        lastActive: data.lastActive,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

function groupNameById(id) {
  const g = allGroupsCache.find((x) => x.id === id);
  return g ? g.name : id;
}

async function renderTeacherPanel() {
  teacherStats.innerHTML = "";
  teacherTableBody.innerHTML = '<tr><td colspan="5" class="teacher-empty">Загрузка данных…</td></tr>';

  let students;
  let groups;
  try {
    [students, groups] = await Promise.all([getAllStudentsData(), getAllGroups()]);
  } catch (e) {
    console.error(e);
    teacherTableBody.innerHTML =
      '<tr><td colspan="5" class="teacher-empty">Не удалось загрузить данные — проверь интернет-соединение.</td></tr>';
    return;
  }
  allGroupsCache = groups;

  teacherStats.innerHTML = `
    <div class="teacher-stat"><span class="teacher-stat-value">${students.length}</span><span class="teacher-stat-label">учеников</span></div>
    <div class="teacher-stat"><span class="teacher-stat-value">${groups.length}</span><span class="teacher-stat-label">групп</span></div>
  `;

  teacherTableBody.innerHTML = "";

  if (students.length === 0) {
    teacherTableBody.innerHTML =
      '<tr><td colspan="5" class="teacher-empty">Пока нет ни одного ученика — добавь первого выше.</td></tr>';
    return;
  }

  students.forEach((u) => {
    const isStale = u.lastActive && Date.now() - u.lastActive > 14 * 86400000;
    const tr = document.createElement("tr");

    const fullNameTd = document.createElement("td");
    fullNameTd.textContent = u.fullName || "—";
    tr.appendChild(fullNameTd);

    const nameTd = document.createElement("td");
    nameTd.textContent = u.name;
    tr.appendChild(nameTd);

    const groupsTd = document.createElement("td");
    groupsTd.className = "teacher-groups-cell";
    if (u.groups.length === 0) {
      groupsTd.innerHTML = '<span class="teacher-group-tag">нет групп</span>';
    } else {
      u.groups.forEach((gid) => {
        const tag = document.createElement("span");
        tag.className = "teacher-group-tag";
        tag.textContent = groupNameById(gid);
        groupsTd.appendChild(tag);
      });
    }
    tr.appendChild(groupsTd);

    const activeTd = document.createElement("td");
    activeTd.className = isStale ? "teacher-stale" : "";
    activeTd.textContent = formatRelativeDate(u.lastActive);
    tr.appendChild(activeTd);

    const actionsTd = document.createElement("td");
    actionsTd.className = "no-print";

    const editGroupsBtn = document.createElement("button");
    editGroupsBtn.type = "button";
    editGroupsBtn.className = "teacher-edit-groups";
    editGroupsBtn.setAttribute("aria-label", "Изменить группы");
    editGroupsBtn.textContent = "👥";
    editGroupsBtn.addEventListener("click", () => openEditGroups(u.name, u.groups));
    actionsTd.appendChild(editGroupsBtn);

    const resetPwdBtn = document.createElement("button");
    resetPwdBtn.type = "button";
    resetPwdBtn.className = "teacher-reset";
    resetPwdBtn.setAttribute("aria-label", "Сбросить пароль");
    resetPwdBtn.textContent = "🔑";
    resetPwdBtn.addEventListener("click", () => resetStudentPassword(u.name));
    actionsTd.appendChild(resetPwdBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "teacher-delete";
    deleteBtn.setAttribute("aria-label", "Удалить ученика");
    deleteBtn.textContent = "🗑";
    deleteBtn.addEventListener("click", () => deleteStudent(u.name));
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(actionsTd);
    teacherTableBody.appendChild(tr);
  });
}

async function deleteStudent(name) {
  const ok = confirm(`Удалить ученика «${name}» и весь его прогресс без возможности восстановления?`);
  if (!ok) return;
  try {
    await deleteDoc(studentRef(name));
  } catch (e) {
    reportError(e);
    return;
  }
  renderTeacherPanel();
}

async function resetStudentPassword(name) {
  const newPassword = prompt(`Новый пароль для «${name}»:`);
  if (!newPassword || !newPassword.trim()) return;
  const clean = newPassword.trim();
  try {
    const passwordHash = await sha256Hex(clean);
    await setDoc(studentRef(name), { passwordHash, password: clean }, { merge: true });
    alert(`Готово. Новый пароль для «${name}»: ${clean}`);
    renderTeacherPanel();
  } catch (e) {
    reportError(e);
  }
}

function openEditGroups(name, currentGroups) {
  editingStudentName = name;
  editGroupsName.textContent = name;
  editGroupsCheckboxes.innerHTML = "";

  if (allGroupsCache.length === 0) {
    editGroupsCheckboxes.innerHTML = '<p class="group-checkboxes-empty">Групп пока нет.</p>';
  } else {
    const memberSet = new Set(currentGroups);
    allGroupsCache.forEach((g) => {
      const label = document.createElement("label");
      label.className = "group-checkbox-item";
      const checked = memberSet.has(g.id) ? "checked" : "";
      label.innerHTML = `<input type="checkbox" value="${g.id}" ${checked}> ${g.name}`;
      editGroupsCheckboxes.appendChild(label);
    });
  }

  editGroupsModal.hidden = false;
}

closeEditGroups.addEventListener("click", () => {
  editGroupsModal.hidden = true;
});

saveEditGroups.addEventListener("click", async () => {
  const checked = Array.from(editGroupsCheckboxes.querySelectorAll('input[type="checkbox"]:checked'))
    .map((el) => el.value);
  try {
    await setDoc(studentRef(editingStudentName), { groups: checked }, { merge: true });
    editGroupsModal.hidden = true;
    renderTeacherPanel();
  } catch (e) {
    reportError(e);
  }
});

addStudentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fullName = newStudentFullName.value.trim();
  const username = newStudentUsername.value.trim();
  const password = newStudentPassword.value.trim();
  addStudentMessage.hidden = true;
  if (!fullName || !username || !password) return;

  const selectedGroups = Array.from(newStudentGroups.querySelectorAll('input[type="checkbox"]:checked'))
    .map((el) => el.value);

  try {
    const ref = studentRef(username);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      addStudentMessage.className = "login-error";
      addStudentMessage.textContent = "Такой логин уже существует.";
      addStudentMessage.hidden = false;
      return;
    }

    const passwordHash = await sha256Hex(password);
    await setDoc(ref, {
      name: username,
      fullName,
      passwordHash,
      password,
      groups: selectedGroups,
      lastActive: null,
    });

    addStudentMessage.className = "add-student-success";
    addStudentMessage.textContent = `Готово! Логин: ${username} · Пароль: ${password}`;
    addStudentMessage.hidden = false;
    newStudentFullName.value = "";
    newStudentUsername.value = "";
    newStudentPassword.value = "";
    renderStudentGroupCheckboxes();
    renderTeacherPanel();
  } catch (err) {
    console.error(err);
    addStudentMessage.className = "login-error";
    addStudentMessage.textContent = "Не удалось создать — проверь интернет-соединение.";
    addStudentMessage.hidden = false;
  }
});

generatePasswordBtn.addEventListener("click", () => {
  const words = ["синий", "зелёный", "быстрый", "яркий", "умный", "смелый", "тихий", "крепкий"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  newStudentPassword.value = word + num;
});

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[;"\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

exportPasswordsBtn.addEventListener("click", async () => {
  const selected = exportGroupSelect.value;
  let students;
  try {
    students = await getAllStudentsData();
  } catch (e) {
    reportError(e);
    return;
  }

  const filtered = selected === "__all__" ? students : students.filter((u) => u.groups.includes(selected));

  if (filtered.length === 0) {
    showToast("В этой группе пока нет учеников.");
    return;
  }

  const rows = [["ФИО", "Логин", "Пароль"]];
  filtered.forEach((u) => {
    rows.push([u.fullName || "", u.name, u.password || "(сбросьте пароль, чтобы узнать)"]);
  });

  const csv = "﻿" + rows.map((r) => r.map(csvEscape).join(";")).join("\r\n");
  const groupLabel = selected === "__all__" ? "все" : groupNameById(selected);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Пароли — ${groupLabel}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

teacherPanelBtn.addEventListener("click", () => {
  loginScreen.hidden = true;
  if (sessionStorage.getItem("teacherAuthed") === "1") {
    teacherScreen.hidden = false;
    renderGroupsManagement();
    renderTeacherPanel();
  } else {
    teacherUsernameInput.value = "";
    teacherPasswordInput.value = "";
    teacherLoginError.hidden = true;
    teacherLoginScreen.hidden = false;
  }
});

teacherLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = teacherUsernameInput.value.trim();
  const password = teacherPasswordInput.value;
  if (!username || !password) return;

  teacherLoginError.hidden = true;
  const submitBtn = teacherLoginForm.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Вход…";

  try {
    const ok = await verifyTeacherAuth(username, password);
    if (!ok) {
      teacherLoginError.hidden = false;
      return;
    }
    sessionStorage.setItem("teacherAuthed", "1");
    teacherPasswordInput.value = "";
    teacherLoginScreen.hidden = true;
    teacherScreen.hidden = false;
    renderGroupsManagement();
    renderTeacherPanel();
  } catch (err) {
    reportError(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});

closeTeacherLoginBtn.addEventListener("click", () => {
  teacherLoginScreen.hidden = true;
  loginScreen.hidden = false;
});

closeTeacherBtn.addEventListener("click", () => {
  teacherScreen.hidden = true;
  loginScreen.hidden = false;
});

printTeacherBtn.addEventListener("click", () => {
  window.print();
});
