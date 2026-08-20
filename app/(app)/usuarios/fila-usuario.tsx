"use client";

import { useState, useTransition } from "react";
import { fmtDate } from "@/lib/calculos";
import { ROL_LABEL, type Rol } from "@/lib/auth/roles";
import { actualizarUsuario } from "./actions";

export type Usuario = { id: string; email: string; alias: string; rol: Rol; creado_en: string };

export default function FilaUsuario({ usuario, esUsuarioActual }: { usuario: Usuario; esUsuarioActual: boolean }) {
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function guardar(formData: FormData) {
    startTransition(async () => {
      const result = await actualizarUsuario(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setError("");
        setEditando(false);
      }
    });
  }

  if (!editando) {
    return (
      <tr>
        <td className="font-semibold">{usuario.alias}</td>
        <td className="text-muted">{usuario.email}</td>
        <td>
          <span className={"pill" + (usuario.rol === "visor" ? " pill-warning" : "")}>{ROL_LABEL[usuario.rol]}</span>
          {esUsuarioActual && <span className="fhint" style={{ display: "inline", marginLeft: 6 }}>(tú)</span>}
        </td>
        <td>{fmtDate(usuario.creado_en.slice(0, 10))}</td>
        <td>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setEditando(true)}>
            Editar
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={5}>
        <form action={guardar} className="flex flex-wrap gap-3 items-end py-1.5">
          <input type="hidden" name="userId" value={usuario.id} />
          <div className="field mb-0" style={{ minWidth: 140 }}>
            <label className="flabel">Alias</label>
            <input name="alias" type="text" required defaultValue={usuario.alias} className="finput" />
          </div>
          <div className="field mb-0" style={{ minWidth: 160 }}>
            <label className="flabel">Tipo de cuenta</label>
            {esUsuarioActual ? (
              <>
                <input type="hidden" name="rol" value={usuario.rol} />
                <input type="text" disabled value={ROL_LABEL[usuario.rol]} className="finput" title="No puedes cambiar tu propio tipo de cuenta" />
              </>
            ) : (
              <select name="rol" defaultValue={usuario.rol} className="finput">
                <option value="visor">Solo lectura</option>
                <option value="admin">Administrador</option>
              </select>
            )}
          </div>
          <div className="field mb-0" style={{ minWidth: 180 }}>
            <label className="flabel">Nueva clave (opcional)</label>
            <input name="password" type="text" minLength={6} className="finput" placeholder="Dejar en blanco para no cambiar" />
          </div>
          <button type="submit" disabled={pending} className="btn-primary btn-sm">
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => {
              setEditando(false);
              setError("");
            }}
          >
            Cancelar
          </button>
          {error && <div className="alert-error basis-full">{error}</div>}
        </form>
      </td>
    </tr>
  );
}
