// main.js - управление index.html и teacher.html (localStorage)
(function(){
  const LS_DEPS = 'au_deps';
  const LS_TEACH = 'au_teachers';
  const LS_SCHED = 'au_schedules';

  // helpers
  function load(key){ try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e){ return null; } }
  function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
  function uid(){ return Date.now() + Math.floor(Math.random()*1000); }
  function el(id){ return document.getElementById(id); }
  function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // ensure sample data if empty
  function ensureSample(){
    if (!load(LS_DEPS)){
      save(LS_DEPS, [
        { id: 1, name: "Кафедра информационных систем" },
        { id: 2, name: "Кафедра математики" }
      ]);
    }
    if (!load(LS_TEACH)){
      save(LS_TEACH, [
        { id: 11, name: "Иванов И.И.", departmentId: 1 },
        { id: 12, name: "Петров П.П.", departmentId: 2 }
      ]);
    }
    if (!load(LS_SCHED)){
      save(LS_SCHED, [
        { id:111, teacherId:11, semester:1, week:"1", day:"Понедельник", time:"09:00-10:30", subject:"Базы данных", room:"А-302", group:"ИС-101" },
        { id:112, teacherId:11, semester:2, week:"2", day:"Среда", time:"11:00-12:30", subject:"Алгоритмы", room:"А-305", group:"ИС-102, ИС-103" },
        { id:121, teacherId:12, semester:1, week:"1", day:"Вторник", time:"10:00-11:30", subject:"Математический анализ", room:"Б-201", group:"ММ-201" }
      ]);
    }
  }
  ensureSample();

  // INDEX PAGE
  function renderIndex(){
    const deps = load(LS_DEPS) || [];
    const teachers = load(LS_TEACH) || [];
    const depsCont = el('departments');
    const teachersCont = el('teachers');
    const teachersTitle = el('teachers-title');
    if (!depsCont) return;

    depsCont.innerHTML = '';
    deps.forEach(d=>{
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<strong>${escapeHtml(d.name)}</strong><div class="meta">ID: ${d.id}</div>`;
      card.addEventListener('click', ()=> showTeachers(d.id,d.name));
      depsCont.appendChild(card);
    });

    function showTeachers(depId, depName){
      teachersTitle.textContent = `Преподаватели — ${depName}`;
      teachersCont.innerHTML = '';
      const list = teachers.filter(t=>t.departmentId===depId);
      if (list.length===0) teachersCont.innerHTML = '<div class="card">Преподавателей нет</div>';
      list.forEach(t=>{
        const elCard = document.createElement('div');
        elCard.className = 'card';
        elCard.innerHTML = `<strong>${escapeHtml(t.name)}</strong><div class="meta">Кафедра: ${escapeHtml(depName)}</div>
          <div style="margin-top:8px"><a class="small" href="teacher.html?id=${t.id}">Открыть расписание</a></div>`;
        teachersCont.appendChild(elCard);
      });
      teachersCont.scrollIntoView({behavior:'smooth'});
    }

    if (deps.length>0) showTeachers(deps[0].id,deps[0].name);
  }

  // TEACHER PAGE
  function renderTeacher(){
    const params = new URLSearchParams(location.search);
    const tid = parseInt(params.get('id'));
    if (!tid) return;
    const teachers = load(LS_TEACH) || [];
    const deps = load(LS_DEPS) || [];
    const schedules = load(LS_SCHED) || [];

    const teacher = teachers.find(t=>t.id===tid);
    if (!teacher) {
      if (el('teacher-name')) el('teacher-name').textContent = 'Преподаватель не найден';
      return;
    }
    const dep = deps.find(d=>d.id===teacher.departmentId);
    if (el('teacher-name')) el('teacher-name').textContent = teacher.name;
    if (el('teacher-dep')) el('teacher-dep').textContent = dep ? dep.name : '';

    // filters
    const filterWeek = el('filter-week');
    const filterDay = el('filter-day');
    const filterGroup = el('filter-group');
    const filterClear = el('filter-clear');
    const scheduleContainer = el('schedule-container');

    let activeSemester = 1;
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        tabButtons.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        activeSemester = parseInt(btn.dataset.sem,10);
        render();
      });
    });

    function matchesWeek(weekVal, cellWeek){
      if (weekVal === 'all') return true;
      if (weekVal === 'odd') return (parseInt(cellWeek) % 2 === 1);
      if (weekVal === 'even') return (parseInt(cellWeek) % 2 === 0);
      return cellWeek === weekVal;
    }

    function render(){
      const w = filterWeek ? filterWeek.value : 'all';
      const d = filterDay ? filterDay.value : 'all';
      const g = filterGroup ? filterGroup.value.trim().toLowerCase() : '';

      let rows = (schedules || []).filter(s => s.teacherId === tid && (s.semester === activeSemester));
      rows = rows.filter(r => matchesWeek(w, r.week));
      if (d !== 'all') rows = rows.filter(r => r.day === d);
      if (g) rows = rows.filter(r => (r.group||'').toLowerCase().includes(g));

      scheduleContainer.innerHTML = '';
      const table = document.createElement('table');
      table.className = 'ais-table';
      table.innerHTML = `<thead><tr>
        <th>Неделя</th><th>День</th><th>Время</th><th>Дисциплина</th><th>Аудитория</th><th>Группа</th>
      </tr></thead>`;
      const tbody = document.createElement('tbody');

      if (rows.length===0){
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">Расписание отсутствует</td></tr>`;
      } else {
        // sort by week, day, time
        const dayOrder = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
        rows.sort((a,b)=>{
          const wa = isNaN(parseInt(a.week))?0:parseInt(a.week);
          const wb = isNaN(parseInt(b.week))?0:parseInt(b.week);
          if (wa !== wb) return wa - wb;
          const da = dayOrder.indexOf(a.day), db = dayOrder.indexOf(b.day);
          if (da !== db) return da - db;
          return a.time.localeCompare(b.time);
        });
        rows.forEach(r=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${escapeHtml(r.week||'')}</td>
            <td>${escapeHtml(r.day||'')}</td>
            <td>${escapeHtml(r.time||'')}</td>
            <td class="subject-cell">${escapeHtml(r.subject||'')}</td>
            <td>${escapeHtml(r.room||'')}</td>
            <td>${escapeHtml(r.group||'')}</td>`;
          tbody.appendChild(tr);
        });
      }
      table.appendChild(tbody);
      scheduleContainer.appendChild(table);
    }

    if (filterWeek) filterWeek.addEventListener('change', render);
    if (filterDay) filterDay.addEventListener('change', render);
    if (filterGroup) filterGroup.addEventListener('input', render);
    if (filterClear) filterClear.addEventListener('click', ()=>{
      filterWeek.value = 'all'; filterDay.value = 'all'; filterGroup.value = '';
      render();
    });

    render();
  }

  // initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', ()=>{
    if (document.querySelector('#departments')) renderIndex();
    if (document.querySelector('#teacher-name')) renderTeacher();
  });
})();
