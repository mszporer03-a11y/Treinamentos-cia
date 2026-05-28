"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, X, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";

type Employee = { id: string; name: string; role: string; storeId: string };
type Store = { id: string; name: string; code: string };
type ShiftEntry = { type: string; startTime?: string; endTime?: string };
type Schedule = { id: string; storeId: string; weekStart: string; shifts: { employeeId: string; dayIndex: number; type: string; startTime?: string; endTime?: string }[] };

const SHIFT_TYPES = [
  { value: "MANHA",    label: "Manhã",    time: "06:00–15:00", color: "bg-blue-100 text-blue-700" },
  { value: "TARDE",    label: "Tarde",    time: "14:00–23:00", color: "bg-orange-100 text-orange-700" },
  { value: "NOITE",    label: "Noite",    time: "18:00–03:00", color: "bg-indigo-100 text-indigo-700" },
  { value: "INTEGRAL", label: "Integral", time: "08:00–17:00", color: "bg-purple-100 text-purple-700" },
  { value: "FOLGA",    label: "Folga",    time: "Dia de folga", color: "bg-gray-100 text-gray-500" },
];

const ROLE_LABEL: Record<string, string> = {
  CHURRASQUEIRO: "Churrasqueiro", AUXILIAR_CHURRASCO: "Aux. Churrasco",
  CAIXA: "Caixa", GERENTE_OPERACIONAL: "Gerente Op.", ASG: "ASG", OUTRO: "Outro",
};

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

export default function SchedulePage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [draft, setDraft] = useState<Record<string, Record<number, ShiftEntry>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: "", role: "CHURRASQUEIRO", contact: "" });

  useEffect(() => {
    fetch("/api/stores").then((r) => r.json()).then((s) => {
      setStores(s);
      if (s.length > 0) setCurrentStore(s[0]);
    });
  }, []);

  useEffect(() => {
    if (!currentStore) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/employees?storeId=${currentStore.id}`).then((r) => r.json()),
      fetch(`/api/schedules?storeId=${currentStore.id}&weekStart=${weekStart.toISOString()}`).then((r) => r.json()),
    ]).then(([emps, scheds]) => {
      setEmployees(emps.filter((e: Employee & { active?: boolean }) => e.active !== false));
      const sched = scheds.find((s: Schedule) => new Date(s.weekStart).toDateString() === weekStart.toDateString());
      setSchedule(sched ?? null);
      // Build draft from existing schedule
      const d: Record<string, Record<number, ShiftEntry>> = {};
      if (sched) {
        for (const shift of sched.shifts) {
          if (!d[shift.employeeId]) d[shift.employeeId] = {};
          d[shift.employeeId][shift.dayIndex] = { type: shift.type, startTime: shift.startTime, endTime: shift.endTime };
        }
      }
      setDraft(d);
      setLoading(false);
    });
  }, [currentStore, weekStart]);

  function setShift(empId: string, dayIdx: number, type: string) {
    const shiftInfo = SHIFT_TYPES.find((s) => s.value === type)!;
    const [start, end] = shiftInfo.time !== "Dia de folga" ? shiftInfo.time.split("–") : ["", ""];
    setDraft((prev) => ({
      ...prev,
      [empId]: { ...(prev[empId] ?? {}), [dayIdx]: { type, startTime: start, endTime: end } },
    }));
  }

  async function saveSchedule() {
    if (!currentStore) return;
    setSaving(true);
    const shifts = [];
    for (const [empId, days] of Object.entries(draft)) {
      for (const [dayIdx, entry] of Object.entries(days)) {
        shifts.push({ employeeId: empId, dayIndex: parseInt(dayIdx), ...entry });
      }
    }
    await fetch("/api/schedules", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: currentStore.id, weekStart: weekStart.toISOString(), shifts }),
    });
    setSaving(false);
  }

  async function addEmployee() {
    if (!currentStore || !newEmp.name) return;
    const res = await fetch("/api/employees", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: currentStore.id, ...newEmp }),
    });
    const emp = await res.json();
    setEmployees((prev) => [...prev, emp]);
    setNewEmp({ name: "", role: "CHURRASQUEIRO", contact: "" });
    setShowAddEmployee(false);
  }

  // CLT 6x1 validation
  function validateCLT(empId: string): string | null {
    const days = draft[empId] ?? {};
    const workDays = Object.values(days).filter((d) => d.type !== "FOLGA").length;
    const offDays = Object.values(days).filter((d) => d.type === "FOLGA").length;
    if (workDays > 6) return "Mais de 6 dias de trabalho (CLT 6x1)";
    if (workDays === 7) return "Sem dia de folga (CLT obrigatório)";
    return null;
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  if (!session?.user) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-blue-500" /> Escala de Trabalho
          </h1>
          <p className="text-gray-500 text-sm mt-1">Organize a escala semanal da sua equipe (CLT 6x1).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddEmployee(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
            <Plus className="h-4 w-4" /> Funcionário
          </button>
          <button disabled={saving} onClick={saveSchedule} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? "Salvando..." : "Salvar Escala"}
          </button>
        </div>
      </div>

      {/* Store selector + week navigator */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {stores.length > 1 && (
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            value={currentStore?.id ?? ""} onChange={(e) => setCurrentStore(stores.find((s) => s.id === e.target.value) ?? null)}>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setWeekStart(addWeeks(weekStart, -1))} className="p-2 hover:bg-gray-50 transition">
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          <span className="px-3 text-sm font-medium text-gray-700">
            {weekDays[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – {weekDays[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="p-2 hover:bg-gray-50 transition">
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <button onClick={() => setWeekStart(getMondayOfWeek(new Date()))} className="text-sm text-blue-600 hover:underline">Esta semana</button>
      </div>

      {showAddEmployee && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Novo Funcionário</h3>
            <button onClick={() => setShowAddEmployee(false)}><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome" value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} />
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}>
              {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="flex gap-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                placeholder="Contato (opcional)" value={newEmp.contact} onChange={(e) => setNewEmp({ ...newEmp, contact: e.target.value })} />
              <button disabled={!newEmp.name} onClick={addEmployee}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum funcionário cadastrado.</p>
          <button onClick={() => setShowAddEmployee(true)} className="mt-3 text-sm text-blue-600 hover:underline">+ Adicionar funcionário</button>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[160px]">Funcionário</th>
                {weekDays.map((d, i) => (
                  <th key={i} className="text-center px-2 py-3 font-medium text-gray-600 min-w-[100px]">
                    <p>{DAYS[i]}</p>
                    <p className="text-xs font-normal text-gray-400">{d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map((emp) => {
                const warning = validateCLT(emp.id);
                return (
                  <tr key={emp.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500">{ROLE_LABEL[emp.role]}</p>
                      {warning && <p className="text-xs text-red-500 mt-0.5">⚠ {warning}</p>}
                    </td>
                    {Array.from({ length: 7 }, (_, dayIdx) => {
                      const entry = draft[emp.id]?.[dayIdx];
                      const shiftInfo = entry ? SHIFT_TYPES.find((s) => s.value === entry.type) : null;
                      return (
                        <td key={dayIdx} className="px-1 py-2 text-center">
                          <select
                            className={`w-full text-xs rounded-lg px-1 py-1.5 border focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer
                              ${shiftInfo ? shiftInfo.color : "bg-white text-gray-400 border-gray-200"}`}
                            value={entry?.type ?? ""}
                            onChange={(e) => e.target.value ? setShift(emp.id, dayIdx, e.target.value) : setDraft((prev) => {
                              const n = { ...prev };
                              if (n[emp.id]) { delete n[emp.id][dayIdx]; }
                              return n;
                            })}
                          >
                            <option value="">—</option>
                            {SHIFT_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
            {SHIFT_TYPES.map((s) => (
              <span key={s.value} className={`px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>{s.label}: {s.time}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
