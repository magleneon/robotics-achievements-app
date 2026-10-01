// Учебная платформа: группы, темы и учёт учеников.
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

const NETWORK_ERROR_TOAST = "⚠️ Не удалось связаться с базой данных — проверь интернет-соединение.";

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

const manageTopicsModal = document.getElementById("manageTopicsModal");
const closeManageTopics = document.getElementById("closeManageTopics");
const manageTopicsName = document.getElementById("manageTopicsName");
const topicsListEl = document.getElementById("topicsList");
const addTopicBtn = document.getElementById("addTopicBtn");

let currentUser = null;
let currentUserData = null; // кэш документа текущего ученика из Firestore
let allGroupsCache = [];    // кэш списка всех групп (обновляется при входе/открытии панели)
let activeGroupId = null;
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
  setDoc(studentRef(name), partial, { merge: true }).catch((err) => {
    console.error("Firestore save error:", err);
    showToast(NETWORK_ERROR_TOAST);
  });
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

// ---------- Группы ----------

async function getAllGroups() {
  const snap = await getDocs(groupsCol);
  return snap.docs
    .map((d) => ({ id: d.id, name: d.data().name || d.id, topics: d.data().topics || [] }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

async function createGroup(name) {
  const ref = groupRef(name);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return { ok: false, reason: "exists" };
  }
  await setDoc(ref, { name, topics: [] });
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
    console.error(e);
    showToast(NETWORK_ERROR_TOAST);
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

      const topicsBtn = document.createElement("button");
      topicsBtn.type = "button";
      topicsBtn.textContent = "⚙️";
      topicsBtn.setAttribute("aria-label", `Занятия группы ${g.name}`);
      topicsBtn.addEventListener("click", () => openManageTopics(g.id));
      pill.appendChild(topicsBtn);

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

// ---------- Занятия внутри группы ----------

let managingGroupId = null;

function openManageTopics(groupId) {
  managingGroupId = groupId;
  const group = allGroupsCache.find((g) => g.id === groupId);
  if (!group) return;
  manageTopicsName.textContent = group.name;
  renderTopicsList(group.topics);
  manageTopicsModal.hidden = false;
}

function renderTopicsList(topics) {
  topicsListEl.innerHTML = "";
  if (!topics || topics.length === 0) {
    topicsListEl.innerHTML = '<p class="group-checkboxes-empty">Занятий пока нет.</p>';
    return;
  }
  topics.forEach((topic, index) => {
    const pill = document.createElement("span");
    pill.className = "group-pill";
    pill.innerHTML = `${topic} `;
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "✕";
    delBtn.setAttribute("aria-label", `Удалить ${topic}`);
    delBtn.addEventListener("click", () => removeTopic(index));
    pill.appendChild(delBtn);
    topicsListEl.appendChild(pill);
  });
}

async function addTopic() {
  const group = allGroupsCache.find((g) => g.id === managingGroupId);
  if (!group) return;
  addTopicBtn.disabled = true;
  const topics = [...(group.topics || []), `Занятие ${(group.topics || []).length + 1}`];
  try {
    await setDoc(groupRef(managingGroupId), { topics }, { merge: true });
    group.topics = topics;
    renderTopicsList(topics);
  } catch (e) {
    console.error(e);
    showToast(NETWORK_ERROR_TOAST);
  } finally {
    addTopicBtn.disabled = false;
  }
}

async function removeTopic(index) {
  const group = allGroupsCache.find((g) => g.id === managingGroupId);
  if (!group) return;
  const topics = (group.topics || []).filter((_, i) => i !== index);
  try {
    await setDoc(groupRef(managingGroupId), { topics }, { merge: true });
    group.topics = topics;
    renderTopicsList(topics);
  } catch (e) {
    console.error(e);
    showToast(NETWORK_ERROR_TOAST);
  }
}

addTopicBtn.addEventListener("click", addTopic);

closeManageTopics.addEventListener("click", () => {
  manageTopicsModal.hidden = true;
});

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
      '<p class="group-content-empty">Педагог пока не добавил тебя ни в одну группу. Как только добавит — здесь появятся темы занятий.</p>';
    return;
  }

  const group = allGroupsCache.find((g) => g.id === activeGroupId);
  if (!group) {
    groupContentEl.innerHTML = "";
    return;
  }

  if (!group.topics || group.topics.length === 0) {
    groupContentEl.innerHTML = `
      <div class="group-content-title">${group.name}</div>
      <p class="group-content-empty">Темы для этой группы пока не добавлены педагогом.</p>
    `;
    return;
  }

  groupContentEl.innerHTML = `
    <div class="group-content-title">${group.name}</div>
    <ul class="group-topics-list">
      ${group.topics.map((t) => `<li>${t}</li>`).join("")}
    </ul>
  `;
}

// ---------- Вход ученика ----------

function enterMainScreen(name, data) {
  currentUserData = data;
  currentUserData.groups = currentUserData.groups || [];
  currentUser = data.name || name;
  activeGroupId = null;
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
      console.error(e);
      showToast(NETWORK_ERROR_TOAST);
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
    console.error(err);
    showToast(NETWORK_ERROR_TOAST);
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
        note: data.note || "",
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
  teacherTableBody.innerHTML = '<tr><td colspan="6" class="teacher-empty">Загрузка данных…</td></tr>';

  let students;
  let groups;
  try {
    [students, groups] = await Promise.all([getAllStudentsData(), getAllGroups()]);
  } catch (e) {
    console.error(e);
    teacherTableBody.innerHTML =
      '<tr><td colspan="6" class="teacher-empty">Не удалось загрузить данные — проверь интернет-соединение.</td></tr>';
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
      '<tr><td colspan="6" class="teacher-empty">Пока нет ни одного ученика — добавь первого выше.</td></tr>';
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

    const noteTd = document.createElement("td");
    noteTd.className = "no-print";
    const noteTextarea = document.createElement("textarea");
    noteTextarea.className = "teacher-note";
    noteTextarea.placeholder = "Заметка…";
    noteTextarea.value = u.note;
    noteTextarea.addEventListener("blur", () => setUserNote(u.name, noteTextarea.value));
    noteTd.appendChild(noteTextarea);
    tr.appendChild(noteTd);

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
    console.error(e);
    showToast(NETWORK_ERROR_TOAST);
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
    console.error(e);
    showToast(NETWORK_ERROR_TOAST);
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
    console.error(e);
    showToast(NETWORK_ERROR_TOAST);
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
      note: "",
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
    console.error(e);
    showToast(NETWORK_ERROR_TOAST);
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
    console.error(err);
    showToast(NETWORK_ERROR_TOAST);
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
