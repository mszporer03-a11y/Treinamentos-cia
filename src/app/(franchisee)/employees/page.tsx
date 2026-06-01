"use client";

import { useEffect, useState } from "react";
import { Users, Plus, X, BookOpen, CheckCircle2, Circle, GraduationCap } from "lucide-react";
import { useSession } from "next-auth/react";

type Employee = { id: string; name: string; role: string; active: boolean };
type Training = { id: string; assignedAt: string; completedAt: string | null; material: { id: string; title: string; fileType: string } };
type Material = { id: string; title: string; fileType: string; category: { name: string } };

const ROLE_LABEL: Record<string, string> = {
  CHURRASQUEIRO: "Churrasqueiro", AUXILIAR_CHURRASCO: "Aux. Churrasco",
  CAIXA: "Caixa", GERENTE_OPERACIONAL: "Gerente Op.", ASG: "ASG", OUTRO: "Outro",
};

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [trainings, setTrainings] = useState<Record<string, Training[]>>({});
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [assignMaterialId, setAssignMaterialId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/employees").then((r) => r.json()),
      fetch("/api/materials").then((r) => r.json()).catch(() => []),
    ]).then(([emps, mats]) => {
      setEmployees(emps);
      setMaterials(mats);
      setLoading(false);
    });
  }, []);

  async function loadTrainings(empId: string) {
    if (trainings[empId]) return;
    const data = await fetch(`/api/employees/${empId}/training`).then((r) => r.json());
    setTrainings((prev) => ({ ...prev, [empId]: data }));
  }

  async function assignTraining() {
    if (!selectedEmp || !assignMaterialId) return;
    const res = await fetch(`/api/employees/${selectedEmp}/training`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId: assignMaterialId }),
    });
    const t = await res.json();
    const mat = materials.find((m) => m.id === assignMaterialId);
    const newTraining: Training = { ...t, material: { id: mat!.id, title: mat!.title, fileType: mat!.fileType } };
    setTrainings((prev) => ({ ...prev, [selectedEmp]: [...(prev[selectedEmp] ?? []), newTraining] }));
    setAssignMaterialId(""); setShowAssign(false);
  }

  async function markComplete(empId: string, materialId: string) {
    await fetch(`/api/employees/${empId}/training`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId }),
    });
    setTrainings((prev) => ({
      ...prev,
      [empId]: prev[empId].map((t) => t.material.id === materialId ? { ...t, completedAt: new Date().toISOString() } : t),
    }));
  }

  if (!session?.user) return null;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-violet-500" /> Treinamento de Colaboradores
        </h1>
        <p className="text-gray-500 text-sm mt-1">Atribua e acompanhe os treinamentos da sua equipe.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum funcionário cadastrado.</p>
          <p className="text-sm mt-1">Adicione funcionários na página de Escala.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => {
            const isSelected = selectedEmp === emp.id;
            const empTrainings = trainings[emp.id] ?? [];
            const done = empTrainings.filter((t) => t.completedAt).length;

            return (
              <div key={emp.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => {
                    const next = isSelected ? null : emp.id;
                    setSelectedEmp(next);
                    if (next) loadTrainings(next);
                    setShowAssign(false);
                  }}>
                  <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-violet-700 font-bold text-sm">{emp.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABEL[emp.role]}</p>
                  </div>
                  {trainings[emp.id] && (
                    <span className="text-xs text-gray-500">{done}/{empTrainings.length} concluídos</span>
                  )}
                </div>

                {isSelected && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    {empTrainings.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Nenhum treinamento atribuído.</p>
                    ) : (
                      <div className="space-y-2">
                        {empTrainings.map((t) => (
                          <div key={t.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                            <button onClick={() => !t.completedAt && markComplete(emp.id, t.material.id)}>
                              {t.completedAt
                                ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                : <Circle className="h-5 w-5 text-gray-300 hover:text-violet-400 transition" />}
                            </button>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${t.completedAt ? "line-through text-gray-400" : "text-gray-900"}`}>{t.material.title}</p>
                              {t.completedAt && <p className="text-xs text-green-600">Concluído em {new Date(t.completedAt).toLocaleDateString("pt-BR")}</p>}
                            </div>
                            <BookOpen className="h-4 w-4 text-gray-300 shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}

                    {showAssign && selectedEmp === emp.id ? (
                      <div className="flex gap-2">
                        <select className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          value={assignMaterialId} onChange={(e) => setAssignMaterialId(e.target.value)}>
                          <option value="">Selecionar treinamento...</option>
                          {materials.filter((m) => !empTrainings.some((t) => t.material.id === m.id)).map((m) => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                          ))}
                        </select>
                        <button disabled={!assignMaterialId} onClick={assignTraining}
                          className="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition">Atribuir</button>
                        <button onClick={() => setShowAssign(false)} className="p-2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setShowAssign(true)}
                        className="flex items-center gap-1.5 text-sm text-violet-600 hover:underline">
                        <Plus className="h-4 w-4" /> Atribuir treinamento
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
