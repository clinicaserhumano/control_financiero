import { USUARIO_PROTEGIDO } from "@/lib/auth/roles";

const SECCIONES = [
  { id: "bienvenida", titulo: "Bienvenida" },
  { id: "entrar", titulo: "Cómo entrar" },
  { id: "pantalla", titulo: "Partes de la pantalla" },
  { id: "buscador", titulo: "Buscador global (Ctrl+K)" },
  { id: "dashboard", titulo: "Dashboard" },
  { id: "cuentas", titulo: "Cuentas bancarias" },
  { id: "ingresos", titulo: "Registrar un ingreso" },
  { id: "egresos", titulo: "Registrar un egreso" },
  { id: "filtros", titulo: "Filtros y búsqueda en tiempo real" },
  { id: "numeros", titulo: "N° de egreso y cheques" },
  { id: "anular", titulo: "Anular un movimiento" },
  { id: "editar-detalle", titulo: "Corregir un dato menor sin anular" },
  { id: "personal", titulo: "Personal (Proveedores, Servicios, Afiliados)" },
  { id: "horario", titulo: "Horario de Personal" },
  { id: "bitacora", titulo: "Bitácora semanal" },
  { id: "estado-cuenta", titulo: "Estado de cuenta de una persona" },
  { id: "cxp", titulo: "Cuentas por Pagar" },
  { id: "reportes", titulo: "Reportes e impresión" },
  { id: "notas", titulo: "Notas y Recordatorios" },
  { id: "usuarios", titulo: "Usuarios (solo Administrador)" },
  { id: "auditoria", titulo: "Historial de auditoría (solo Administrador)" },
  { id: "configuracion", titulo: "Configuración (solo Administrador)" },
  { id: "lectura", titulo: "Modo Solo lectura" },
  { id: "consejos", titulo: "Preguntas frecuentes" },
] as const;

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-20">
      <div className="card-h">
        <h2>{titulo}</h2>
      </div>
      <div className="card-b flex flex-col gap-3 text-[13.5px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="letras-box text-[12.5px]">{children}</div>;
}

function Esquema({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-dashed border-border bg-[var(--color-surface-2)] p-3.5 text-[12px]">
      {children}
    </div>
  );
}

export default function AyudaPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="hidden lg:flex flex-col gap-0.5 self-start lg:sticky lg:top-6 max-h-[calc(100vh-48px)] overflow-y-auto pr-2">
        {SECCIONES.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-[12px] font-semibold text-muted hover:text-primary rounded-md px-2.5 py-1.5 hover:bg-[var(--color-surface-2)]"
          >
            {s.titulo}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-5">
        <Seccion id="bienvenida" titulo="Bienvenida">
          <p>
            Este es el manual de uso de <b>Control Financiero — Ser Humano</b>. Está pensado para alguien que va a
            usar el sistema por primera vez, así que va paso a paso y explica cada pantalla con el nombre exacto de
            los botones y campos que vas a ver.
          </p>
          <Tip>
            No hay capturas de pantalla reales en este manual (no fue posible tomarlas), pero cada esquema que
            aparece más abajo usa los mismos nombres de botones y campos que el sistema real — vas a reconocerlos
            apenas los veas. Además, en cada pantalla del sistema hay un botoncito circular <b>ⓘ</b> junto al
            título — dale clic para ver un resumen express de esa pantalla sin salir de donde estás.
          </Tip>
          <p>
            La idea central del sistema es simple: <b>todo movimiento de dinero (lo que entra y lo que sale) vive en
            un solo lugar</b>. Ingresos y Egresos son solo dos formas de mirar esa misma lista, filtrada.
          </p>
        </Seccion>

        <Seccion id="entrar" titulo="Cómo entrar">
          <ol className="list-decimal pl-5 flex flex-col gap-1.5">
            <li>Abre la dirección del sistema en tu navegador.</li>
            <li>
              Escribe tu <b>correo</b> y tu <b>contraseña</b> en la pantalla de inicio de sesión.
            </li>
            <li>
              Dale clic a <b>Iniciar sesión</b>.
            </li>
          </ol>
          <p>
            Hay dos tipos de cuenta: <b>Administrador</b> (puede crear, editar y borrar todo) y{" "}
            <b>Solo lectura</b> (puede ver e imprimir todo, pero no puede cambiar nada — más detalles en la sección{" "}
            <a href="#lectura" className="text-primary-dark underline">
              Modo Solo lectura
            </a>
            ). Si no sabes cuál eres, mira arriba a la derecha del encabezado: ahí sale tu nombre y una etiqueta con
            tu tipo de cuenta.
          </p>
          <Tip>
            ¿Olvidaste tu contraseña o necesitas una cuenta nueva? Solo el Administrador puede crearlas y cambiarlas,
            desde la pestaña Usuarios (ver esa sección más abajo).
          </Tip>
        </Seccion>

        <Seccion id="pantalla" titulo="Partes de la pantalla">
          <p>Todas las pantallas del sistema comparten la misma estructura:</p>
          <Esquema>
            <div className="flex gap-1.5">
              <div className="rounded-md bg-carbon text-white px-2.5 py-2 text-[11px] flex flex-col gap-1.5 w-[110px] flex-none">
                <span className="font-bold mb-1">Logo · Nombre</span>
                <span>📊 Dashboard</span>
                <span>🏦 Cuentas</span>
                <span>👤 Personal</span>
                <span>💰 Ingresos</span>
                <span>💸 Egresos</span>
                <span className="text-primary mt-auto">❔ Cómo usar</span>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="rounded-md bg-header text-white px-3 py-2 flex items-center justify-between text-[11px]">
                  <span>🔍 · 🔔 · ☾ modo oscuro</span>
                  <span>TU NOMBRE · rol · Cerrar sesión</span>
                </div>
                <div className="rounded-md border border-border bg-[var(--color-surface)] px-3 py-4 text-center text-muted flex-1">
                  Aquí cambia el contenido según el módulo que elijas — busca el botón ⓘ junto al título
                </div>
              </div>
            </div>
          </Esquema>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Barra lateral (izquierda):</b> el logo/nombre arriba, los módulos en el medio, y{" "}
              <b>Cómo usar</b> abajo. La pestaña Usuarios/Auditoría/Configuración solo las ve el Administrador. En
              el celular es un botón ☰ flotante que abre el mismo panel.
            </li>
            <li>
              <b>« Compactar / » Expandir</b> (abajo de los módulos, en escritorio): reduce la barra lateral a solo
              íconos para ganar espacio de pantalla — el nombre de cada módulo aparece al pasar el mouse encima.
              Se recuerda la próxima vez que entres.
            </li>
            <li>
              <b>Encabezado (arriba, a la derecha):</b> el buscador 🔍, la campanita de notificaciones, el modo
              oscuro/claro, tu nombre/alias, tu tipo de cuenta y Cerrar sesión.
            </li>
            <li>
              <b>Campanita 🔔 de notificaciones:</b> avisa cuando hoy le toca pagar a alguien de Personal (según su
              día de pago configurado en su ficha) o cuando hay cuentas por pagar acumulándose.
            </li>
            <li>
              <b>Botón ⓘ (junto al título de cada sección):</b> un resumen express de qué hace esa pantalla y sus
              botones principales, con un enlace a la parte de este manual con más detalle.
            </li>
          </ul>
        </Seccion>

        <Seccion id="buscador" titulo="Buscador global (Ctrl+K)">
          <p>
            El ícono 🔍 en el encabezado (o el atajo <span className="mono">Ctrl+K</span> / <span className="mono">Cmd+K</span>{" "}
            en Mac) abre un buscador que revisa Personal, Movimientos y Cuentas a la vez — no hace falta saber de
            antemano en qué módulo está lo que buscas.
          </p>
          <p>
            Busca por nombre, cédula/RUC, concepto, N° de cheque o de egreso, y nombre/banco de una cuenta. Escribe
            al menos 2 letras; al hacer clic en un resultado te lleva directo a esa ficha, o al listado de
            Movimientos ya filtrado si es un movimiento.
          </p>
        </Seccion>

        <Seccion id="dashboard" titulo="Dashboard">
          <p>
            La primera pestaña es un resumen visual de solo lectura — no registra ni cambia nada, solo grafica lo
            que ya existe en Movimientos, Cuentas y Cuentas por Pagar.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              Las 5 tarjetas de arriba (ingresos y egresos del mes, saldo neto, pendiente por pagar, saldo en
              cuentas) siempre reflejan el estado real de <b>hoy</b>, sin importar el filtro de fechas.
            </li>
            <li>
              El filtro <b>Desde/Hasta</b> (por defecto, el año en curso) afecta el gráfico de tendencia mensual y
              los de categoría, forma de pago y top de beneficiarios.
            </li>
            <li>
              <b>Pendientes por antigüedad</b> es la excepción: no depende del filtro, siempre muestra todo lo que
              sigue pendiente hoy agrupado por cuántos días lleva esperando pago — útil para saber qué pagar primero.
            </li>
            <li>
              Pasa el mouse sobre cualquier barra o porción del gráfico de tendencia para ver el valor exacto. En
              las tarjetas de categoría, forma de pago y antigüedad puedes cambiar entre <b>▤ Barras</b> y{" "}
              <b>◔ Pastel</b> (el Top 10 se queda solo en barras: con 10 nombres, una torta no se lee bien).
            </li>
            <li>
              Cada tarjeta con gráfico trae su propio botón <b>⬇️ Descargar CSV</b>, con los mismos datos que ves
              graficados — se abre directo en Excel o Google Sheets.
            </li>
            <li>
              <b>Presupuestos del mes:</b> opcional — si no le pones un monto a una categoría, no se compara contra
              nada. Si le pones uno, la barra se pone ámbar cerca del límite y roja al pasarse, comparado contra lo
              gastado en esa categoría durante el mes calendario actual (no el filtro de fechas).
            </li>
          </ul>
        </Seccion>

        <Seccion id="cuentas" titulo="Cuentas bancarias">
          <p>
            Una cuenta en el sistema es una cuenta bancaria real (o la caja de efectivo) de una de las empresas de
            la clínica. Cada movimiento de dinero se registra contra una cuenta, y el sistema calcula solo el saldo
            de cada una.
          </p>
          <p>
            <b>Para crear una cuenta nueva:</b> ve a la pestaña Cuentas, llena el formulario de la izquierda
            (Empresa/Titular, RUC, Banco, Tipo de cuenta, N° de cuenta, y opcionalmente quién la elabora/aprueba), y
            dale a <b>Guardar cuenta</b>.
          </p>
          <p>
            En la lista de la derecha ves el <b>saldo actual</b> de cada cuenta. Dale a <b>Estado de cuenta</b> para
            entrar al detalle de esa cuenta, donde la tabla trae estas columnas:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>N°:</b> el número de egreso real de esa cuenta — el mismo número que usarías en el talonario físico
              de cheques. Cada cuenta lleva su propia numeración, independiente de las demás. Ver la sección{" "}
              <a href="#numeros" className="text-primary-dark underline">
                N° de egreso y cheques
              </a>
              .
            </li>
            <li>
              <b>Movimiento:</b> la forma de pago (Cheque, Efectivo, Transferencia, Tarjeta) o si es un Ingreso.
            </li>
            <li>
              <b>Detalle:</b> a quién corresponde (con enlace a su ficha si es Personal registrado) y el concepto.
            </li>
            <li>
              <b>Cheque / Ref.:</b> el número de cheque, de comprobante o de referencia bancaria de ese movimiento.
            </li>
            <li>
              <b>Ingreso, Egreso, Saldo:</b> el monto según corresponda, y el saldo acumulado de la cuenta después
              de ese movimiento — así puedes reconstruir el saldo día por día.
            </li>
          </ul>
          <p>
            Puedes filtrar por rango de fechas con los campos Desde/Hasta, y el botón{" "}
            <b>🖨️ Imprimir estado de cuenta</b> genera el mismo detalle listo para PDF.
          </p>
        </Seccion>

        <Seccion id="ingresos" titulo="Registrar un ingreso">
          <p>
            Ve a la pestaña Ingresos. El formulario de la izquierda tiene estos campos:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Tipo de movimiento:</b> la forma de pago (Efectivo, Cheque, Transferencia, Tarjeta). Según cuál
              elijas, aparecen campos extra propios de esa forma de pago (por ejemplo, el N° de comprobante en
              Tarjeta).
            </li>
            <li>
              <b>Fecha</b> y <b>Valor (USD)</b>.
            </li>
            <li>
              <b>Quién paga (opcional):</b> escribe el nombre del paciente o cliente. Es un campo libre — no hace
              falta que esté registrado en ningún lado, y el sistema te sugiere nombres que ya usaste antes.
            </li>
            <li>
              <b>Cuenta</b> y <b>Fecha de pago:</b> a qué cuenta bancaria entra el dinero.
            </li>
            <li>
              <b>Concepto:</b> una descripción corta de qué es el ingreso.
            </li>
          </ul>
          <p>
            Dale a <b>Guardar</b>. El ingreso aparece de inmediato en la lista de la derecha, donde puedes filtrar
            en tiempo real por fecha, cuenta, estado, o buscar por texto (ver la sección{" "}
            <a href="#filtros" className="text-primary-dark underline">
              Filtros y búsqueda en tiempo real
            </a>
            ), e imprimir un comprobante individual (con el ícono 🖨️) o un reporte del rango completo.
          </p>
          <p>
            Por defecto, Ingresos siempre abre mostrando <b>el día de hoy</b> — usa los botones{" "}
            <b>‹ Día anterior</b>, <b>Hoy</b> y <b>Día siguiente ›</b> para moverte día por día, o{" "}
            <b>Ver todo el historial</b> para quitar el filtro de fecha.
          </p>
        </Seccion>

        <Seccion id="egresos" titulo="Registrar un egreso">
          <p>
            Ve a la pestaña Egresos. Se parece al formulario de Ingresos, pero con algunas diferencias importantes:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>A favor de — Personal (opcional):</b> si le pagas a alguien que ya está registrado en{" "}
              <a href="#personal" className="text-primary-dark underline">
                Personal
              </a>{" "}
              (un empleado o proveedor), selecciónalo aquí.
            </li>
            <li>
              <b>O escribe un nombre (compra puntual, opcional):</b> si es alguien que no está registrado (una
              compra suelta, por ejemplo a una ferretería), simplemente escribe el nombre aquí en vez de usar el
              campo anterior.
            </li>
            <li>
              <b>Razón del egreso (opcional):</b> Luz, Agua, Internet u Otros — solo para servicios/utilidades. Si el
              egreso es un pago a Personal, deja esto vacío.
            </li>
            <li>
              <b>¿Ya se pagó?</b> Sí, pagar ahora registra el egreso como pagado de inmediato; No, queda pendiente lo
              deja como una deuda por pagar (aparece luego en{" "}
              <a href="#cxp" className="text-primary-dark underline">
                Cuentas por Pagar
              </a>
              ).
            </li>
            <li>
              <b>Cuenta y Fecha de pago:</b> igual que en Ingresos, pero si el Tipo de movimiento es Efectivo, no se
              pide cuenta — el efectivo no sale de ninguna cuenta bancaria registrada. Si eliges Cheque, además pide
              el <b>N° de cheque</b> (queda guardado y es lo que arma el N° de egreso — ver más abajo).
            </li>
            <li>
              <b>Descuento (opcional):</b> si hay que descontar algo del valor original (por ejemplo, una falta o un
              daño), escribe cuánto — el sistema muestra el cálculo (valor original menos descuento igual valor a
              pagar) y guarda ambos montos para que quede el registro.
            </li>
          </ul>
          <Tip>
            Cuando entras a Egresos desde la ficha de una persona específica (ver la sección Personal), este mismo
            formulario se llama Movimiento manual y ya no pregunta la razón del egreso, porque el pago ya está
            ligado directamente a esa persona.
          </Tip>
          <p>
            La lista de la derecha (“Egresos registrados”) trae columnas N° (ver{" "}
            <a href="#numeros" className="text-primary-dark underline">
              N° de egreso y cheques
            </a>
            ), Fecha, Tipo, Beneficiario (clicable si es Personal registrado), Cuenta, Cheque/Ref., Estado y Valor.
            Cada fila tiene su botón <b>🖨️ Imprimir</b> para el comprobante individual (la “papeleta”), salvo las
            filas anuladas.
          </p>
        </Seccion>

        <Seccion id="filtros" titulo="Filtros y búsqueda en tiempo real">
          <p>
            Tanto en Ingresos como en Egresos, la barra de filtros funciona <b>al instante</b>: apenas cambias una
            fecha, seleccionas una cuenta, una persona, una forma de pago o un estado, la tabla se actualiza sola —
            no hay que darle clic a ningún botón “Filtrar”.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Desde / Hasta:</b> rango de fechas.
            </li>
            <li>
              <b>Cuenta:</b> solo movimientos de esa cuenta bancaria.
            </li>
            <li>
              <b>Personal</b> (solo en Egresos): solo los pagos a esa persona.
            </li>
            <li>
              <b>Forma de pago:</b> Cheque, Efectivo, Transferencia, Tarjeta, etc.
            </li>
            <li>
              <b>Estado:</b> Todas, Confirmadas, Pendientes o Anuladas. Por defecto se muestran todas mezcladas
              (las anuladas salen atenuadas en gris — ver{" "}
              <a href="#anular" className="text-primary-dark underline">
                Anular un movimiento
              </a>
              ).
            </li>
            <li>
              <b>Buscar personal / concepto / N° / cheque:</b> escribe y la lista se filtra sola después de una
              breve pausa (para no buscar letra por letra). En Egresos, el buscador encuentra por el texto del
              concepto, por el <b>nombre de la persona</b> registrada como Personal (no hace falta que el nombre
              aparezca escrito en el concepto), por el <b>N° de egreso</b> y por el <b>N° de cheque/comprobante</b>.
            </li>
            <li>
              <b>Por página:</b> cuántas filas mostrar (5, 10, 50 o todas).
            </li>
          </ul>
          <p>
            Todos los filtros se combinan entre sí (son un “Y”, no un “O”): si tienes una fecha puesta Y una persona
            seleccionada, solo ves lo que cumple ambas cosas a la vez. Si una búsqueda no muestra resultados,
            revisa que no haya quedado un filtro de fecha muy angosto de una búsqueda anterior.
          </p>
          <Tip>
            El botón <b>Ver todo el historial</b> limpia todos los filtros de una sola vez y te deja viendo la lista
            completa sin fecha, cuenta, persona, forma de pago, estado ni búsqueda.
          </Tip>
        </Seccion>

        <Seccion id="numeros" titulo="N° de egreso y cheques">
          <p>
            Cada cuenta bancaria lleva su <b>propia numeración de egresos</b>, igual que un talonario de cheques
            físico: el primer egreso pagado desde esa cuenta es el N°1, el siguiente el N°2, y así sucesivamente —
            sin mezclarse con la numeración de otra cuenta.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Ese número es <b>estable</b>: una vez asignado a un egreso, no cambia después, aunque más adelante se registre otro egreso con una fecha anterior.</li>
            <li>
              Aparece como columna <b>N°</b> en el listado de Egresos, en el detalle de cada cuenta, en el Reporte
              de Egresos impreso, y como <b>“N° 45”</b> en grande en la papeleta/comprobante de cada egreso.
            </li>
            <li>
              El <b>N° de cheque</b> (o de comprobante/referencia, según la forma de pago) es un dato aparte: es el
              número físico impreso en el cheque o en el voucher. Se ve en la columna <b>Cheque / Ref.</b> y en el
              campo correspondiente de la papeleta.
            </li>
          </ul>
          <p>
            La papeleta de un egreso (el comprobante individual, tamaño media hoja) muestra arriba a la derecha
            “EGRESO DE {"{"}FORMA DE PAGO{"}"}” y el N° de egreso en grande. Si el pago viene de una bitácora de
            Servicios prestados, además aparece una línea con las <b>horas trabajadas y pagadas</b>.
          </p>
        </Seccion>

        <Seccion id="anular" titulo="Anular un movimiento">
          <p>
            Los movimientos <b>nunca se borran</b> — se anulan. Así queda el registro para auditoría (se sabe que
            existió y por qué se corrigió), pero deja de contar en los totales, en el saldo de la cuenta y en el
            saldo por pagar de la persona.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              El botón <b>Anular</b> está en cada fila de la lista de Ingresos/Egresos, en la ficha de Personal, y
              en Cuentas por Pagar (individual o en bloque, marcando varias filas). En Ingresos/Egresos también
              puedes marcar varias filas (confirmadas o pendientes) con la casilla de la izquierda y{" "}
              <b>🖨️ Imprimir seleccionados</b> o <b>Anular seleccionados</b> desde la barra que aparece abajo.
            </li>
            <li>
              El botón <b>🖨️ Imprimir rango (A4)</b>, arriba de la tabla, imprime todo lo que está filtrado en ese
              momento; junto a él, <b>⬇️ Descargar CSV</b> exporta esa misma lista filtrada para Excel o Sheets.
            </li>
            <li>
              Un movimiento anulado sale con la <b>fila atenuada en gris</b> en las listas, y ya no tiene botón
              Imprimir (no tiene sentido imprimir un comprobante de algo que se anuló).
            </li>
            <li>
              Si el egreso anulado venía de una semana de bitácora, esa semana vuelve a quedar “sin cargar” —
              puedes corregirla y volver a mandarla a cobro desde cero.
            </li>
          </ul>
          <Tip>
            ¿Te equivocaste en el <b>monto, la fecha, la cuenta o a quién corresponde</b>? Eso sigue sin poderse
            editar directo — anula el que está mal y crea uno nuevo con el dato correcto. Para un dato menor (el
            número de cheque, el concepto), ver{" "}
            <a href="#editar-detalle" className="text-primary-dark underline">
              Corregir un dato menor sin anular
            </a>
            .
          </Tip>
        </Seccion>

        <Seccion id="editar-detalle" titulo="Corregir un dato menor sin anular">
          <p>
            Si en un movimiento <b>ya confirmado</b> (ya pagado) se escribió mal el número de cheque/comprobante, el
            concepto, o las observaciones, no hace falta anularlo y volver a crearlo — el botón <b>Editar</b> (junto
            a Imprimir y Anular, solo aparece en movimientos confirmados) abre una pantalla para corregir
            exactamente esos datos.
          </p>
          <p>
            A propósito, esa pantalla <b>no deja tocar el valor, la fecha, la cuenta ni a quién corresponde</b> —
            esos campos aparecen bloqueados (en gris), con una nota explicando por qué: permitir cambiar el dinero
            de un movimiento ya pagado, sin dejar rastro de que se cambió, abriría la puerta a alterar el registro
            financiero después del hecho — justo lo que el sistema evita al no dejar borrar ni editar movimientos
            libremente. Si necesitas corregir precisamente uno de esos datos bloqueados, la única vía sigue siendo
            anular y crear uno nuevo (ver{" "}
            <a href="#anular" className="text-primary-dark underline">
              Anular un movimiento
            </a>
            ).
          </p>
          <p>El N° de egreso ya asignado tampoco se pierde ni cambia al editar estos datos.</p>
        </Seccion>

        <Seccion id="personal" titulo="Personal (Proveedores, Servicios prestados, Personal afiliado)">
          <p>
            La pestaña Personal agrupa a todas las personas y empresas con las que trabaja la clínica, en 3 grupos,
            cada uno con su propia pestaña:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Proveedores:</b> empresas o personas a las que se les compra algo (ferreterías, farmacias,
              contratistas, etc.).
            </li>
            <li>
              <b>Servicios prestados:</b> personal al que se le paga por hora, con bitácora semanal de asistencia
              (ver la siguiente sección).
            </li>
            <li>
              <b>Personal afiliado:</b> personal con sueldo fijo (no se les factura por hora).
            </li>
          </ul>
          <p>
            Para crear a alguien nuevo, llena el formulario de la izquierda: Nombre, Apellido, Cédula/RUC,
            Tarea/cargo, Grupo, y qué cuenta le paga habitualmente. Si el grupo es Servicios prestados, además pide
            el sueldo mensual, las horas al mes, y calcula solo el precio por hora.
          </p>
          <p>
            En la lista, el <b>nombre de cada persona es un enlace</b>: dale clic (o al botón <b>Ver ficha</b>) para
            entrar a su detalle, donde ves su saldo por pagar, puedes activarla/desactivarla (sin borrar su
            historial), editar sus datos, cargar su bitácora si aplica, asignarle un día de pago habitual (para que
            la campanita 🔔 avise), e imprimir su estado de cuenta o su horario.
          </p>
          <p>
            Ese mismo enlace al nombre de una persona también aparece en otras pantallas del sistema — en el
            listado de Egresos, en Cuentas por Pagar, en el detalle de una cuenta bancaria, y en Reportes — siempre
            que esa persona esté registrada como Personal (no aplica a beneficiarios escritos como texto libre).
          </p>
          <p>
            En la pestaña <b>Movimientos</b> de la ficha, cada fila <b>pendiente</b> trae una casilla a la
            izquierda — marca dos o más y dale a <b>Continuar con el pago</b> para <b>combinarlas en un solo pago</b>,
            igual que en Cuentas por Pagar. Te lleva a la misma pantalla de Registrar pago (forma de pago, cuenta,
            N° de cheque u otros campos según corresponda, y descuento si aplica), solo que el concepto y el valor
            ya vienen combinados con los de todos los movimientos seleccionados. El botón{" "}
            <b>🖨️ Imprimir seleccionados</b> saca un papel con esos mismos pendientes juntos (fecha, concepto y
            valor de cada uno, más el total) sin necesidad de registrar el pago todavía. También puedes anularlas
            en bloque.
          </p>
          <Tip>
            El color del nombre de Personal es un código: <b>naranja</b> significa registrado y activo,{" "}
            <b>gris</b> registrado pero dado de baja, y <b>negro/normal</b> significa que es un nombre libre, no
            registrado como Personal (no tiene ficha a la que ir).
          </Tip>
        </Seccion>

        <Seccion id="horario" titulo="Horario de Personal">
          <p>
            Para Servicios prestados y Personal afiliado puedes guardar su horario habitual (de Lunes a Domingo).
            Se edita desde el mismo formulario de Editar datos: marca con la casilla los días que se trabajan y
            llena su hora de entrada y salida — los días sin marcar quedan sin horario y sus campos se ven
            deshabilitados. Puedes dejarlo en blanco y completarlo después, o cambiarlo cuando cambie el horario de
            esa persona. El botón <b>Repetir horario del Lunes en todos los días</b> copia esa misma hora a los
            demás días marcados, para no escribirla siete veces.
          </p>
          <p>
            El horario aparece arriba en la ficha de la persona. Y desde ahí mismo, el botón{" "}
            <b>🖨️ Imprimir horario</b> genera un reporte con el horario establecido arriba, y abajo cada semana de
            bitácora registrada con sus horas trabajadas día por día y el total acumulado.
          </p>
          <p>
            También puedes asignarle un <b>día de pago habitual</b> (semanal, quincenal o mensual) desde el botón
            correspondiente en su ficha — eso es lo que activa el aviso de la campanita 🔔 el día que le toca cobrar.
          </p>
        </Seccion>

        <Seccion id="bitacora" titulo="Bitácora semanal">
          <p>
            Solo para Servicios prestados (personal que se paga por hora). Dentro de su ficha, en la pestaña
            Bitácora semanal, dale a Agregar semana para crear una semana nueva, y llena cada día con la hora de
            entrada, salida, y minutos de almuerzo si aplica. Los días que trae la semana nueva son los que esa
            persona tiene marcados en su horario habitual (si no tiene horario configurado, trae Lunes a Sábado por
            defecto).
          </p>
          <p>
            El sistema calcula solo las horas trabajadas de cada día (necesita que tenga AMBAS horas, entrada y
            salida, para contar ese día) y el valor total de la semana según el precio por hora de esa persona.
            Cuando estés listo para pagar esa semana, el botón de la semana te lleva directo al formulario de pago ya
            con el monto calculado.
          </p>
          <p>
            Si se te acumularon varias semanas sin pagar, puedes <b>marcar varias y cargarlas juntas</b> en un solo
            cargo (una sola cuenta por pagar) en vez de una por semana — útil para saldar todo de una vez con un
            solo cheque.
          </p>
          <p>
            Al registrar el pago de Servicios prestados (y solo ahí, no en Proveedores ni Personal afiliado)
            aparece la casilla <b>Incluir IVA (15%)</b>: al marcarla, suma el 15% al valor a pagar y agrega{" "}
            <b>&quot;+ IVA&quot;</b> al concepto automáticamente. También aparece al combinar varias semanas en un
            solo pago (siempre que todas sean de la misma persona de Servicios prestados) — ahí el 15% se calcula
            sobre cada semana por separado, no sobre el total ya sumado, así cada una queda con su valor real.
          </p>
          <p>
            El campo <b>Retención (%)</b> (Servicios prestados y también Proveedores) funciona distinto al
            descuento: no es que se deba menos, es que la clínica retiene ese % como anticipo del impuesto de la
            otra persona y lo declara aparte al SRI — por eso hay que escribir el % a mano (varía según el tipo de
            pago; pregúntale a tu contador si no lo sabes), a diferencia del IVA que siempre es 15%. Se calcula
            sobre el valor sin IVA, y se resta del valor a pagar junto con el descuento si también hay.
          </p>
        </Seccion>

        <Seccion id="estado-cuenta" titulo="Estado de cuenta de una persona">
          <p>
            Desde la ficha de cualquier Personal, el botón <b>🖨️ Imprimir estado de cuenta</b> (antes se llamaba
            “Imprimir reporte”) genera un documento con columnas Fecha, Concepto, Valor, Abono, Saldo y
            Observación — igual al de un estado de cuenta bancario real.
          </p>
          <p>Cada movimiento ya pagado aparece en <b>dos filas</b>, no una:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              Una fila de <b>cargo</b> (cuando se generó la deuda: se prestó el servicio o se cerró la semana de
              bitácora): sale en la columna Valor, suma al Saldo, y en Observación muestra las{" "}
              <b>horas trabajadas</b> de ese período (y cuántas semanas se combinaron, si se cargaron juntas). Si el
              cargo es de antes de usar la bitácora y no hay horas registradas día por día, el sistema{" "}
              <b>estima las horas</b> dividiendo el monto pagado entre el precio por hora de la persona.
            </li>
            <li>
              Una fila de <b>abono</b> (cuando se pagó): sale en la columna Abono, resta del Saldo (lo deja en
              $0.00 si el cargo quedó saldado por completo), y en Observación muestra el{" "}
              <b>número de cheque</b> (o la forma de pago) junto con el <b>N° de egreso</b> real de esa cuenta —
              por ejemplo “Cheque 000052 · Egreso N° 45”.
            </li>
          </ul>
          <p>
            Un cargo que <b>todavía no se ha pagado</b> solo aporta su fila de cargo — ese Saldo que nunca vuelve a
            bajar es exactamente lo que se le debe a esa persona (su “saldo x pagar”), y coincide con el pie de
            página del documento.
          </p>
          <p>
            La misma tabla, con el mismo cálculo, también se puede ver <b>en pantalla</b> (sin imprimir) desde la
            pestaña Reportes, modo “Por Personal”.
          </p>
        </Seccion>

        <Seccion id="cxp" titulo="Cuentas por Pagar">
          <p>
            Aquí ves todos los egresos que quedaron pendientes (los que registraste como No, queda pendiente).
            Puedes:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Filtrar por fecha, y darle a Registrar pago en un pendiente individual para pagarlo.</li>
            <li>
              Marcar dos o más con las casillas de la izquierda y darle a <b>Continuar con el pago</b> para
              combinarlos en un solo pago — lleva a la misma pantalla de Registrar pago (forma de pago, cuenta, N°
              de cheque, descuento) con el concepto y el valor ya combinados. También puedes anularlos en bloque.
            </li>
            <li>
              Con la selección marcada, el botón <b>🖨️ Imprimir seleccionados</b> saca un papel con esos pendientes
              juntos (pueden ser de distintas personas) y su total, sin registrar el pago todavía.
            </li>
            <li>
              Dar clic al nombre de una persona (si está registrada como Personal) para ir directo a su ficha.
            </li>
            <li>
              El botón <b>🖨️ Saldo pendiente</b> en cada fila (solo si es Personal registrado) imprime un papel
              corto con únicamente lo que esa persona debe cobrar, sin el historial de lo ya pagado.
            </li>
            <li>Imprimir el listado completo.</li>
            <li>
              El botón <b>⬇️ Descargar CSV</b> (junto a Imprimir) exporta lo que está filtrado en ese momento, listo
              para abrir en Excel o Google Sheets.
            </li>
          </ul>
          <Tip>
            Si algo aparece aquí como pendiente pero en realidad ya se pagó por otro lado (un duplicado de
            captura), no lo dejes así ni lo borres — anúlalo. Así sale de la lista de pendientes pero el sistema
            conserva el registro de que existió.
          </Tip>
        </Seccion>

        <Seccion id="reportes" titulo="Reportes e impresión">
          <p>La pestaña Reportes tiene 4 modos, arriba en pestañas:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Por cuenta:</b> el detalle de una cuenta bancaria específica en un rango de fechas, con N° de
              egreso y cheque/referencia de cada movimiento.
            </li>
            <li>
              <b>Por Personal:</b> el estado de cuenta de una persona específica, con cargo y abono en filas
              separadas y saldo corrido — igual al explicado en{" "}
              <a href="#estado-cuenta" className="text-primary-dark underline">
                Estado de cuenta de una persona
              </a>
              .
            </li>
            <li>
              <b>General (todo):</b> todas las cuentas agrupadas con sus movimientos del período, y abajo todo el
              Personal con saldo pendiente, en un solo documento.
            </li>
            <li>
              <b>Horarios:</b> selecciona a quiénes incluir e imprime solo su horario establecido, sin el detalle
              día por día de la bitácora.
            </li>
          </ul>
          <p>
            Elige el modo, selecciona la cuenta o persona (si aplica) y el rango de fechas si quieres, y dale a{" "}
            <b>Generar</b>. La tabla completa aparece <b>ahí mismo en la pantalla</b> — ya no hace falta imprimir
            solo para ver los datos. El botón grande <b>🖨️ Imprimir reporte</b>, justo arriba de la tabla, abre la
            versión lista para imprimir o guardar como PDF, con el mismo contenido que ves en pantalla, el logo de
            la clínica arriba a la izquierda y quién generó el documento al pie de la página. Junto a ese botón,{" "}
            <b>⬇️ Descargar CSV</b> exporta la misma tabla para abrir en Excel o Google Sheets.
          </p>
          <p>
            En <b>Por cuenta</b> y <b>Por Personal</b>, el rango Desde/Hasta filtra qué filas se muestran e
            imprimen, pero el <b>saldo</b> de cada fila y el total pendiente siempre se calculan sobre{" "}
            <b>todo el historial</b> — así nunca se ve un saldo que no cuadra por haber cortado fechas de en medio.
          </p>
          <p>
            En <b>Por Personal</b>, además del reporte completo, el botón <b>🖨️ Imprimir solo el saldo pendiente</b>{" "}
            genera un papel corto con únicamente lo que esa persona todavía debe cobrar — sin el historial de lo ya
            pagado. El mismo botón está disponible desde la ficha de la persona, cuando tiene saldo pendiente.
          </p>
          <Tip>
            Cualquier documento del sistema (comprobantes, papeletas, estados de cuenta, reportes) se puede
            imprimir igual: cada botón que dice “Imprimir” lleva el ícono 🖨️ para que sea fácil de reconocer, y en
            la pantalla de vista previa la impresión se dispara sola al abrirla, además de tener su propio botón
            🖨️ Imprimir por si la cierras sin querer.
          </Tip>
        </Seccion>

        <Seccion id="notas" titulo="Notas y Recordatorios">
          <p>
            La pestaña Notas es un tablero de notas rápidas tipo <b>sticky note</b>, para avisos o pendientes que no
            son parte del registro financiero (llamar a alguien, comprar algo, revisar un trámite, etc.).
          </p>
          <p>Para crear una: llena el formulario de la izquierda —</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Título</b> (obligatorio) y <b>Contenido</b> (opcional, para más detalle).
            </li>
            <li>
              <b>Color:</b> elige entre amarillo, rosado, celeste, verde o naranja — solo para diferenciarlas a
              simple vista, no cambia nada más.
            </li>
            <li>
              <b>Agregar recordatorio</b> (opcional): marca la casilla y elige la <b>fecha</b> en que debe avisar (la
              hora es opcional, solo informativa) y si se <b>repite</b> — no se repite, todos los días, cada semana o
              cada mes.
            </li>
          </ul>
          <p>Dale a <b>Guardar nota</b>. La nota aparece de inmediato en el tablero de la derecha, con una pequeña inclinación al azar para que se vea como notas de verdad pegadas una a una.</p>
          <p>
            Cada nota tiene botones <b>Editar</b> (cambia cualquier campo, incluido el recordatorio) y{" "}
            <b>Eliminar</b> (la borra para siempre — a diferencia de los movimientos financieros, una nota sí se
            puede eliminar sin dejar rastro, porque no es un registro contable).
          </p>
          <p>
            Cuando el recordatorio de una nota <b>vence</b> (llega su fecha), la nota se resalta con un borde rojo y
            además aparece en la <b>campanita 🔔</b> del encabezado, junto con los demás avisos del sistema. Desde
            ahí (o desde la nota misma) el botón <b>Visto</b>:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Si el recordatorio no se repite, lo apaga para siempre (la nota se queda, solo pierde el recordatorio).</li>
            <li>Si se repite, lo manda a su próxima fecha — vuelve a avisar en el siguiente ciclo.</li>
          </ul>
          <Tip>
            El aviso de un recordatorio aparece la primera vez que alguien abre el sistema ese día — no es una
            notificación push que suene a una hora exacta, porque el sistema no tiene ese tipo de aviso en segundo
            plano.
          </Tip>
        </Seccion>

        <Seccion id="usuarios" titulo="Usuarios (solo Administrador)">
          <p>Solo el Administrador ve la pestaña Usuarios. Desde ahí puede:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Crear una cuenta nueva:</b> correo, alias (el nombre que se muestra en vez del correo), una clave, y
              el tipo de cuenta (Administrador o Solo lectura).
            </li>
            <li>
              <b>Editar cualquier usuario</b> (incluida la propia): cambiar su alias, su tipo de cuenta, o ponerle
              una clave nueva. La única excepción es que nadie puede cambiar su propio tipo de cuenta, para evitar
              quedarse sin acceso de Administrador por accidente.
            </li>
            <li>
              <b>🗑️ Borrar un usuario:</b> pide tu propia contraseña para confirmar (no se puede deshacer). No
              puedes borrar tu propia cuenta ni la cuenta principal ({USUARIO_PROTEGIDO}) — esa siempre queda como
              acceso garantizado al sistema.
            </li>
          </ul>
        </Seccion>

        <Seccion id="auditoria" titulo="Historial de auditoría (solo Administrador)">
          <p>
            Un registro de solo lectura: cada vez que se crea, paga, corrige o anula un movimiento — o se crea,
            edita o borra un usuario — queda una fila acá con quién lo hizo y cuándo.
          </p>
          <p>
            Nadie puede editarlo ni borrarlo, ni siquiera el Administrador — es intencional, para que sea un
            historial confiable. Muestra los últimos 300 registros.
          </p>
        </Seccion>

        <Seccion id="configuracion" titulo="Configuración (solo Administrador)">
          <p>
            Nombre de la razón social, logo y colores de marca — se usan en el encabezado, el menú, la pantalla de
            inicio de sesión y todos los documentos impresos, así que un solo cambio aquí se ve en toda la
            aplicación al instante.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Logo:</b> tamaño recomendado 400×160px, PNG con fondo transparente, máximo 2MB — así se ve bien
              tanto en el encabezado oscuro como en la pantalla de inicio de sesión clara.
            </li>
            <li>
              <b>Color principal</b> y <b>Color del encabezado:</b> se eligen con el selector de color o escribiendo
              el código hexadecimal directamente (ej. <span className="mono">#fc6b12</span>).
            </li>
            <li>
              <b>Tema oscuro:</b> elige entre tres paletas (Carbón, Negro intenso, Azul marino oscuro) para cuando
              alguien active el modo 🌙 desde el encabezado — no afecta al modo claro.
            </li>
          </ul>
        </Seccion>

        <Seccion id="lectura" titulo="Modo Solo lectura">
          <p>
            Una cuenta Solo lectura ve exactamente las mismas pantallas y datos que un Administrador, pero todos los
            botones y campos que cambiarían algo (guardar, editar, borrar, anular, registrar un pago) se ven en{" "}
            <b>gris</b>. Se pueden seguir apretando — al hacerlo, sale un aviso de que esa cuenta no tiene permisos
            para esa acción, en vez de simplemente no reaccionar.
          </p>
          <p>
            Lo que sí puede hacer una cuenta Solo lectura sin restricción: ver todos los datos, usar los filtros y
            la búsqueda en tiempo real, generar reportes, e imprimir cualquier documento.
          </p>
        </Seccion>

        <Seccion id="consejos" titulo="Preguntas frecuentes">
          <p>
            <b>¿Por qué no me deja seleccionar una cuenta al pagar en efectivo?</b> Es al revés: para Efectivo el
            sistema no la pide, porque el efectivo no sale de ninguna cuenta bancaria registrada. Para las demás
            formas de pago (Cheque, Transferencia, Tarjeta) sí es obligatoria.
          </p>
          <p>
            <b>Registré un egreso pero me equivoqué, ¿lo borro?</b> No se borran los movimientos — se anulan (botón
            Anular en la lista). Así queda el registro para auditoría, pero deja de contar en los totales y en el
            saldo de la cuenta. Ver la sección{" "}
            <a href="#anular" className="text-primary-dark underline">
              Anular un movimiento
            </a>
            .
          </p>
          <p>
            <b>¿Por qué un nombre de Personal sale en naranja y otro en negro?</b> Naranja significa que está
            registrado y activo. Gris significa que está registrado pero dado de baja. Negro (normal) significa que
            es un nombre escrito a mano, no está registrado como Personal — y por eso tampoco tiene un enlace a una
            ficha.
          </p>
          <p>
            <b>Puse un filtro y ya no me aparece nadie, ¿está roto?</b> Casi siempre es que hay más de un filtro
            activo a la vez (por ejemplo una fecha vieja de otra búsqueda, más un nombre de Personal) y ambos deben
            cumplirse juntos. Dale a <b>Ver todo el historial</b> para limpiar todos los filtros y empezar de
            nuevo.
          </p>
          <p>
            <b>¿Qué es el N° que aparece junto a cada egreso?</b> Es el número de egreso real de esa cuenta bancaria
            (como en un talonario de cheques físico) — no es un ID interno del sistema. Ver la sección{" "}
            <a href="#numeros" className="text-primary-dark underline">
              N° de egreso y cheques
            </a>
            .
          </p>
          <p>
            <b>El botón ⓘ no me deja ver todo el detalle, ¿dónde está lo completo?</b> El ⓘ es a propósito solo un
            resumen express. Dale clic al enlace “Ver guía completa” que trae abajo — te lleva directo a la sección
            de este manual con todo el detalle.
          </p>
          <p>
            <b>¿Se puede usar desde el celular?</b> Sí, el sistema funciona en cualquier navegador, pero para
            escribir muchos datos es más cómodo desde una computadora.
          </p>
        </Seccion>
      </div>
    </div>
  );
}
