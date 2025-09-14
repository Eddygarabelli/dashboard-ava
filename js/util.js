
export const qs = (sel, el=document) => el.querySelector(sel);
export const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));
export const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '-';
export const matricula = () => 'MAT-' + Date.now().toString().slice(-6);
export const avatarUrl = (aluno) => aluno?.foto_url || `https://i.pravatar.cc/150?u=${aluno?.id||'anon'}`;
