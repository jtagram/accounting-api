export function obtenerPeriodoMesPasado(): string {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() - 1);

  const mesPasado = String(fecha.getMonth() + 1).padStart(2, '0');
  const anioPasado = fecha.getFullYear();

  const periodo = `${mesPasado}/${anioPasado}`;

  console.log(`Periodo a buscar: ${periodo}`);

  return periodo;
}
