const SECCIONES = [
  { id: "bienvenida", titulo: "Bienvenida" },
  { id: "entrar", titulo: "Cómo entrar" },
  { id: "pantalla", titulo: "Partes de la pantalla" },
  { id: "cuentas", titulo: "Cuentas bancarias" },
  { id: "ingresos", titulo: "Registrar un ingreso" },
  { id: "egresos", titulo: "Registrar un egreso" },
  { id: "personal", titulo: "Personal (Proveedores, Servicios, Afiliados)" },
  { id: "horario", titulo: "Horario de Personal" },
  { id: "bitacora", titulo: "Bitácora semanal" },
  { id: "cxp", titulo: "Cuentas por Pagar" },
  { id: "reportes", titulo: "Reportes e impresión" },
  { id: "usuarios", titulo: "Usuarios (solo Administrador)" },
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
            apenas los veas.
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
            <div className="rounded-md bg-header text-white px-3 py-2 mb-1.5 flex items-center justify-between">
              <span className="font-bold">Logo · Control Financiero</span>
              <span className="text-[11px]">TU NOMBRE · rol · ☾ modo oscuro · Cerrar sesión</span>
            </div>
            <div className="rounded-md bg-carbon text-white px-3 py-1.5 mb-1.5 text-[11px] flex gap-3 flex-wrap">
              <span>Cuentas</span>
              <span>Personal</span>
              <span>Ingresos</span>
              <span>Egresos</span>
              <span>Cuentas x Pagar</span>
              <span>Reportes</span>
              <span className="ml-auto text-primary">Cómo usar</span>
            </div>
            <div className="rounded-md border border-border bg-[var(--color-surface)] px-3 py-4 text-center text-muted">
              Aquí cambia el contenido según la pestaña que elijas
            </div>
          </Esquema>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Encabezado (arriba, naranja o carbón según el modo):</b> el logo, tu nombre/alias, tu tipo de
              cuenta, el botón de modo oscuro/claro, y Cerrar sesión.
            </li>
            <li>
              <b>Menú de pestañas (debajo del encabezado):</b> para moverte entre los módulos del sistema. La
              pestaña Usuarios solo la ve el Administrador.
            </li>
            <li>
              <b>Cómo usar (esquina derecha, en naranja):</b> este manual, siempre a un clic de distancia.
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
            ver el detalle de todos los movimientos de esa cuenta con el saldo acumulado día por día, listo para
            imprimir.
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
            por fecha, cuenta o buscar por texto, e imprimir un comprobante individual o un reporte del rango
            completo.
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
              pide cuenta — el efectivo no sale de ninguna cuenta bancaria registrada.
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
            Al darle clic a una persona en la lista entras a su ficha: ahí ves su saldo por pagar, puedes
            activarla/desactivarla (sin borrar su historial), editar sus datos, e imprimir su reporte de movimientos
            o su horario.
          </p>
        </Seccion>

        <Seccion id="horario" titulo="Horario de Personal">
          <p>
            Para Servicios prestados y Personal afiliado puedes guardar su horario habitual (de Lunes a Domingo).
            Se edita desde el mismo formulario de Editar datos: marca con un visto los días que se trabajan y llena
            su hora de entrada y salida — los días sin marcar quedan sin horario. Puedes dejarlo en blanco y
            completarlo después, o cambiarlo cuando cambie el horario de esa persona.
          </p>
          <p>
            El horario aparece arriba en la ficha de la persona. Y desde ahí mismo, el botón Imprimir horario genera
            un reporte con el horario establecido arriba, y abajo cada semana de bitácora registrada con sus horas
            trabajadas día por día y el total acumulado.
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
        </Seccion>

        <Seccion id="cxp" titulo="Cuentas por Pagar">
          <p>
            Aquí ves todos los egresos que quedaron pendientes (los que registraste como No, queda pendiente).
            Puedes:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>Filtrar por fecha, y darle a Registrar pago en un pendiente individual para pagarlo.</li>
            <li>
              Marcar varios con las casillas de la izquierda y pagarlos todos juntos (elige la cuenta y la fecha de
              pago, y confirma) o anularlos en bloque.
            </li>
            <li>Imprimir el listado completo.</li>
          </ul>
        </Seccion>

        <Seccion id="reportes" titulo="Reportes e impresión">
          <p>La pestaña Reportes tiene 3 modos, arriba en pestañas:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <b>Por cuenta:</b> resumen de una cuenta bancaria específica en un rango de fechas.
            </li>
            <li>
              <b>Por Personal:</b> resumen de una persona específica (cuánto se le ha pagado, cuánto se le debe).
            </li>
            <li>
              <b>General (todo):</b> un resumen de todas las cuentas y todo el Personal con saldo pendiente, en un
              solo documento.
            </li>
          </ul>
          <p>
            Elige el modo, el rango de fechas si quieres, y dale a Generar. Cuando aparezca el resumen, el botón
            Imprimir reporte abre la versión lista para imprimir (o guardar como PDF), con el logo de la clínica
            arriba a la izquierda y quién generó el documento al pie de la página.
          </p>
          <Tip>
            Cualquier documento del sistema (comprobantes, estados de cuenta, reportes) se puede imprimir igual: hay
            un botón Imprimir en cada pantalla de vista previa, y también se dispara solo al abrir la página.
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
            Lo que sí puede hacer una cuenta Solo lectura sin restricción: ver todos los datos, filtrar, generar
            reportes, e imprimir cualquier documento.
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
            saldo de la cuenta.
          </p>
          <p>
            <b>¿Por qué un nombre de Personal sale en naranja y otro en negro?</b> Naranja significa que está
            registrado y activo. Gris significa que está registrado pero dado de baja. Negro (normal) significa que
            es un nombre escrito a mano, no está registrado como Personal.
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
