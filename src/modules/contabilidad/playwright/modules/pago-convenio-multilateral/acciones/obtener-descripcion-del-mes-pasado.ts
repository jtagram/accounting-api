export function obtenerDescripcionDelMesPasado(): string {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() - 1);

  const mesPasado = String(fecha.getMonth() + 1).padStart(2, '0');
  const anioPasado = String(fecha.getFullYear()).slice(-2);

  const descripcion = `CM-SOP${mesPasado}/${anioPasado}`;

  console.log(`Descripción a buscar: ${descripcion}`);

  return descripcion;
}
