# Control Financiero — Ser Humano

Sistema de control financiero, nómina y cuentas por pagar desarrollado a medida para las empresas del grupo **Clínica / Instituto Ser Humano** (Fundación Ser Humano, Instituto Clínico Ser Humano, y las cuentas personales asociadas). Centraliza en un solo lugar los ingresos, los egresos, el personal (empleados, proveedores y afiliados), la bitácora de horas trabajadas, las cuentas por pagar y los reportes financieros de todas las cuentas bancarias de la organización.

**Autoría:** Jorge Urgiles Ruiz

---

## Índice

- [¿Qué resuelve este sistema?](#qué-resuelve-este-sistema)
- [Funcionalidades](#funcionalidades)
- [Roles y permisos](#roles-y-permisos)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Migraciones de base de datos](#migraciones-de-base-de-datos)
- [Scripts disponibles](#scripts-disponibles)
- [Respaldos](#respaldos)

## ¿Qué resuelve este sistema?

Antes de este sistema, el control financiero de la clínica se llevaba en una herramienta prototipo basada en el navegador (ver `DOCS/Control_Egresos_Cheques.html`, guardada como referencia histórica) que almacenaba todo en el `localStorage` del navegador de una sola computadora, sin usuarios, sin respaldo real y sin forma de compartir la información entre varias personas al mismo tiempo.

**Control Financiero — Ser Humano** reemplaza esa herramienta con una aplicación web real, con:

- Una base de datos centralizada (Supabase/PostgreSQL) accesible desde cualquier computadora con las credenciales correctas.
- Usuarios con inicio de sesión y dos niveles de permiso (Administrador / Solo lectura).
- Un modelo de datos único para todo movimiento de dinero (ingresos y egresos comparten una sola tabla), en vez de estructuras separadas y duplicadas.
- Impresión lista para PDF de cada documento (papeletas de egreso, comprobantes de ingreso, estados de cuenta, reportes).
- Trazabilidad completa: nada se borra, todo lo que se anula queda registrado para auditoría.

## Funcionalidades

### Cuentas bancarias
- Registro de cada cuenta bancaria (o caja de efectivo) de las empresas del grupo: empresa/titular, RUC, banco, tipo y número de cuenta.
- Saldo calculado automáticamente a partir de sus movimientos confirmados.
- Detalle de cuenta con historial completo, saldo acumulado día por día, número de egreso real (numeración propia por cuenta, como un talonario físico de cheques) y número de cheque/referencia de cada movimiento.
- Estado de cuenta bancaria listo para imprimir en A4.

### Ingresos
- Registro de todo el dinero que entra (pagos de pacientes/clientes), con forma de pago (Efectivo, Cheque, Transferencia, Tarjeta) y campos propios de cada una.
- Vista por defecto centrada en "hoy", con navegación día por día o acceso a todo el historial.
- Filtros y búsqueda en tiempo real por cuenta, forma de pago, estado y texto (pagador/concepto), sin recargar la página.
- Comprobante de ingreso individual e impresión de reportes por rango de fechas.

### Egresos
- Registro de todo el dinero que sale: pagos a Personal, proveedores, servicios y compras puntuales (beneficiario libre).
- Cada egreso puede pagarse de inmediato o quedar pendiente (pasa a Cuentas por Pagar).
- Descuentos aplicables al momento de pagar, con trazabilidad del valor original y el descontado.
- Filtros y búsqueda en tiempo real (por cuenta, Personal, forma de pago, estado, texto), incluyendo búsqueda por nombre de Personal aunque no aparezca escrito en el concepto.
- **Número de egreso real por cuenta**: cada cuenta bancaria numera sus propios egresos de forma estable (igual que un talonario de cheques físico), independiente de las demás cuentas.
- Papeleta de egreso individual imprimible, con el número de egreso, el número de cheque/comprobante, y las horas trabajadas y pagadas cuando el pago proviene de una bitácora de nómina.
- Los movimientos nunca se eliminan: se **anulan**, quedando atenuados y fuera de los totales, pero visibles para auditoría.

### Personal (Proveedores, Servicios prestados, Personal afiliado)
- Ficha por persona/empresa con datos de contacto, tarea, cuenta que le paga habitualmente, y (para Servicios prestados) sueldo mensual, horas y precio por hora calculado.
- Horario habitual configurable día por día (Lunes a Domingo).
- **Bitácora semanal** de asistencia para Servicios prestados: registro de entrada/salida/almuerzo por día, cálculo automático de horas trabajadas y del valor a pagar, con posibilidad de cargar varias semanas juntas en un solo cheque.
- **Día de pago habitual** (semanal, quincenal o mensual) que activa un aviso en la campanita de notificaciones el día que corresponde.
- **Estado de cuenta de una persona**: cargo y abono en filas separadas con saldo corrido, horas trabajadas (reales o estimadas si el cargo es anterior a la bitácora), y el cheque/número de egreso de cada pago — listo para imprimir.
- Activar/desactivar sin perder el historial.

### Cuentas por Pagar
- Listado unificado de todo egreso pendiente (nómina, proveedores, servicios), sin duplicar el registro en otra tabla.
- Pago individual o en bloque (selección múltiple) con una sola cuenta y fecha de pago.
- Anulación en bloque para corregir duplicados sin perder el historial.

### Reportes
- Cuatro modos: **por cuenta**, **por Personal**, **general** (todas las cuentas y todo el Personal con saldo pendiente) y **horarios**.
- La tabla completa se muestra en pantalla al generar el reporte, sin necesidad de imprimir para verla.
- Impresión en A4 con el mismo contenido, logo de la clínica y autoría del documento.

### Notas y Recordatorios
- Tablero de notas rápidas tipo *sticky note* (título, contenido, color) independiente del registro financiero.
- Recordatorio opcional con fecha, hora informativa y repetición (diaria, semanal o mensual).
- Los recordatorios vencidos se resaltan en la nota y avisan por la campanita de notificaciones.

### Usuarios y notificaciones
- Gestión de usuarios (solo Administrador): alta, edición de alias/rol, cambio de clave.
- Campanita de notificaciones con avisos de: pagos de Personal que tocan hoy, cuentas por pagar acumuladas, y recordatorios de notas vencidos.
- Modo oscuro / claro.

### Ayuda integrada
- Manual de uso completo dentro de la aplicación ("Cómo usar"), con navegación por secciones.
- Botón de ayuda (ⓘ) en cada pantalla principal, con una explicación express y enlace a la guía completa.

## Roles y permisos

| Rol | Puede ver y filtrar | Puede imprimir | Puede crear/editar/anular | Ve la pestaña Usuarios |
|---|---|---|---|---|
| **Administrador** | Sí | Sí | Sí | Sí |
| **Solo lectura** | Sí | Sí | No (avisa que no tiene permiso) | No |

La restricción de "solo lectura" se aplica en dos capas: la interfaz oculta o atenúa lo que un usuario de solo lectura no puede hacer, y cada acción que escribe datos vuelve a verificar el rol del lado del servidor.

## Tecnologías

- **[Next.js 16](https://nextjs.org/)** (App Router, Server Components y Server Actions) + **React 19**
- **TypeScript**
- **[Supabase](https://supabase.com/)** (PostgreSQL, autenticación y almacenamiento) como backend
- **Tailwind CSS 4**
- Despliegue pensado para **Vercel** (`vercel.json` incluido) con cron jobs para respaldos automáticos

## Estructura del proyecto

```
app/
  (app)/            Pantallas autenticadas (cuentas, terceros, movimientos,
                     cuentas-por-pagar, reportes, notas, usuarios, ayuda)
  (print)/          Vistas de impresión (comprobantes, papeletas, reportes en A4)
  login/            Inicio de sesión
components/         Componentes compartidos (formularios, impresión, ayuda)
lib/                Lógica de negocio, cálculos, tipos y clientes de Supabase
DOCS/               Migraciones SQL, prototipo de referencia histórico, respaldos
```

## Puesta en marcha

Requisitos: Node.js 20+ y un proyecto de Supabase.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Crea un archivo `.env.local` en la raíz con:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
GITHUB_BACKUP_TOKEN=
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: credenciales públicas del proyecto de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave con privilegios de servicio, usada solo del lado del servidor (respaldos automáticos, tareas administrativas). **Nunca exponerla en el cliente.**
- `CRON_SECRET`: protege el endpoint de tareas programadas (respaldos automáticos).
- `GITHUB_BACKUP_TOKEN`: token usado para subir los respaldos automáticos semanales a este repositorio (ver [Respaldos](#respaldos)).

## Migraciones de base de datos

El esquema de la base de datos se administra con migraciones SQL manuales (no hay un ORM ni un CLI de migraciones automatizado). Cada archivo en `DOCS/migracion-*.sql` documenta un cambio de esquema y debe ejecutarse una sola vez, en orden, desde el **SQL Editor** de Supabase:

- `migracion-perfiles-usuario.sql` — usuarios y roles (Administrador / Solo lectura).
- `migracion-requiere-cuenta.sql` — formas de pago que no requieren cuenta bancaria (Efectivo).
- `migracion-horario-tercero.sql` — horario habitual de Personal.
- `migracion-dia-pago.sql` — día de pago habitual y su aviso en la campanita.
- `migracion-notas.sql` — tabla de Notas y Recordatorios.

`DOCS/Control_Egresos_Cheques.html` es el prototipo original (previo a esta aplicación), conservado como referencia histórica del comportamiento y los cálculos que este sistema reemplaza y amplía.

## Scripts disponibles

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run start    # servidor de producción (requiere build previo)
npm run lint     # ESLint
```

## Respaldos

- **Automático:** un cron de Vercel (`/api/respaldo-semanal`, ver `vercel.json`) exporta semanalmente todas las tablas de la base de datos y las sube como JSON a la carpeta [`respaldos/`](respaldos/) de este mismo repositorio — un respaldo con historial completo sin depender de un plan pago de Supabase.
- **Manual:** la carpeta `DOCS/` puede contener respaldos puntuales (`respaldo_egresos_*.json`) usados como referencia cruzada para verificar la integridad de datos específicos (números de egreso, cheques y fechas reales de pago) frente a lo que muestra la aplicación.
