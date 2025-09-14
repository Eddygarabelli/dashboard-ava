
import { supabase } from './supabaseClient.js';
import { qs, qsa } from './util.js';

export function bindCoursesTab(renderCursos, openCreateCourse){
  qsa('.btn[data-target="cursos-dashboard"]').forEach(btn=>{
    btn.addEventListener('click', renderCursos);
  });
  qs('#btn-novo-curso')?.addEventListener('click', openCreateCourse);
}

export async function renderCursos(openEditCourse, openEnrollPage){
  const grid = qs('#cursos-grid');
  grid.innerHTML = '<div class="center">Carregando cursos...</div>';
  try{
    const { data, error } = await supabase.from('courses').select('id, name, label, description, created_at').order('created_at', { ascending:false });
    if (error) throw error;
    if (!data?.length){ grid.innerHTML = '<div class="center">Nenhum curso cadastrado.</div>'; return; }
    grid.innerHTML = data.map(c => `
      <div class="card" style="position:relative">
        ${c.label ? `<span class="badge" style="position:absolute; right:12px; top:12px">${c.label}</span>` : ''}
        <h3 style="margin:0">${c.name}</h3>
        <div class="muted" style="margin:6px 0">${c.description||''}</div>
        <div style="display:flex; gap:8px">
          <button class="secondary" data-edit="${c.id}">✏️ Editar</button>
          <button class="primary" data-enroll="${c.id}">Matricular Alunos</button>
        </div>
      </div>
    `).join('');
    qsa('[data-edit]', grid).forEach(b=> b.addEventListener('click', ()=> openEditCourse(b.getAttribute('data-edit'))));
    qsa('[data-enroll]', grid).forEach(b=> b.addEventListener('click', ()=> openEnrollPage(b.getAttribute('data-enroll'))));
  }catch(e){
    console.error(e);
    grid.innerHTML = '<div class="center" style="color:#e11d48">Erro ao carregar cursos.</div>';
  }
}

export function openCreateCourse(navigateTo, openEnrollPage, renderCursos){
  const root = qs('#curso-new-page');
  navigateTo('curso-new-page');
  root.innerHTML = `
    <div class="card">
      <h2>Novo Curso</h2>
      <div class="grid" style="grid-template-columns:1fr; gap:12px">
        <input id="c-name" class="input" placeholder="Nome do curso">
        <input id="c-label" class="input" placeholder="Label do card (ex: Fundamental, Médio…)">
        <textarea id="c-desc" class="input" placeholder="Descrição do curso"></textarea>
      </div>
      <h3 style="margin-top:14px">Estrutura (Anos → Componentes → Disciplinas)</h3>
      <div id="years-box" class="grid" style="gap:12px"></div>
      <button id="add-year" class="secondary" style="margin-top:8px">+ Ano</button>
      <div class="actions">
        <button id="c-voltar" class="secondary">Voltar</button>
        <button id="c-salvar" class="primary">Salvar Curso</button>
      </div>
    </div>`;

  qs('#c-voltar').addEventListener('click', ()=> history.back());

  qs('#add-year').addEventListener('click', ()=>{
    const y = document.createElement('div'); y.className = 'card';
    y.innerHTML = `
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px">
        <input class="input" placeholder="Ano (ex: 1º ano)" style="flex:1">
        <button class="secondary" data-rm="year">Remover</button>
      </div>
      <div class="grid" data-areas style="gap:8px"></div>
      <button class="secondary" data-add-area>+ Componente</button>`;
    qs('#years-box').appendChild(y);
    y.querySelector('[data-rm="year"]').addEventListener('click', ()=> y.remove());
    y.querySelector('[data-add-area]').addEventListener('click', ()=>{
      const a = document.createElement('div'); a.className = 'card';
      a.innerHTML = `
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px">
          <input class="input" placeholder="Componente (ex: Linguagens)" style="flex:1">
          <button class="secondary" data-rm="area">Remover</button>
        </div>
        <div class="grid" data-disc style="gap:6px"></div>
        <button class="secondary" data-add-disc>+ Disciplina</button>`;
      a.querySelector('[data-rm="area"]').addEventListener('click', ()=> a.remove());
      a.querySelector('[data-add-disc]').addEventListener('click', ()=>{
        const d = document.createElement('div'); d.style.display='flex'; d.style.gap='8px';
        d.innerHTML = `
          <input class="input" placeholder="Nome da disciplina" style="flex:1">
          <input class="input" type="number" placeholder="CH" style="width:100px">
          <button class="secondary" data-rm="disc">x</button>`;
        d.querySelector('[data-rm="disc"]').addEventListener('click', ()=> d.remove());
        a.querySelector('[data-disc]').appendChild(d);
      });
      y.querySelector('[data-areas]').appendChild(a);
    });
  });

  qs('#c-salvar').addEventListener('click', async ()=>{
    const name = qs('#c-name').value.trim(); if (!name){ alert('Informe o nome do curso.'); return; }
    const label = qs('#c-label').value.trim() || null;
    const description = qs('#c-desc').value.trim() || null;
    const anos = {};
    qsa('#years-box > .card').forEach(year => {
      const anoName = year.querySelector('input').value.trim(); if (!anoName) return;
      const componentes = {};
      year.querySelectorAll('[data-areas] > .card').forEach(area => {
        const areaName = area.querySelector('input').value.trim(); if (!areaName) return;
        const list = [];
        area.querySelectorAll('[data-disc] > div').forEach(row => {
          const nome = row.querySelector('input:nth-child(1)').value.trim();
          const ch = parseInt(row.querySelector('input:nth-child(2)').value||'0',10)||0;
          if (nome) list.push({ nome, cargaHoraria: ch });
        });
        componentes[areaName] = list;
      });
      anos[anoName] = { componentes };
    });
    const structure = { anos };
    try{
      const { data, error } = await supabase.from('courses').insert([{ name, label, description, structure }]).select('id');
      if (error) throw error;
      const courseId = data?.[0]?.id;
      alert('Curso criado. Vamos matricular os alunos por disciplina.');
      openEnrollPage(courseId);
    }catch(e){
      console.error(e); alert('Erro ao criar curso.');
    }
  });
}

export async function openEditCourse(courseId, renderCursos){
  try{
    const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (error) throw error;
    let novoNome = prompt('Nome do curso:', data.name); if (novoNome===null) return;
    let novoLabel = prompt('Label:', data.label ?? ''); if (novoLabel===null) novoLabel = data.label ?? '';
    let novaDesc = prompt('Descrição:', data.description ?? ''); if (novaDesc===null) novaDesc = data.description ?? '';
    const upd = { name: (novoNome||'').trim() || data.name, label: (novoLabel||'').trim(), description: (novaDesc||'').trim() };
    const { error: e2 } = await supabase.from('courses').update(upd).eq('id', courseId);
    if (e2) throw e2;
    alert('Curso atualizado!');
    renderCursos(()=>{},()=>{});
  }catch(err){
    console.error(err); alert('Erro ao editar curso.');
  }
}

export async function openEnrollPage(courseId, navigateTo){
  const root = qs('#curso-enroll-page');
  navigateTo('curso-enroll-page');
  root.innerHTML = '<div class="card center">Carregando...</div>';
  try{
    const [{ data: course, error: e1 }, { data: alunos, error: e2 }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', courseId).single(),
      supabase.from('alunos').select('id, nome, matricula').order('nome')
    ]);
    if (e1) throw e1; if (e2) throw e2;

    const anos = Object.keys(course.structure?.anos || {});
    const year = anos[0] || null;
    const render = async (yr) => {
      const componentes = course.structure?.anos?.[yr]?.componentes || {};
      const disciplinas = [];
      Object.entries(componentes).forEach(([area, list])=>{
        list.forEach(d => disciplinas.push(`${area}::${d.nome}`));
      });
      root.innerHTML = `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center">
            <div>
              <h2 style="margin:0">Matrículas por Disciplina – ${course.name}</h2>
              <div class="muted">Ano:</div>
              <select id="year-select" class="input" style="width:220px; margin-top:6px">
                ${anos.map(a=>`<option value="${a}" ${a===yr?'selected':''}>${a}</option>`).join('')}
              </select>
            </div>
            <button id="enroll-voltar" class="secondary">Voltar</button>
          </div>
          <div class="card" style="margin-top:12px; overflow:auto">
            <table class="table" id="matrix">
              <thead>
                <tr>
                  <th>Aluno</th>
                  ${disciplinas.map(d=>`<th>${d.split('::')[1]}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${alunos.map(a=>`
                  <tr data-aluno="${a.id}">
                    <td><b>${a.nome}</b><div class="muted">Mat.: ${a.matricula||'-'}</div></td>
                    ${disciplinas.map(d=>`<td><input type="checkbox" data-subject="${d}"></td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="actions">
            <div></div>
            <button id="save-enroll" class="primary">Salvar Matrículas</button>
          </div>
        </div>`;

      qs('#enroll-voltar').addEventListener('click', ()=> history.back());
      qs('#year-select').addEventListener('change', (ev)=> render(ev.target.value));

      // carregar matrículas existentes
      const { data: existing, error: e3 } = await supabase
        .from('enrollments')
        .select('aluno_id, subject')
        .eq('course_id', courseId)
        .eq('year', yr);
      if (e3) { console.error(e3); }

      const set = new Set((existing||[]).map(r => `${r.aluno_id}|${r.subject}`));
      qsa('#matrix tbody tr').forEach(tr => {
        const alunoId = tr.getAttribute('data-aluno');
        qsa('input[type="checkbox"]', tr).forEach(cb => {
          const subj = cb.getAttribute('data-subject');
          cb.checked = set.has(`${alunoId}|${subj}`);
        });
      });

      qs('#save-enroll').addEventListener('click', async ()=>{
        // recomputa sets
        const { data: saved, error: e4 } = await supabase
          .from('enrollments')
          .select('aluno_id, subject')
          .eq('course_id', courseId)
          .eq('year', yr);
        if (e4){ alert('Erro ao ler matrículas.'); return; }
        const savedSet = new Set((saved||[]).map(r => `${r.aluno_id}|${r.subject}`));

        const nowSet = new Set();
        qsa('#matrix tbody tr').forEach(tr => {
          const alunoId = tr.getAttribute('data-aluno');
          qsa('input[type="checkbox"]', tr).forEach(cb => {
            if (cb.checked){
              const subj = cb.getAttribute('data-subject');
              nowSet.add(`${alunoId}|${subj}`);
            }
          });
        });

        const toAdd = [...nowSet].filter(x => !savedSet.has(x)).map(key => {
          const [aluno_id, subject] = key.split('|');
          return { course_id: courseId, aluno_id, year: yr, subject };
        });
        const toDel = [...savedSet].filter(x => !nowSet.has(x)).map(key => {
          const [aluno_id, subject] = key.split('|');
          return { aluno_id, subject };
        });

        try{
          if (toAdd.length){
            const { error: eAdd } = await supabase.from('enrollments').insert(toAdd);
            if (eAdd) throw eAdd;
          }
          for (const row of toDel){
            const { error: eDel } = await supabase
              .from('enrollments').delete()
              .eq('course_id', courseId).eq('year', yr)
              .eq('aluno_id', row.aluno_id).eq('subject', row.subject);
            if (eDel) throw eDel;
          }
          alert('Matrículas salvas!');
        }catch(err){
          console.error(err);
          alert('Erro ao salvar.');
        }
      });
    };
    await render(year);
  }catch(e){
    console.error(e);
    root.innerHTML = '<div class="card center" style="color:#e11d48">Erro ao abrir matrículas.</div>';
  }
}
