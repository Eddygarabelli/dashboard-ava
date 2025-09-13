import React, { useMemo, useState, useEffect } from "react";
import { UserPlus, GraduationCap, Library, PlusCircle, Search, UserCircle, Home } from "lucide-react";
import "./index.css";

// Tipos básicos
export type Student = {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string;
  courseIds: string[];
};

export type Course = {
  id: string;
  title: string;
  category?: string;
  description?: string;
  createdAt: string;
};

export type View = "dashboard" | "alunos";

// Utilitário simples para IDs
const uid = () => Math.random().toString(36).slice(2, 9);

// Helpers puras (facilitam testes)
export function filterCoursesList(courses: Course[], q: string): Course[] {
  const s = q.trim().toLowerCase();
  if (!s) return courses;
  return courses.filter(
    (c) => c.title.toLowerCase().includes(s) || (c.category || "").toLowerCase().includes(s)
  );
}

export function filterStudentsList(students: Student[], q: string): Student[] {
  const s = q.trim().toLowerCase();
  if (!s) return students;
  return students.filter((st) => st.name.toLowerCase().includes(s));
}

export default function App() {
  const [view, setView] = useState<View>("dashboard");

  // Roteamento simples por hash (#/alunos ou #/)
  useEffect(() => {
    const applyFromHash = () => {
      if (location.hash.includes("alunos")) setView("alunos");
      else setView("dashboard");
    };
    applyFromHash();
    window.addEventListener("hashchange", applyFromHash);
    return () => window.removeEventListener("hashchange", applyFromHash);
  }, []);

  const goAlunos = () => { setView("alunos"); location.hash = "#/alunos"; };
  const goDashboard = () => { setView("dashboard"); location.hash = "#/"; };

  const [courses, setCourses] = useState<Course[]>([
    {
      id: uid(),
      title: "Inglês Básico A1",
      category: "Idiomas",
      description: "Fundamentos de inglês para iniciantes.",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      title: "Leitura e Escrita Pré-II",
      category: "Educação Infantil",
      description: "Atividades lúdicas e consciência fonológica.",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [students, setStudents] = useState<Student[]>([
    { id: uid(), name: "Maria Lua", email: "maria@example.com", courseIds: [] },
    { id: uid(), name: "João Miguel", email: "joao@example.com", courseIds: [] },
  ]);

  // Busca cursos
  const [query, setQuery] = useState("");
  const filteredCourses = useMemo(() => filterCoursesList(courses, query), [courses, query]);

  // Busca alunos (na página de alunos)
  const [studentQuery, setStudentQuery] = useState("");
  const filteredStudents = useMemo(() => filterStudentsList(students, studentQuery), [students, studentQuery]);

  // Forms simples (demo)
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentCourseId, setStudentCourseId] = useState<string>("");

  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  function handleAddStudent() {
    if (!studentName.trim()) return;
    const id = uid();
    const newS: Student = {
      id,
      name: studentName.trim(),
      email: studentEmail.trim() || undefined,
      courseIds: studentCourseId ? [studentCourseId] : [],
    };
    setStudents((prev) => [newS, ...prev]);
    setStudentName("");
    setStudentEmail("");
    setStudentCourseId("");
  }

  function handleCreateCourse() {
    if (!courseTitle.trim()) return;
    const id = uid();
    const newC: Course = {
      id,
      title: courseTitle.trim(),
      category: courseCategory.trim() || undefined,
      description: courseDescription.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setCourses((prev) => [newC, ...prev]);
    setCourseTitle("");
    setCourseCategory("");
    setCourseDescription("");
  }

  const enrollCount = (courseId: string) =>
    students.filter((s) => s.courseIds.includes(courseId)).length;

  // Totais
  const totalCourses = courses.length;
  const totalStudents = students.length;
  const totalEnrolls = students.reduce((acc, s) => acc + s.courseIds.length, 0);

  return (
    <div className="min-h-screen text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-content-center shadow">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel de Cursos</h1>
              <p className="text-sm text-slate-500">Gerencie alunos e trilhas de aprendizagem</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddStudent}
              className="btn btn-primary flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" /> Adicionar Aluno
            </button>
            <button onClick={handleCreateCourse} className="btn flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Criar Curso
            </button>
            {view === "alunos" ? (
              <button onClick={goDashboard} className="btn btn-ghost flex items-center gap-2">
                <Home className="h-4 w-4" /> Dashboard
              </button>
            ) : (
              <button onClick={goAlunos} className="btn btn-ghost flex items-center gap-2">
                <UserCircle className="h-4 w-4" /> Alunos
              </button>
            )}
            {view === "dashboard" && (
              <a href="#meus-cursos" className="btn btn-ghost flex items-center gap-2">
                <Library className="h-4 w-4" /> Meus Cursos
              </a>
            )}
          </div>
        </div>
      </header>

      {/* INDICADORES (aparecem em ambas as páginas) */}
      <section className="max-w-6xl mx-auto px-4 mt-4 grid gap-4 md:grid-cols-3">
        <div className="card">
          <h3 className="font-semibold mb-1">Total de Cursos</h3>
          <div className="text-3xl font-bold">{totalCourses}</div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-1">Total de Alunos</h3>
          <div className="text-3xl font-bold">{totalStudents}</div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-1">Matrículas</h3>
          <div className="text-3xl font-bold">{totalEnrolls}</div>
        </div>
      </section>

      {/* CONTEÚDO por página */}
      {view === "dashboard" && (
        <main className="max-w-6xl mx-auto px-4 py-6">
          {/* CURSOS (sem alunos aqui) */}
          <section id="meus-cursos">
            <h2 className="text-lg font-semibold mb-3">Cursos</h2>
            <div className="relative w-full md:max-w-sm mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar curso por título ou categoria"
                className="pl-9 pr-3 py-2 border rounded-xl w-full bg-white"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            {filteredCourses.length === 0 ? (
              <div className="card text-center text-slate-600">
                Nenhum curso encontrado. Crie um novo curso para começar.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((c) => (
                  <div key={c.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold truncate">{c.title}</h3>
                      {c.category && <span className="badge">{c.category}</span>}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {c.description || "Sem descrição."}
                    </p>
                    <p className="text-xs text-slate-500 mb-1">
                      Criado em {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      Matriculados: <span className="font-semibold">{enrollCount(c.id)}</span>
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button className="btn">Gerenciar</button>
                      <button className="btn btn-primary">Abrir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {view === "alunos" && (
        <main className="max-w-6xl mx-auto px-4 py-6">
          {/* PÁGINA DE ALUNOS */}
          <section>
            <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
              <div>
                <h2 className="text-lg font-semibold">Alunos</h2>
                <p className="text-sm text-slate-500">
                  Total: <span className="font-semibold">{filteredStudents.length}</span>
                </p>
              </div>
              <div className="relative w-full md:max-w-sm">
                <input
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Pesquisar aluno por nome"
                  className="pl-9 pr-3 py-2 border rounded-xl w-full bg-white"
                />
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
                      {s.photoUrl ? (
                        <img
                          src={s.photoUrl}
                          alt={s.name}
                          className="h-10 w-10 rounded-full object-cover border"
                        />
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
                      {s.courseIds.length === 0 && (
                        <span className="badge bg-white text-slate-600 border-slate-300">
                          Sem matrícula
                        </span>
                      )}
                      {s.courseIds.map((cid) => {
                        const course = courses.find((c) => c.id === cid);
                        return (
                          <span key={cid} className="badge mr-1">
                            {course?.title || "Curso"}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="btn">Ver perfil</button>
                      <button className="btn btn-primary">Matricular</button>
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
          Feito com ❤ para o fluxo do Eddy. Protótipo local (sem backend).
        </div>
      </footer>
    </div>
  );
}

// =========================
// Testes rápidos (somente em DEV)
// =========================
if (import.meta.env.DEV) {
  // Testes de filtro de cursos
  const tc: Course[] = [
    { id: "1", title: "Matemática 6º ano", category: "Matemática", createdAt: "", description: "" },
    { id: "2", title: "Inglês Básico", category: "Idiomas", createdAt: "", description: "" },
  ];
  console.assert(filterCoursesList(tc, "matem").length === 1, "Filtro de cursos por título falhou");
  console.assert(filterCoursesList(tc, "idiom").length === 1, "Filtro de cursos por categoria falhou");
  console.assert(filterCoursesList(tc, "").length === 2, "Filtro de cursos vazio deve retornar todos");

  // Testes de filtro de alunos
  const ts: Student[] = [
    { id: "a", name: "Maria Clara", courseIds: [] },
    { id: "b", name: "João Pedro", courseIds: [] },
  ];
  console.assert(filterStudentsList(ts, "maria").length === 1, "Filtro de alunos por nome falhou");
  console.assert(filterStudentsList(ts, "").length === 2, "Filtro de alunos vazio deve retornar todos");
}
