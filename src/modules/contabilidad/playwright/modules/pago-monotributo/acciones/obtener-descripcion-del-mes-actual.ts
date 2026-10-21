export function obtenerDescripcionDelMesActual(): string {
  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = String(hoy.getFullYear()).slice(-2);

  const descripcion = `MONOTR${mesActual}/${anioActual}`;

  console.log(`Descripción a buscar: ${descripcion}`);

  return descripcion;
}
