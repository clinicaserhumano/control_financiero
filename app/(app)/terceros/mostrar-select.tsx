"use client";

export default function MostrarSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      name="mostrar"
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="finput !w-auto !py-1.5 text-xs"
    >
      <option value="activos">Solo activos</option>
      <option value="todos">Todos</option>
      <option value="inactivos">Solo inactivos</option>
    </select>
  );
}
