"use client";

import FilaUsuario, { type Usuario } from "./fila-usuario";

export default function ListaUsuarios({ usuarios, idUsuarioActual }: { usuarios: Usuario[]; idUsuarioActual: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Alias</th>
            <th>Correo</th>
            <th>Tipo</th>
            <th>Creado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <div className="empty-state">
                  <div className="empty-title">Sin usuarios</div>
                </div>
              </td>
            </tr>
          ) : (
            usuarios.map((u) => <FilaUsuario key={u.id} usuario={u} esUsuarioActual={u.id === idUsuarioActual} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
