import React, { useMemo, useState } from "react";
import { UserPlus, GraduationCap, Library, PlusCircle, Search } from "lucide-react";
import "./App.css";

// Tipos básicos
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function App() {
  const [courses, setCourses] = useState([
    { id: uid(), title: "Inglês Básico A1", category: "Idiomas", description: "Fundamentos de inglês para iniciantes.", createdAt: new Date().toISOString() },
    { id: uid(), title: "Leitura e Escrita Pré-II", category: "Educação Infantil", description: "Atividades lúdicas e consciência fonológica.", createdAt: new Date().toISOString() },
  ]);

  const [students, setStudents] = useState([
    { id: uid(), name: "Maria Lua", email: "maria@example.com", courseIds: [] },
    { id: uid(), name: "João Miguel", email: "joao@example.com", courseIds: [] },
  ]);

  const [query, setQuery] = useState("");

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(c =>
      c.title.toLowerCase().includes(q) || (c.category || "").toLowerCase().includes(q)
    );
  }, [courses, query]);

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentCourseId, setStudentCourseId] = useState("");

  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  function handleAddStudent() {
    if (!studentName.trim()) return;
    const id = uid();
    const newS = {
      id,
      name: studentName.trim(),
      email: studentEmail.trim() || undefined,
      courseIds: studentCourseId ? [studentCourseId] : [],
    };
    setStudents(prev => [newS, ...prev]);
    setStudentName("");
    setStudentEmail("");
    setStudentCourseId("");
  }

  function handleCreateCourse() {
    if (!courseTitle.trim()) return;
    const id = uid();
    const newC = {
      id,
      title: courseTitle.trim(),
      category: courseCategory.trim() || undefined,
      description: courseDescription.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setCourses(prev => [newC, ...prev]);
    setCourseTitle("");
    setCourseCategory("");
    setCourseDescription("");
  }

  const enrollCount = (courseId) => students.filter(s => s.courseIds.includes(courseId)).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-900 text-white grid place-content-center shadow">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Painel de Cursos</h1>
            <p className="text-sm text-gray-500">Gerencie alunos e trilhas de aprendizagem</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddStudent} className="px-3 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2"><UserPlus className="h-4 w-4" /> Adicionar Aluno</button>
          <button onClick={handleCreateCourse} className="px-3 py-2 rounded-lg border border-gray-300 flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Criar Curso</button>
          <a href="#meus-cursos" className="px-3 py-2 rounded-lg bg-gray-200 flex items-center gap-2"><Library className="h-4 w-4" /> Meus Cursos</a>
        </div>
      </header>

      <main>
        <section id="meus-cursos">
          <h2 className="text-lg font-semibold mb-3">Cursos</h2>
          <div className="relative w-full md:max-w-sm mb-4">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar curso por título ou categoria" className="pl-9 pr-3 py-2 border rounded-lg w-full" />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {filteredCourses.length === 0 ? (
            <div className="p-6 border rounded-lg text-center text-gray-600">Nenhum curso encontrado. Crie um novo curso para começar.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((c) => (
                <div key={c.id} className="p-4 border rounded-lg bg-white shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold truncate">{c.title}</h3>
                    {c.category && <span className="px-2 py-1 text-xs bg-gray-200 rounded-lg">{c.category}</span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{c.description || "Sem descrição."}</p>
                  <p className="text-xs text-gray-500 mb-1">Criado em {new Date(c.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm">Matriculados: <span className="font-semibold">{enrollCount(c.id)}</span></p>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1 border rounded-lg text-sm">Gerenciar</button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">Abrir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Alunos</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">Nome</th>
                <th className="border border-gray-300 px-2 py-1 text-left">E-mail</th>
                <th className="border border-gray-300 px-2 py-1 text-left">Cursos</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="border border-gray-300 px-2 py-1">{s.name}</td>
                  <td className="border border-gray-300 px-2 py-1">{s.email || "—"}</td>
                  <td className="border border-gray-300 px-2 py-1">
                    {s.courseIds.length === 0 && <span className="px-2 py-1 text-xs border rounded-lg">Sem matrícula</span>}
                    {s.courseIds.map((cid) => {
                      const course = courses.find(c => c.id === cid);
                      return <span key={cid} className="ml-1 px-2 py-1 text-xs bg-gray-200 rounded-lg">{course?.title || "Curso"}</span>;
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg bg-white shadow">
            <h3 className="font-semibold mb-1">Total de Cursos</h3>
            <div className="text-3xl font-bold">{courses.length}</div>
          </div>
          <div className="p-4 border rounded-lg bg-white shadow">
            <h3 className="font-semibold mb-1">Total de Alunos</h3>
            <div className="text-3xl font-bold">{students.length}</div>
          </div>
          <div className="p-4 border rounded-lg bg-white shadow">
            <h3 className="font-semibold mb-1">Matrículas</h3>
            <div className="text-3xl font-bold">{students.reduce((acc, s)=> acc + s.courseIds.length, 0)}</div>
          </div>
        </section>
      </main>

      <footer className="mt-10 text-xs text-gray-500 text-center">
        Feito com ❤ para o fluxo do Eddy. Protótipo local sem backend.
      </footer>
    </div>
  );
}
