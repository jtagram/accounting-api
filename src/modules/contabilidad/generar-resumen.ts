export type ResultadoPdf =
  | { etiqueta: string; nombreArchivo: string; descargado: true }
  | { etiqueta: string; descargado: false; motivo: string };

export function generarResumen(nombre: string, resultados: ResultadoPdf[]): string {
  const lineasDescargados: string[] = [];
  const lineasNoDisponibles: string[] = [];

  for (const resultado of resultados) {
    if (resultado.descargado) {
      lineasDescargados.push(`- ${resultado.etiqueta} (${resultado.nombreArchivo})`);
    } else {
      lineasNoDisponibles.push(`- ${resultado.etiqueta}: ${resultado.motivo}`);
    }
  }

  return [
    `Cliente: ${nombre}`,
    `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
    '',
    'PDFs descargados correctamente:',
    ...(lineasDescargados.length ? lineasDescargados : ['- Ninguno']),
    '',
    'PDFs que el cliente no tiene:',
    ...(lineasNoDisponibles.length ? lineasNoDisponibles : ['- Ninguno']),
    '',
  ].join('\n');
}
