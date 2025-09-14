import React, { useMemo, useState, useEffect } from "react";
import { GraduationCap, Search, UserCircle, Home, Plus, ArrowLeft, Upload } from "lucide-react";
import "./index.css";
import { supabase } from "./lib/supabaseClient";

type Student = {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  rg?: string | null;
  cpf?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  zip_code?: string | null;
  city?: string | null;
  state?: string | null;
  levels?: string[] | null;
  photo_url?: string | null;
  created_at?: string;
  courseIds: string[];
};
type Course = { id: string; title: string; category?: string | null; description?: string | null; created_at: string; };
type View = "dashboard" | "alunos" | "add-aluno";

const filterCourses = (courses: Course[], q: string) => {
  const s = q.trim().toLowerCase();
  if (!s) return courses;
  return courses.filter(c => c.title.toLowerCase().includes(s) || (c.category || "").toLowerCase().includes(s));
};
const filterStudents = (students: Student[], q: string) => {
  const s = q.trim().toLowerCase();
  if (!s) return students;
  return students.filter(st => st.name.toLowerCase().includes(s));
};
function viewFromHash(): View {
  const h = location.hash || "";
  if (h.includes("alunos/novo") || h.includes("adicionar")) return "add-aluno";
  if (h.includes("alunos")) return "alunos";
  return "dashboard";
}

const digitsOnly = (s: string) => s.replace(/\D/g, "");
const maskCPF = (v: string) => {
  const d = digitsOnly(v).slice(0, 11);
  const p1 = d.slice(0,3), p2 = d.slice(3,6), p3 = d.slice(6,9), p4 = d.slice(9,11);
  let out = p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  if (p4) out += "-" + p4;
  return out;
};
const maskCEP = (v: string) => {
  const d = digitsOnly(v).slice(0, 8);
  const p1 = d.slice(0,5), p2 = d.slice(5,8);
  return p2 ? `${p1}-${p2}` : p1;
};
const maskPhone = (v: string) => {
  const d = digitsOnly(v).slice(0, 11);
  const dd = d.slice(0,2);
  const is11 = d.length > 10;
  const p1 = is11 ? d.slice(2,7) : d.slice(2,6);
  const p2 = is11 ? d.slice(7,11) : d.slice(6,10);
  if (!dd) return d;
  if (!p2) return `(${dd}) ${p1}`.trim();
  return `(${dd}) ${p1}-${p2}`;
};
const uuid = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export default function App(){
  const [view, setView] = useState<View>(viewFromHash());
  useEffect(() => {
    const apply = () => setView(viewFromHash());
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  const goAlunos = () => { setView("alunos"); location.hash = "#/alunos"; };
  const goDashboard = () => { setView("dashboard"); location.hash = "#/"; };
  const goAddAluno = () => { setView("add-aluno"); location.hash = "#/alunos/novo"; };

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: coursesData } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      const { data: studentsData } = await supabase.from("students").select("*").order("created_at", { ascending: false });
      const { data: enrolls } = await supabase.from("enrollments").select("student_id, course_id");

      const byStudent = new Map<string, string[]>();
      (enrolls ?? []).forEach((e:any) => {
        const arr = byStudent.get(e.student_id) ?? [];
        arr.push(e.course_id);
        byStudent.set(e.student_id, arr);
      });

      setCourses((coursesData ?? []) as Course[]);
      setStudents(((studentsData ?? []) as any[]).map((s:any) => ({
        id: s.id,
        name: s.name,
        first_name: s.first_name ?? null,
        last_name: s.last_name ?? null,
        rg: s.rg ?? null,
        cpf: s.cpf ?? null,
        birth_date: s.birth_date ?? null,
        birth_place: s.birth_place ?? null,
        email: s.email ?? null,
        phone: s.phone ?? null,
        street: s.street ?? null,
        number: s.number ?? null,
        neighborhood: s.neighborhood ?? null,
        zip_code: s.zip_code ?? null,
        city: s.city ?? null,
        state: s.state ?? null,
        levels: s.levels ?? null,
        photo_url: s.photo_url ?? null,
        created_at: s.created_at,
        courseIds: byStudent.get(s.id) ?? [],
      }))));
    };
    load();

    const ch = supabase
      .channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const totalCourses = courses.length;
  const totalStudents = students.length;
  const totalEnrolls = students.reduce((acc, s)=> acc + s.courseIds.length, 0);

  const [query, setQuery] = useState("");  const filteredCourses = useMemo(()=>filterCourses(courses, query), [courses, query]);
  const [studentQuery, setStudentQuery] = useState("");  const filteredStudents = useMemo(()=>filterStudents(students, studentQuery), [students, studentQuery]);
  const enrollCount = (id:string)=> students.filter(s=>s.courseIds.includes(id)).length;

  // Form Novo Aluno + Upload + Máscaras
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rg, setRg] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [levels, setLevels] = useState<{Fundamental:boolean; Medio:boolean}>({ Fundamental:false, Medio:false });
  const toggleLevel = (k: 'Fundamental'|'Medio') => setLevels(prev=>({...prev, [k]: !prev[k]}));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function uploadPhotoIfNeeded(): Promise<string | null>{
    if (!file) return null;
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `photos/${(crypto?.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2)+Date.now().toString(36)))}.${ext}`;
    const { error: upErr } = await supabase.storage.from('students').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined });
    if (upErr) { console.error('upload error', upErr); return null; }
    const { data } = supabase.storage.from('students').getPublicUrl(path);
    return data.publicUrl || null;
  }

  async function handleAddStudent(e?: React.FormEvent){
    e?.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) return;

    const digitsOnly = (s: string) => s.replace(/\\D/g, "");
    const cpfDigits = digitsOnly(cpf);
    const zipDigits = digitsOnly(zip);
    const phoneDigits = digitsOnly(phone);

    const photo_url = await uploadPhotoIfNeeded();
    const levelsArr = [levels.Fundamental ? "Fundamental" : null, levels.Medio ? "Médio" : null].filter(Boolean) as string[];

    const { error } = await supabase.from("students").insert([{
      name: fullName,
      first_name: firstName || null,
      last_name: lastName || null,
      rg: rg || null,
      cpf: cpfDigits || null,
      birth_date: birthDate || null,
      birth_place: birthPlace || null,
      email: email || null,
      phone: phoneDigits || null,
      street: street || null,
      number: number || null,
      neighborhood: neighborhood || null,
      zip_code: zipDigits || null,
      city: city || null,
      state: uf || null,
      levels: levelsArr.length ? levelsArr : null,
      photo_url: photo_url || null,
    }]);
    if (error) { console.error(error); return; }

    setFirstName(""); setLastName(""); setRg(""); setCpf(""); setBirthDate(""); setBirthPlace("");
    setEmail(""); setPhone(""); setStreet(""); setNumber(""); setNeighborhood(""); setZip(""); setCity(""); setUf("");
    setLevels({Fundamental:false, Medio:false});
    setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null);

    goAlunos();
  }

  return (
    <div className="min-h-screen text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-content-center shadow"><GraduationCap className="h-5 w-5" /></div>
            <div>
              <h1 className="text-xl font-bold">Painel de Cursos</h1>
              <p className="text-sm text-slate-500">Gerencie alunos e trilhas de aprendizagem</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view !== "dashboard" && (
              <button onClick={goDashboard} className="btn btn-ghost flex items-center gap-2"><Home className="h-4 w-4"/> Dashboard</button>
            )}
            {view !== "alunos" && (
              <button onClick={goAlunos} className="btn btn-ghost flex items-center gap-2"><UserCircle className="h-4 w-4" /> Alunos</button>
            )}
            {view !== "add-aluno" && (
              <a href="#/alunos/novo" onClick={(e)=>{ e.preventDefault(); goAddAluno(); }} className="btn btn-primary flex items-center gap-2"><Plus className="h-4 w-4"/> Adicionar Aluno</a>
            )}
          </div>
        </div>
      </header>

      {/* Indicadores */}
      <section className="max-w-6xl mx-auto px-4 mt-4 grid gap-4 md:grid-cols-3">
        <div className="card"><h3 className="font-semibold mb-1">Total de Cursos</h3><div className="text-3xl font-bold">{totalCourses}</div></div>
        <div className="card"><h3 className="font-semibold mb-1">Total de Alunos</h3><div className="text-3xl font-bold">{totalStudents}</div></div>
        <div className="card"><h3 className="font-semibold mb-1">Matrículas</h3><div className="text-3xl font-bold">{totalEnrolls}</div></div>
      </section>

      {/* Dashboard */}
      {view === "dashboard" && (
        <main className="max-w-6xl mx-auto px-4 py-6">
          <section id="meus-cursos">
            <h2 className="text-lg font-semibold mb-3">Cursos</h2>
            <div className="relative w-full md:max-w-sm mb-4">
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar curso por título ou categoria" className="pl-9 pr-3 py-2 border rounded-xl w-full bg-white" />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            {filteredCourses.length === 0 ? (
              <div className="card text-center text-slate-600">Nenhum curso encontrado.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((c) => (
                  <div key={c.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold truncate">{c.title}</h3>
                      {c.category && <span className="badge">{c.category}</span>}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{c.description || "Sem descrição."}</p>
                    <p className="text-xs text-slate-500 mb-1">Criado em {new Date(c.created_at).toLocaleDateString()}</p>
                    <p className="text-sm">Matriculados: <span className="font-semibold">{enrollCount(c.id)}</span></p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Alunos */}
      {view === "alunos" && (
        <main className="max-w-6xl mx-auto px-4 py-6">
          <section>
            <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
              <div>
                <h2 className="text-lg font-semibold">Alunos</h2>
                <p className="text-sm text-slate-500">Total: <span className="font-semibold">{filteredStudents.length}</span></p>
              </div>
              <div className="relative w-full md:max-w-sm">
                <input value={studentQuery} onChange={(e)=>setStudentQuery(e.target.value)} placeholder="Pesquisar aluno por nome" className="pl-9 pr-3 py-2 border rounded-xl w-full bg-white" />
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="card text-center text-slate-600">Nenhum aluno encontrado.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((s) => (
                  <div key={s.id} className="card">
                    <div className="flex items中心 gap-3 mb-2">
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.name} className="h-10 w-10 rounded-full object-cover border" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 grid place-content-center border">
                          <UserCircle className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold leading-tight">{s.name}</div>
                        <div className="text-xs text-slate-500">{[s.city, s.state].filter(Boolean).join(" - ") || ""}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      {s.rg && <div>RG: {s.rg}</div>}
                      {s.cpf && <div>CPF: {s.cpf}</div>}
                    </div>
                    <div className="mt-2 text-sm">
                      {(!s.levels || s.levels.length===0) && <span className="badge bg白 text-slate-600 border-slate-300">Sem nível</span>}
                      {s.levels?.map((lv)=> <span key={lv} className="badge mr-1">{lv}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Adicionar Aluno */}
      {view === "add-aluno" && (
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={goAlunos} className="btn flex items-center gap-2"><ArrowLeft className="h-4 w-4"/> Voltar</button>
            <h2 className="text-lg font-semibold">Adicionar Aluno</h2>
          </div>
          <form onSubmit={handleAddStudent} className="grid gap-3">
            {/* Foto */}
            <div className="card">
              <div className="label mb-2">Foto do Aluno (opcional)</div>
              <div className="flex items-center gap-3">
                {preview ? (
                  <img src={preview} alt="Preview" className="h-16 w-16 rounded-full object-cover border" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-slate-100 grid place-content-center border">
                    <UserCircle className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                <label className="btn flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" /> Selecionar imagem
                  <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
                {file && <span className="text-xs text-slate-500 truncate max-w-[220px]">{file.name}</span>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="label">Nome</div>
                <input className="input" value={firstName} onChange={e=>setFirstName(e.target.value)} required />
              </div>
              <div>
                <div className="label">Sobrenome</div>
                <input className="input" value={lastName} onChange={e=>setLastName(e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="label">RG</div>
                <input className="input" value={rg} onChange={e=>setRg(e.target.value)} />
              </div>
              <div>
                <div className="label">CPF</div>
                <input className="input" value={cpf} onChange={e=>setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="label">Data de Nascimento</div>
                <input type="date" className="input" value={birthDate} onChange={e=>setBirthDate(e.target.value)} />
              </div>
              <div>
                <div className="label">Local de Nascimento</div>
                <input className="input" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} placeholder="Cidade/UF ou País" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="label">E-mail</div>
                <input type="email" className="input" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div>
                <div className="label">Telefone</div>
                <input className="input" value={phone} onChange={e=>setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <div className="label">Rua</div>
                <input className="input" value={street} onChange={e=>setStreet(e.target.value)} />
              </div>
              <div>
                <div className="label">Número</div>
                <input className="input" value={number} onChange={e=>setNumber(e.target.value)} />
              </div>
              <div>
                <div className="label">Bairro</div>
                <input className="input" value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <div className="label">CEP</div>
                <input className="input" value={zip} onChange={e=>setZip(maskCEP(e.target.value))} placeholder="00000-000" />
              </div>
              <div>
                <div className="label">Cidade</div>
                <input className="input" value={city} onChange={e=>setCity(e.target.value)} />
              </div>
              <div>
                <div className="label">Estado (UF)</div>
                <input className="input" value={uf} onChange={e=>setUf(e.target.value.toUpperCase())} maxLength={2} placeholder="PR, SC, ..." />
              </div>
            </div>

            <div>
              <div className="label mb-1">Nível de Ensino</div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2"><input type="checkbox" checked={levels.Fundamental} onChange={()=>toggleLevel('Fundamental')} /> Fundamental</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={levels.Medio} onChange={()=>toggleLevel('Medio')} /> Médio</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" className="btn" onClick={goAlunos}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>
        </main>
      )}

      <footer className="mt-10 border-t">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-500">
          Feito com ❤. Protótipo com Supabase Realtime.
        </div>
      </footer>
    </div>
  );
}
