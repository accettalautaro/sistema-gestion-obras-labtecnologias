# Casos de aceptación: métricas calculadas

Estos escenarios se ejecutan sobre una base con `006_metricas_calculadas_no_persistidas.sql` aplicada y la aplicación iniciada. Las fechas y los montos son datos de ejemplo.

## CA-01 — El esquema no persiste métricas derivadas

**Preparación:** ejecutar la migración 006.

**Comprobación:** consultar `information_schema.columns` para `tareas` y `subtareas`.

**Resultado esperado:**

- `tareas` ya no tiene `duracion_estimada`, `duracion_real`, `porcentaje`, `costo_estimado` ni `costo_real`.
- `subtareas` ya no tiene `duracion_estimada`, `duracion_real` ni `costo_real`.
- `subtareas` conserva `porcentaje` y `costo_estimado`; ambas son fuentes de cálculo.
- Las tablas conservan sus fechas estimadas y reales.

## CA-02 — Métricas de una subtarea

**Preparación:** crear una subtarea con fechas estimadas del 1 al 2 de julio de 2026, fechas reales del 3 al 4 de julio, costo estimado `1000` y dos pagos parciales de `300` y `250`.

**Resultado esperado en la respuesta de la API:** duración estimada `2`, duración real `2`, porcentaje propio, costo estimado `1000` y costo real `550`.

## CA-03 — Agregados de una tarea

**Preparación:** crear tres subtareas con porcentajes `100`, `100` y `0`; costos estimados `10`, `20` y `30`; pagos parciales que sumen `12`; duraciones estimadas inclusivas de `2`, `4` y `1` días. Dejar sin completar la tercera.

**Resultado esperado:** porcentaje de tarea `66`; costo estimado `60`; costo real `12`; duración estimada `7`; duración real y fecha real de fin pendientes.

## CA-04 — Tarea vacía dentro del promedio de obra

**Preparación:** usar la tarea de CA-03 y agregar una segunda tarea sin subtareas.

**Resultado esperado:** la tarea vacía aporta `0` al promedio; el porcentaje de obra es `33` (`floor((66 + 0) / 2)`). La obra no puede finalizar.

## CA-05 — Duración real de obra inclusiva y pendiente

**Preparación:** crear dos tareas completadas. La primera tiene fecha real del 1 al 3 de julio de 2026; la última, del 5 al 5 de julio.

**Resultado esperado:** fecha real inicial `2026-07-01`, fecha real final `2026-07-05` y duración real `5` días, contando ambos extremos. Si una subtarea de cualquier tarea queda incompleta, la fecha final y duración real de la obra vuelven a estar pendientes.

## CA-06 — Estado derivado y pausa manual

**Preparación y resultado esperado:**

1. Sin fechas reales de inicio, la obra responde `No Inicio`.
2. Al iniciar una subtarea que deja el avance en `0`, responde `En ejecución`.
3. Al completar todas las tareas, responde `Finalizada`.
4. Al pausar una obra finalizada, responde `Pausada`.
5. Al reanudarla, el estado se deriva de nuevo y responde `Finalizada`.

## CA-07 — No se aceptan métricas como datos editables

**Preparación:** crear o actualizar una obra, tarea o subtarea usando sus campos de entrada documentados. Enviar valores falsos para campos calculados (`porcentaje`, duraciones, costos reales o costos de tarea) no debe alterar el resultado calculado.

**Resultado esperado:** la respuesta conserva las métricas calculadas desde fechas, subtareas y pagos. El costo estimado se carga únicamente en una subtarea; el costo estimado de tarea y obra se deriva de sus subtareas.

## CA-08 — Una tarea vacía requiere subtareas para avanzar

**Preparación:** abrir Seguimiento de obra para una tarea sin subtareas.

**Resultado esperado:** la tarea muestra `0%` y un acceso a Gestión de tareas para agregar subtareas. No ofrece acciones directas para iniciar o completar esa tarea. Una vez agregada una subtarea, las acciones de inicio y finalización aparecen en esa subtarea.

## Ejecución de pruebas automatizadas

Desde `Back/`, ejecutar `mvn test` para correr las pruebas unitarias del servicio. Los casos CA-01 a CA-08 son comprobaciones manuales que requieren la aplicación y una base con la migración 006 aplicada.
