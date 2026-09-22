"use client";

import { useActionState, useState } from "react";
import { actualizarConfiguracion, type ConfiguracionState } from "./actions";
import { esHexValido } from "@/lib/color";
import { TEMAS_OSCUROS, esTemaOscuroValido, TEMA_OSCURO_POR_DEFECTO, type TemaOscuroId } from "@/lib/temas-oscuros";
import type { Configuracion } from "@/lib/types";

export default function ConfiguracionForm({ configuracion }: { configuracion: Configuracion }) {
  const [state, formAction, pending] = useActionState<ConfiguracionState, FormData>(actualizarConfiguracion, null);
  const [colorPrimario, setColorPrimario] = useState(configuracion.color_primario);
  const [colorHeader, setColorHeader] = useState(configuracion.color_header);
  const [temaOscuro, setTemaOscuro] = useState<TemaOscuroId>(
    esTemaOscuroValido(configuracion.tema_oscuro) ? configuracion.tema_oscuro : TEMA_OSCURO_POR_DEFECTO
  );
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    setPreviewLogo(archivo ? URL.createObjectURL(archivo) : null);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="field mb-0">
        <label className="flabel flabel-req" htmlFor="nombre_empresa">
          Nombre / Razón social
        </label>
        <input
          id="nombre_empresa"
          name="nombre_empresa"
          type="text"
          required
          defaultValue={configuracion.nombre_empresa}
          className="finput"
        />
        <div className="fhint">
          Aparece en el encabezado, la pantalla de inicio de sesión, el título de la pestaña del navegador y los
          documentos impresos.
        </div>
      </div>

      <div className="field mb-0">
        <label className="flabel" htmlFor="logo">
          Logo
        </label>
        <div className="flex items-center gap-3">
          <div className="w-[130px] h-[65px] flex-none rounded-lg border border-border flex items-center justify-center bg-[var(--color-surface-2)] overflow-hidden">
            {previewLogo || configuracion.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewLogo || configuracion.logo_url || ""}
                alt="Logo actual"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-muted">Sin logo</span>
            )}
          </div>
          <input id="logo" name="logo" type="file" accept="image/*" onChange={onLogoChange} className="finput" />
        </div>
        <div className="fhint">
          Tamaño recomendado: <b>400 × 160 px</b> (proporción 2.5:1), formato PNG con fondo transparente, máximo{" "}
          <b>2 MB</b> — así se ve bien tanto en el encabezado oscuro como en la pantalla de inicio de sesión clara y
          en los documentos impresos. Déjalo vacío para no cambiar el logo actual.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="field mb-0">
          <label className="flabel" htmlFor="color_primario_texto">
            Color principal
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Elegir color principal"
              value={esHexValido(colorPrimario) ? colorPrimario : "#fc6b12"}
              onChange={(e) => setColorPrimario(e.target.value)}
              className="w-[42px] h-[38px] rounded-md border border-border cursor-pointer p-0.5 flex-none"
            />
            <input
              id="color_primario_texto"
              name="color_primario"
              type="text"
              value={colorPrimario}
              onChange={(e) => setColorPrimario(e.target.value)}
              placeholder="#fc6b12"
              className="finput mono"
            />
          </div>
          <div className="fhint">Botones principales, pestaña activa, resaltados.</div>
        </div>

        <div className="field mb-0">
          <label className="flabel" htmlFor="color_header_texto">
            Color del encabezado
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Elegir color del encabezado"
              value={esHexValido(colorHeader) ? colorHeader : "#2b2420"}
              onChange={(e) => setColorHeader(e.target.value)}
              className="w-[42px] h-[38px] rounded-md border border-border cursor-pointer p-0.5 flex-none"
            />
            <input
              id="color_header_texto"
              name="color_header"
              type="text"
              value={colorHeader}
              onChange={(e) => setColorHeader(e.target.value)}
              placeholder="#2b2420"
              className="finput mono"
            />
          </div>
          <div className="fhint">Fondo del encabezado y del menú de módulos.</div>
        </div>
      </div>

      <div className="field mb-0">
        <label className="flabel">Tema oscuro</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(Object.entries(TEMAS_OSCUROS) as [TemaOscuroId, (typeof TEMAS_OSCUROS)[TemaOscuroId]][]).map(([id, preset]) => (
            <label
              key={id}
              className={
                "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors " +
                (temaOscuro === id ? "border-primary bg-[var(--color-ghost-bg)]" : "border-border hover:border-primary/50")
              }
            >
              <input
                type="radio"
                name="tema_oscuro"
                value={id}
                checked={temaOscuro === id}
                onChange={() => setTemaOscuro(id)}
                className="flex-none"
              />
              <div className="w-[46px] h-[34px] rounded-md border border-border overflow-hidden flex flex-none">
                <div className="w-1/2 h-full" style={{ background: preset.paper }} />
                <div
                  className="w-1/2 h-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: preset.surface, color: preset.ink }}
                >
                  Aa
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-ink truncate">{preset.nombre}</div>
                <div className="text-[10.5px] text-muted truncate">{preset.descripcion}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="fhint">
          Se aplica cuando alguien active el modo oscuro (🌙, junto a la campanita) — no cambia el modo claro.
        </div>
      </div>

      {state && "error" in state && <div className="alert-error">{state.error}</div>}
      {state && "ok" in state && (
        <div className="text-[12.5px] font-semibold text-primary-dark">
          Guardado — los cambios ya se ven en toda la aplicación.
        </div>
      )}

      <div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}
