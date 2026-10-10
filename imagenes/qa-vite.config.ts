import base from '../vite.config';

// La revisión de recorridos no se reinicia con las ediciones concurrentes de otros agentes.
export default { ...base, server: { watch: null, hmr: false } };
