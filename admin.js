// admin.js - админка с логином admin/1234, localStorage
(function(){
  const ADMIN_LOGIN = 'admin';
  const ADMIN_PASS = '1234';

  const LS_DEPS = 'au_deps';
  const LS_TEACH = 'au_teachers';
  const LS_SCHED = 'au_schedules';

  const el = id => document.getElementById(id);
  const loginBox = el('login-box');
  const adminPanel = el('admin-panel');
  const loginError = el('login-error');
  const btnLogin = el('btn-login');
  const btnInit = el('btn-init');
  const btnLogout = el('btn-logout');

  const depsAdmin = el('deps-admin');
  const teachersAdmin = el('teachers-admin');
  const schedulesAdmin = el('schedules-admin');

  const modal = el('modal');
  const modalContent = el('modal-content');
  const modalClose = el('modal-close');
  modalClose.onclick = ()=> closeModal();

  function load(key){ try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e){ return null; } }
  function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
  function uid(){ return Date.now() + Math.floor(Math.random()*1000); }
  function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // demo
  function initDemo(){
    const deps = [
      { id:1, name:"Кафедра информационных систем" },
      { id:2, name:"Кафедра математики" }
    ];
    const teachers = [
      { id:11, name:"Иванов И.И.", departmentId:1 },
      { id:12, name:"Ермакова Г.Т.", departmentId:1 },
      { id:21, name:"Петров П.П.", departmentId:2 }
    ];
    const schedules = [
      { id:111, teacherId:11, semester:1, week:'1', day:'Понедельник', time:'09:00-10:30', subject:'Базы данных', room:'А-302', group:'ИС-101' },
      { id:112, teacherId:11, semester:2, week:'2', day:'Среда', time:'11:00-12:30', subject:'Алгоритмы', room:'А-305', group:'ИС-102, ИС-103' },
      { id:121, teacherId:12, semester:1, week:'1', day:'Вторник', time:'10:00-11:30', subject:'ОПиП', room:'А-301', group:'ИС-103' }
    ];
    save(LS_DEPS,deps); save(LS_TEACH,teachers); save(LS_SCHED,schedules);
    renderAll();
  }

  // login
  btnLogin.addEventListener('click', ()=>{
    const login = el('login').value.trim();
    const pass = el('password').value;
    if (login === ADMIN_LOGIN && pass === ADMIN_PASS){
      loginBox.style.display = 'none';
      adminPanel.style.display = 'block';
      loginError.textContent = '';
      renderAll();
    } else {
      loginError.textContent = 'Неверный логин или пароль';
    }
  });

  btnInit.addEventListener('click', ()=>{
    if (confirm('Заполнить демо-данными? Это перезапишет текущие данные.')) initDemo();
  });

  btnLogout.addEventListener('click', ()=>{
    adminPanel.style.display = 'none';
    loginBox.style.display = 'block';
    el('login').value=''; el('password').value='';
  });

  // render helpers
  function renderAll(){
    renderDeps(); renderTeachers(); renderSchedules();
  }

  function renderDeps(){
    const deps = load(LS_DEPS) || [];
    depsAdmin.innerHTML = '';
    if (!deps.length) depsAdmin.innerHTML = '<div>Кафедр нет</div>';
    deps.forEach(d=>{
      const div = document.createElement('div'); div.className='admin-item';
      div.innerHTML = `<div><strong>${escapeHtml(d.name)}</strong><div class="meta">ID: ${d.id}</div></div>
        <div class="admin-actions">
          <button class="small" onclick="editDep(${d.id})">Ред.</button>
          <button class="small" onclick="delDep(${d.id})">Удалить</button>
        </div>`;
      depsAdmin.appendChild(div);
    });
  }

  function renderTeachers(){
    const teachers = load(LS_TEACH) || [];
    const deps = load(LS_DEPS) || [];
    teachersAdmin.innerHTML = '';
    if (!teachers.length) teachersAdmin.innerHTML = '<div>Преподавателей нет</div>';
    teachers.forEach(t=>{
      const dep = deps.find(d=>d.id===t.departmentId);
      const div = document.createElement('div'); div.className='admin-item';
      div.innerHTML = `<div><strong>${escapeHtml(t.name)}</strong><div class="meta">${dep?escapeHtml(dep.name):'—'}</div></div>
        <div class="admin-actions">
          <button class="small" onclick="editTeacher(${t.id})">Ред.</button>
          <button class="small" onclick="delTeacher(${t.id})">Удалить</button>
        </div>`;
      teachersAdmin.appendChild(div);
    });
  }

  function renderSchedules(){
    const schedules = load(LS_SCHED) || [];
    const teachers = load(LS_TEACH) || [];
    schedulesAdmin.innerHTML = '';
    if (!schedules.length) schedulesAdmin.innerHTML = '<div>Расписаний нет</div>';
    schedules.forEach(s=>{
      const teacher = teachers.find(t=>t.id===s.teacherId);
      const div = document.createElement('div'); div.className='admin-item';
      div.innerHTML = `<div>
        <strong>${teacher?escapeHtml(teacher.name):'—'}</strong>
        <div class="meta">${s.semester} сем. • ${escapeHtml(s.week)} • ${escapeHtml(s.day)} • ${escapeHtml(s.time)} • ${escapeHtml(s.subject)} • ${escapeHtml(s.room)} • ${escapeHtml(s.group||'')}</div>
      </div>
      <div class="admin-actions">
        <button class="small" onclick="editSchedule(${s.id})">Ред.</button>
        <button class="small" onclick="delSchedule(${s.id})">Удалить</button>
      </div>`;
      schedulesAdmin.appendChild(div);
    });
  }

  // export functions for modal buttons
  window.editDep = function(id){
    const deps = load(LS_DEPS) || [];
    const d = deps.find(x=>x.id===id);
    if (!d) return alert('Не найдено');
    openModal(`<h3>Редактировать кафедру</h3>
      <label>Название</label><input id="m-dep-name" value="${escapeHtml(d.name)}" />
      <div style="display:flex;gap:8px"><button class="btn" onclick="saveDep(${id})">Сохранить</button><button class="btn ghost" onclick="closeModal()">Отмена</button></div>`);
  };

  window.delDep = function(id){
    if (!confirm('Удалить кафедру? Преподаватели останутся, но потеряют связь с кафедрой.')) return;
    let deps = load(LS_DEPS) || [];
    deps = deps.filter(x=>x.id!==id);
    save(LS_DEPS,deps);
    renderAll();
  };

  window.editTeacher = function(id){
    const teachers = load(LS_TEACH) || [];
    const deps = load(LS_DEPS) || [];
    const t = teachers.find(x=>x.id===id);
    if (!t) return alert('Не найдено');
    let options = '<option value="">--выберите--</option>';
    deps.forEach(d=> options += `<option value="${d.id}" ${d.id===t.departmentId?'selected':''}>${escapeHtml(d.name)}</option>`);
    openModal(`<h3>Редактировать преподавателя</h3>
      <label>ФИО</label><input id="m-teacher-name" value="${escapeHtml(t.name)}" />
      <label>Кафедра</label><select id="m-teacher-dep">${options}</select>
      <div style="display:flex;gap:8px"><button class="btn" onclick="saveTeacher(${id})">Сохранить</button><button class="btn ghost" onclick="closeModal()">Отмена</button></div>`);
  };

  window.delTeacher = function(id){
    if (!confirm('Удалить преподавателя и его расписание?')) return;
    let teachers = load(LS_TEACH) || [];
    teachers = teachers.filter(x=>x.id!==id);
    save(LS_TEACH,teachers);
    let schedules = load(LS_SCHED) || [];
    schedules = schedules.filter(s=>s.teacherId!==id);
    save(LS_SCHED,schedules);
    renderAll();
  };

  window.editSchedule = function(id){
    const schedules = load(LS_SCHED) || [];
    const teachers = load(LS_TEACH) || [];
    const s = schedules.find(x=>x.id===id);
    if (!s) return alert('Не найдено');
    let tOptions = '<option value="">--выберите--</option>';
    teachers.forEach(t=> tOptions += `<option value="${t.id}" ${t.id===s.teacherId?'selected':''}>${escapeHtml(t.name)}</option>`);
    openModal(`<h3>Редактировать занятие</h3>
      <label>Преподаватель</label><select id="m-s-teacher">${tOptions}</select>
      <label>Семестр</label><select id="m-s-sem"><option value="1"${s.semester===1?' selected':''}>1</option><option value="2"${s.semester===2?' selected':''}>2</option></select>
      <label>Неделя (например 1 или 2, или odd/even)</label><input id="m-s-week" value="${escapeHtml(s.week)}" />
      <label>День</label><select id="m-s-day">
        <option${s.day==='Понедельник'?' selected':''}>Понедельник</option>
        <option${s.day==='Вторник'?' selected':''}>Вторник</option>
        <option${s.day==='Среда'?' selected':''}>Среда</option>
        <option${s.day==='Четверг'?' selected':''}>Четверг</option>
        <option${s.day==='Пятница'?' selected':''}>Пятница</option>
        <option${s.day==='Суббота'?' selected':''}>Суббота</option>
      </select>
      <label>Время</label><input id="m-s-time" value="${escapeHtml(s.time)}" />
      <label>Дисциплина</label><input id="m-s-subject" value="${escapeHtml(s.subject)}" />
      <label>Аудитория</label><input id="m-s-room" value="${escapeHtml(s.room)}" />
      <label>Группа (через запятую)</label><input id="m-s-group" value="${escapeHtml(s.group||'')}" />
      <div style="display:flex;gap:8px"><button class="btn" onclick="saveSchedule(${id})">Сохранить</button><button class="btn ghost" onclick="closeModal()">Отмена</button></div>`);
  };

  window.delSchedule = function(id){
    if (!confirm('Удалить занятие?')) return;
    let schedules = load(LS_SCHED) || [];
    schedules = schedules.filter(x=>x.id!==id);
    save(LS_SCHED,schedules);
    renderAll();
  };

  // modal helpers
  function openModal(html){
    modalContent.innerHTML = html;
    modal.style.display = 'flex';
  }
  function closeModal(){
    modal.style.display = 'none';
    modalContent.innerHTML = '';
  }
  window.closeModal = closeModal;

  // save functions
  window.saveDep = function(id){
    const name = el('m-dep-name').value.trim();
    if (!name) return alert('Введите название');
    const deps = load(LS_DEPS) || [];
    const idx = deps.findIndex(x=>x.id===id);
    if (idx>=0){ deps[idx].name = name; save(LS_DEPS,deps); }
    closeModal(); renderAll();
  };

  window.saveTeacher = function(id){
    const name = el('m-teacher-name').value.trim();
    const depId = parseInt(el('m-teacher-dep').value) || null;
    if (!name) return alert('Введите ФИО');
    const teachers = load(LS_TEACH) || [];
    const idx = teachers.findIndex(x=>x.id===id);
    if (idx>=0){ teachers[idx].name = name; teachers[idx].departmentId = depId; save(LS_TEACH,teachers); }
    closeModal(); renderAll();
  };

  window.saveSchedule = function(id){
    const teacherId = parseInt(el('m-s-teacher').value) || null;
    const semester = parseInt(el('m-s-sem').value) || 1;
    const week = el('m-s-week').value.trim();
    const day = el('m-s-day').value;
    const time = el('m-s-time').value.trim();
    const subject = el('m-s-subject').value.trim();
    const room = el('m-s-room').value.trim();
    const group = el('m-s-group').value.trim();
    if (!teacherId || !day || !time) return alert('Заполните обязательные поля');
    const schedules = load(LS_SCHED) || [];
    const idx = schedules.findIndex(x=>x.id===id);
    if (idx>=0){
      schedules[idx] = { id, teacherId, semester, week, day, time, subject, room, group };
      save(LS_SCHED,schedules);
    }
    closeModal(); renderAll();
  };

  // add new
  document.getElementById('btn-add-dep').addEventListener('click', ()=>{
    openModal(`<h3>Добавить кафедру</h3>
      <label>Название</label><input id="m-new-dep" />
      <div style="display:flex;gap:8px"><button class="btn" onclick="addDep()">Добавить</button><button class="btn ghost" onclick="closeModal()">Отмена</button></div>`);
  });
  window.addDep = function(){
    const name = el('m-new-dep').value.trim();
    if (!name) return alert('Введите название');
    const deps = load(LS_DEPS) || [];
    deps.push({ id: uid(), name });
    save(LS_DEPS,deps); closeModal(); renderAll();
  };

  document.getElementById('btn-add-teacher').addEventListener('click', ()=>{
    const deps = load(LS_DEPS) || [];
    if (!deps.length) return alert('Сначала добавьте кафедру');
    let options = deps.map(d=>`<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
    openModal(`<h3>Добавить преподавателя</h3>
      <label>ФИО</label><input id="m-new-teacher" />
      <label>Кафедра</label><select id="m-new-teacher-dep">${options}</select>
      <div style="display:flex;gap:8px"><button class="btn" onclick="addTeacher()">Добавить</button><button class="btn ghost" onclick="closeModal()">Отмена</button></div>`);
  });
  window.addTeacher = function(){
    const name = el('m-new-teacher').value.trim();
    const depId = parseInt(el('m-new-teacher-dep').value) || null;
    if (!name) return alert('Введите ФИО');
    const teachers = load(LS_TEACH) || [];
    teachers.push({ id: uid(), name, departmentId: depId });
    save(LS_TEACH,teachers); closeModal(); renderAll();
  };

  document.getElementById('btn-add-schedule').addEventListener('click', ()=>{
    const teachers = load(LS_TEACH) || [];
    if (!teachers.length) return alert('Сначала добавьте преподавателя');
    let options = teachers.map(t=>`<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    openModal(`<h3>Добавить занятие</h3>
      <label>Преподаватель</label><select id="m-new-s-teacher">${options}</select>
      <label>Семестр</label><select id="m-new-s-sem"><option value="1">1</option><option value="2">2</option></select>
      <label>Неделя (1/2/odd/even)</label><input id="m-new-s-week" placeholder="1" />
      <label>День</label><select id="m-new-s-day"><option>Понедельник</option><option>Вторник</option><option>Среда</option><option>Четверг</option><option>Пятница</option><option>Суббота</option></select>
      <label>Время</label><input id="m-new-s-time" placeholder="09:00-10:30" />
      <label>Дисциплина</label><input id="m-new-s-subject" />
      <label>Аудитория</label><input id="m-new-s-room" />
      <label>Группа (через запятую)</label><input id="m-new-s-group" />
      <div style="display:flex;gap:8px"><button class="btn" onclick="addSchedule()">Добавить</button><button class="btn ghost" onclick="closeModal()">Отмена</button></div>`);
  });
  window.addSchedule = function(){
    const teacherId = parseInt(el('m-new-s-teacher').value) || null;
    const semester = parseInt(el('m-new-s-sem').value) || 1;
    const week = el('m-new-s-week').value.trim() || '1';
    const day = el('m-new-s-day').value;
    const time = el('m-new-s-time').value.trim();
    const subject = el('m-new-s-subject').value.trim();
    const room = el('m-new-s-room').value.trim();
    const group = el('m-new-s-group').value.trim();
    if (!teacherId || !day || !time) return alert('Заполните обязательные поля');
    const schedules = load(LS_SCHED) || [];
    schedules.push({ id: uid(), teacherId, semester, week, day, time, subject, room, group });
    save(LS_SCHED,schedules); closeModal(); renderAll();
  };

  // initial render if needed
  // keep admin panel hidden until login
})();
