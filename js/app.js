
import { qs, qsa } from './util.js';
import { updateAlunosCountUI, bindCadastroNavigation, bindDashboardAlunos, bindCadastroForm, renderAlunosList, openStudentDetails } from './students.js';
import { bindCoursesTab, renderCursos, openCreateCourse, openEditCourse, openEnrollPage } from './courses.js';

// Simple router
const historyStack = ['dashboard-page'];
export function navigateTo(id){
  qsa('.page').forEach(p => p.classList.remove('active'));
  qs('#'+id)?.classList.add('active');
  if (historyStack[historyStack.length-1] !== id) historyStack.push(id);
}
export function navigateBack(){
  if (historyStack.length>1){
    historyStack.pop();
    const prev = historyStack[historyStack.length-1];
    qsa('.page').forEach(p => p.classList.remove('active'));
    qs('#'+prev)?.classList.add('active');
  }
}

// header
qs('#home-button')?.addEventListener('click', ()=>{
  historyStack.length = 0; historyStack.push('dashboard-page');
  navigateTo('dashboard-page');
  showTab('alunos-dashboard');
});
qs('#back-button')?.addEventListener('click', navigateBack);

// tabs in header
function showTab(id){
  qs('#alunos-dashboard').classList.add('hidden');
  qs('#cursos-dashboard').classList.add('hidden');
  qs('#pedagogico-dashboard').classList.add('hidden');
  qs('#'+id).classList.remove('hidden');
  qsa('.btn').forEach(b => b.classList.remove('active'));
  qsa(`.btn[data-target="${id}"]`).forEach(b => b.classList.add('active'));
}
qsa('.btn').forEach(btn => btn.addEventListener('click', () => {
  showTab(btn.getAttribute('data-target'));
  if (btn.getAttribute('data-target') === 'cursos-dashboard') {
    renderCursos((id)=>openEditCourse(id, ()=>renderCursos(()=>{},()=>{})), (id)=>openEnrollPage(id, navigateTo));
  }
}));

// binds
bindCadastroNavigation(navigateTo, navigateBack);
bindDashboardAlunos(()=>renderAlunosList(navigateTo, (id)=>openStudentDetails(id, navigateTo, navigateBack)));
bindCadastroForm(()=>renderAlunosList(navigateTo, (id)=>openStudentDetails(id, navigateTo, navigateBack)), updateAlunosCountUI, navigateBack);
qs('#btn-novo-curso')?.addEventListener('click', ()=> openCreateCourse(navigateTo, (id)=>openEnrollPage(id, navigateTo), ()=>renderCursos((id)=>openEditCourse(id), (id)=>openEnrollPage(id, navigateTo))));
bindCoursesTab(()=>renderCursos((id)=>openEditCourse(id, ()=>renderCursos(()=>{},()=>{})), (id)=>openEnrollPage(id, navigateTo)), ()=> openCreateCourse(navigateTo, (id)=>openEnrollPage(id, navigateTo)));

// initial
document.addEventListener('DOMContentLoaded', async ()=>{
  showTab('alunos-dashboard');
  await updateAlunosCountUI();
  renderAlunosList(navigateTo, (id)=>openStudentDetails(id, navigateTo, navigateBack));
});
