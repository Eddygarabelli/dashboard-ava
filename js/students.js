
import { supabase } from './supabaseClient.js';
import { qs, qsa, fmtDate, matricula, avatarUrl } from './util.js';

export async function updateAlunosCountUI(){
  const el = qs('#alunos-count');
  try{
    const { count, error } = await supabase.from('alunos').select('*', { count:'exact', head:true });
    if (error) throw error;
    el.textContent = String(count ?? 0);
  }catch{ el.textContent = '0'; }
}

export function bindCadastroNavigation(navigateTo, navigateBack){
  qs('#card-novo-aluno')?.addEventListener('click', () => navigateTo('cadastro-page'));
  qs('#cad-voltar')?.addEventListener('click', () => navigateBack());
}

export function bindDashboardAlunos(renderAlunosList){
  qs('#card-alunos-matriculados')?.addEventListener('click', renderAlunosList);
}

export function bindCadastroForm(renderAlunosList, updateAlunosCount, navigateBack){
  qs('#cadastro-form')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = {
      matricula: matricula(),
      nome: qs('#nome')?.value?.trim() || '',
      rg: qs('#rg')?.value?.trim() || '',
      cpf: qs('#cpf')?.value?.trim() || '',
      email: qs('#email')?.value?.trim() || '',
      telefone: qs('#telefone')?.value?.trim() || '',
      datanascimento: qs('#datanascimento')?.value || null,
      localnascimento: qs('#localnascimento')?.value?.trim() || '',
      endereco: qs('#endereco')?.value?.trim() || '',
      datacadastro: new Date().toISOString()
    };
    try{
      const { error } = await supabase.from('alunos').insert([payload]);
      if (error) throw error;
      alert('Aluno cadastrado!');
      e.target.reset();
      await updateAlunosCount();
      renderAlunosList();
    }catch(err){
      console.error(err);
      alert('Erro ao cadastrar aluno.');
    }
  });
}

export async function renderAlunosList(navigateTo, openStudentDetails){
  const container = qs('#alunos-list-page');
  container.innerHTML = '<div class="center">Carregando...</div>';
  navigateTo('dashboard-page'); // mantém no dashboard, seção alunos
  try{
    const { data, error } = await supabase.from('alunos').select('id, nome, matricula, datacadastro, foto_url').order('datacadastro', { ascending:false });
    if (error) throw error;
    if (!data?.length){
      container.innerHTML = '<div class="center">Nenhum aluno cadastrado.</div>';
      return;
    }
    container.innerHTML = '<div class="grid grid-2" id="alunos-grid"></div>';
    const grid = qs('#alunos-grid');
    grid.innerHTML = data.map(a=>`
      <button class="card" data-id="${a.id}" style="text-align:left">
        <div style="display:flex; gap:12px; align-items:center">
          <img src="${avatarUrl(a)}" class="avatar" alt="Foto">
          <div>
            <div style="font-weight:800">${a.nome||''}</div>
            <div class="muted">Matrícula: ${a.matricula||'-'}</div>
            <div class="muted">Cadastro: ${fmtDate(a.datacadastro)}</div>
          </div>
        </div>
      </button>
    `).join('');
    qsa('[data-id]', grid).forEach(btn => btn.addEventListener('click', ()=> openStudentDetails(btn.getAttribute('data-id'))));
  }catch(e){
    console.error(e);
    container.innerHTML = '<div class="center" style="color:#e11d48">Erro ao carregar alunos.</div>';
  }
}

export async function openStudentDetails(id, navigateTo, navigateBack){
  const root = qs('#student-details-page');
  navigateTo('student-details-page');
  root.innerHTML = '<div class="card center">Carregando...</div>';
  try{
    const { data: a, error } = await supabase.from('alunos').select('*').eq('id', id).single();
    if (error) throw error;
    root.innerHTML = `
      <div class="card">
        <div class="profile">
          <img src="${avatarUrl(a)}" class="avatar" id="aluno-avatar" alt="Foto">
          <div style="flex:1">
            <h2 style="margin:0">${a.nome||''}</h2>
            <div class="muted">Matrícula: ${a.matricula||'-'}</div>
            <div class="uploader" style="margin-top:8px">
              <input type="file" id="foto-input" accept="image/*">
              <button class="secondary" id="foto-enviar">Editar foto</button>
            </div>
          </div>
        </div>
        <div style="height:12px"></div>
        <div id="student-view" class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px">
          <div><b>RG</b><div>${a.rg||'-'}</div></div>
          <div><b>CPF</b><div>${a.cpf||'-'}</div></div>
          <div><b>E-mail</b><div>${a.email||'-'}</div></div>
          <div><b>Telefone</b><div>${a.telefone||'-'}</div></div>
          <div><b>Nascimento</b><div>${a.datanascimento||'-'}</div></div>
          <div><b>Local de Nascimento</b><div>${a.localnascimento||'-'}</div></div>
          <div style="grid-column:1/-1"><b>Endereço</b><div>${a.endereco||'-'}</div></div>
        </div>
        <form id="student-edit" class="grid hidden" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px">
          <input id="e-nome" class="input" type="text" placeholder="Nome" value="${a.nome||''}" required>
          <input id="e-matricula" class="input" type="text" placeholder="Matrícula" value="${a.matricula||''}" required>
          <input id="e-rg" class="input" type="text" placeholder="RG" value="${a.rg||''}">
          <input id="e-cpf" class="input" type="text" placeholder="CPF" value="${a.cpf||''}">
          <input id="e-email" class="input" type="email" placeholder="E-mail" value="${a.email||''}">
          <input id="e-telefone" class="input" type="tel" placeholder="Telefone" value="${a.telefone||''}">
          <input id="e-datanascimento" class="input" type="date" placeholder="Data de Nascimento" value="${a.datanascimento||''}">
          <input id="e-localnascimento" class="input" type="text" placeholder="Local de Nascimento" value="${a.localnascimento||''}">
          <input id="e-endereco" class="input" type="text" placeholder="Endereço" value="${a.endereco||''}" style="grid-column:1/-1">
        </form>
        <div class="actions">
          <button class="secondary" id="btn-voltar">Voltar</button>
          <div style="display:flex; gap:8px">
            <button class="primary" id="btn-editar">Editar</button>
            <button class="primary hidden" id="btn-salvar">Salvar</button>
            <button class="secondary hidden" id="btn-cancelar">Cancelar</button>
          </div>
        </div>
      </div>
    `;

    // Foto upload
    qs('#foto-enviar')?.addEventListener('click', async ()=>{
      const file = qs('#foto-input')?.files?.[0];
      if (!file){ alert('Escolha uma imagem.'); return; }
      try{
        const path = `alunos/${id}.png`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert:true, cacheControl: '3600' });
        if (upErr) throw upErr;
        const { data:pub } = supabase.storage.from('avatars').getPublicUrl(path);
        const foto_url = pub?.publicUrl || null;
        if (foto_url){
          const { error: up2 } = await supabase.from('alunos').update({ foto_url }).eq('id', id);
          if (up2) throw up2;
          qs('#aluno-avatar').src = foto_url;
          alert('Foto atualizada!');
        }else{
          alert('Não foi possível obter a URL pública.');
        }
      }catch(e){
        console.error(e);
        alert('Erro ao enviar foto. Verifique se o bucket "avatars" é público.');
      }
    });

    // Edição campos
    const view = qs('#student-view');
    const form = qs('#student-edit');
    qs('#btn-editar')?.addEventListener('click', ()=>{
      view.classList.add('hidden'); form.classList.remove('hidden');
      qs('#btn-editar').classList.add('hidden');
      qs('#btn-salvar').classList.remove('hidden');
      qs('#btn-cancelar').classList.remove('hidden');
    });
    qs('#btn-cancelar')?.addEventListener('click', ()=>{
      view.classList.remove('hidden'); form.classList.add('hidden');
      qs('#btn-editar').classList.remove('hidden');
      qs('#btn-salvar').classList.add('hidden');
      qs('#btn-cancelar').classList.add('hidden');
    });
    qs('#btn-salvar')?.addEventListener('click', async ()=>{
      const upd = {
        nome: qs('#e-nome').value.trim(),
        matricula: qs('#e-matricula').value.trim(),
        rg: qs('#e-rg').value.trim(),
        cpf: qs('#e-cpf').value.trim(),
        email: qs('#e-email').value.trim(),
        telefone: qs('#e-telefone').value.trim(),
        datanascimento: qs('#e-datanascimento').value||null,
        localnascimento: qs('#e-localnascimento').value.trim(),
        endereco: qs('#e-endereco').value.trim(),
      };
      try{
        const { error } = await supabase.from('alunos').update(upd).eq('id', id);
        if (error) throw error;
        alert('Dados salvos.');
        openStudentDetails(id, ()=>{}, ()=>{}); // reload
      }catch(e){
        console.error(e);
        alert('Erro ao salvar dados.');
      }
    });

    qs('#btn-voltar')?.addEventListener('click', () => navigateBack());
  }catch(e){
    console.error(e);
    root.innerHTML = '<div class="card center" style="color:#e11d48">Erro ao carregar aluno.</div>';
  }
}
