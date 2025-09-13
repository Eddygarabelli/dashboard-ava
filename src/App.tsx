import React, { useMemo, useState, useEffect } from "react";
import { UserPlus, GraduationCap, Library, PlusCircle, Search, UserCircle, Home } from "lucide-react";
import "./index.css";
import { supabase } from "./lib/supabaseClient";

type Student = {
  id: string;
  name: string;
  email?: string;
  photo_url?: string;
  courseIds: string[];
  created_at?: string;
};
type Course = {
  id: string;
  title: string;
  category?: string;
  description?: string;
  created_at: string;
};
type View = "dashboard" | "alunos";

// Helpers de filtro
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

export default function App(){
  const [view, setView] = useState<View>("dashboard");

  // Roteamento via hash
  useEffect(() => {
    const apply = () => setView(location.hash.includes("alunos") ? "alunos" : "dashboard");
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const goAlunos = () => { setView("alunos"); location.hash = "#/alunos"; };
  const goDashboard = () => { setView("dashboard"); location.hash = "#/"; };

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Busca inicial + realtime
  useEffect(() => {
    const load = async () => {
      const { data: coursesData, error: ec } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      const { data: studentsData, error: es } = await supabase.from("students").select("*").order("created_at", { ascending: false });
      const { data: enrolls, error: ee } = await supabase.from("enrollments").select("student_id, course_id");
      if (ec) console.error(ec); if (es) console.error(es); if (ee) console.error(ee);

      const byStudent = new Map<string, string[]>();
      (enrolls ?? []).forEach((e:any) => {
        const arr = byStudent.get(e.student_id) ?? [];
        arr.push(e.course_id);
        byStudent.set(e.student_id, arr);
      });

      setCourses((coursesData ?? []) as Course[]);
      setStudents(((studentsData ?? []) as any[]).map(s => ({
        id: s.id, name: s.name, email: s.email ?? undefined, photo_url: s.photo_url ?? undefined, created_at: s.created_at,
        courseIds: byStudent.get(s.id) ?? []
      })));
    };

    load();

    const channel = supabase
      .channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Form states (aluno)
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentCourseId, setStudentCourseId] = useState("");

  // Form states (curso)
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);

  async function handleAddStudent() {
    if (!studentName.trim()) return;
    const { data: s, error } = await supabase
      .from("students")
      .insert([{ name: studentName.trim(), email: studentEmail.trim() || null }])
      .select()
      .single();
    if (error) { console.error(error); return; }

    if (studentCourseId) {
      const { error: e2 } = await supabase
        .from("enrollments")
        .insert([{ student_id: s.id, course_id: studentCourseId }]);
      if (e2) console.error(e2);
    }
    setStudentName(""); setStudentEmail(""); setStudentCourseId("");
    // UI atualiza pelo realtime
  }

  async function handleCreateCourse() {
    if (!courseTitle.trim()) return;
    const { error } = await supabase
      .from("courses")
      .insert([{
        title: courseTitle.trim(),
        category: courseCategory.trim() || null,
        description: courseDescription.trim() || null
      }]);
    if (error) { console.error(error); return; }
    setCourseTitle(""); setCourseCategory(""); setCourseDescription("");
  }

  const totalCourses = courses.length;
  const totalStudents = students.length;
  const totalEnrolls = students.reduce((acc, s)=> acc + s.courseIds.length, 0);

  const [query, setQuery] = useState("");
  const filteredCourses = useMemo(()=>filterCourses(courses, query), [courses, query]);

  const [studentQuery, setStudentQuery] = useState("");
  const filteredStudents = useMemo(()=>filterStudents(students, studentQuery), [students, studentQuery]);

  const enrollCount = (id:string)=> students.filter(s=>s.courseIds.includes(id)).length;

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
            {view === "alunos" ? (
              <button onClick={goDashboard} className="btn btn-ghost flex items-center gap-2"><Home className="h-4 w-4"/> Dashboard</button>
            ) : (
              <button onClick={goAlunos} className="btn btn-ghost flex items-center gap-2"><UserCircle className="h-4 w-4" /> Alunos</button>
            )}
          </div>
        </div>
      </header>

      {/* INDICADORES (topo) */}
      <section className="max-w-6xl mx-auto px-4 mt-4 grid gap-4 md:grid-cols-3">
        <div className="card"><h3 className="font-semibold mb-1">Total de Cursos</h3><div className="text-3xl font-bold">{totalCourses}</div></div>
        <div className="card"><h3 className="font-semibold mb-1">Total de Alunos</h3><div className="text-3xl font-bold">{totalStudents}</div></div>
        <div className="card"><h3 className="font-semibold mb-1">Matrículas</h3><div className="text-3xl font-bold">{totalEnrolls}</div></div>
      </section>

      {/* CONTEÚDO por página */}
      {view === "dashboard" && (
        <main className="max-w-6xl mx-auto px-4 py-6">
          {/* Form Criar Curso */}
          <div className="card mb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Criar Curso</h2>
              <button className="btn" onClick={()=>setShowAddCourse(v=>!v)}>{showAddCourse ? "Fechar" : "Abrir"}</button>
            </div>
            {showAddCourse && (
              <div className="grid md:grid-cols-3 gap-3 mt-3">
                <div><div className="label">Título</div><input className="input" value={courseTitle} onChange={e=>setCourseTitle(e.target.value)} placeholder="Ex.: Inglês Básico A1" /></div>
                <div><div className="label">Categoria</div><input className="input" value={courseCategory} onChange={e=>setCourseCategory(e.target.value)} placeholder="Ex.: Idiomas" /></div>
                <div><div className="label">Descrição</div><input className="input" value={courseDescription} onChange={e=>setCourseDescription(e.target.value)} placeholder="Opcional" /></div>
                <div className="md:col-span-3"><button onClick={handleCreateCourse} className="btn btn-primary w-full md:w-auto">Salvar Curso</button></div>
              </div>
            )}
          </div>

          {/* CURSOS */}
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

      {view === "alunos" && (
        <main className="max-w-6xl mx-auto px-4 py-6">
          {/* Form Adicionar Aluno */}
          <div className="card mb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Adicionar Aluno</h2>
              <button className="btn" onClick={()=>setShowAddStudent(v=>!v)}>{showAddStudent ? "Fechar" : "Abrir"}</button>
            </div>
            {showAddStudent && (
              <div className="grid md:grid-cols-4 gap-3 mt-3">
                <div><div className="label">Nome</div><input className="input" value={studentName} onChange={e=>setStudentName(e.target.value)} placeholder="Ex.: Maria" /></div>
                <div><div className="label">E-mail</div><input className="input" value={studentEmail} onChange={e=>setStudentEmail(e.target.value)} placeholder="Opcional" /></div>
                <div>
                  <div className="label">Curso (opcional)</div>
                  <select className="input" value={studentCourseId} onChange={e=>setStudentCourseId(e.target.value)}>
                    <option value="">— Nenhum —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="md:col-span-4"><button onClick={handleAddStudent} className="btn btn-primary w-full md:w-auto">Salvar Aluno</button></div>
              </div>
            )}
          </div>

          {/* Alunos */}
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
                    <div className="flex items-center gap-3 mb-2">
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.name} className="h-10 w-10 rounded-full object-cover border" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 grid place-content-center border">
                          <UserCircle className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold leading-tight">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.email || "—"}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      {s.courseIds.length === 0 && <span className="badge bg-white text-slate-600 border-slate-300">Sem matrícula</span>}
                      {s.courseIds.map((cid) => {
                        const course = courses.find(c => c.id === cid);
                        return <span key={cid} className="badge mr-1">{course?.title || "Curso"}</span>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      <footer className="mt-10 border-t">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-500">
          Feito com ❤ para o fluxo do Eddy. Protótipo com Supabase Realtime.
        </div>
      </footer>
    </div>
  );
}
