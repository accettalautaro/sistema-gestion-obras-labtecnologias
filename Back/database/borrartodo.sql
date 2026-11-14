BEGIN;

TRUNCATE TABLE
    public.escritura_propietarios,
    public.escrituras,
    public.mensuras,
    public.documentos,
    public.pagos_parciales,
    public.recordatorios,
    public.subtareas,
    public.tareas,
    public.lotes,
    public.obras,
    public.propietarios,
    public.direcciones,
    public.clientes,
    public.arquitectos,
    public.usuarios
RESTART IDENTITY CASCADE;

COMMIT;