import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
} from '@nestjs/swagger';

const CONTENIDO_ZIP = {
  'application/zip': { schema: { type: 'string', format: 'binary' } },
};

const DURACION =
  'La ejecución puede tardar varios minutos: la respuesta llega recién cuando termina toda la automatización.';

function respuestasComunes(acuseDeRecibo: string, declaracionJurada: string) {
  return applyDecorators(
    ApiCreatedResponse({
      description:
        'Descarga `PDFs Contables.zip`. Adentro hay una carpeta por cada cliente que salió bien, con el nombre del cliente, ' +
        `que contiene un archivo por documento (comprobantes emitidos y recibidos, retenciones, ${acuseDeRecibo}, monotributo, ingresos brutos y ${declaracionJurada}): ` +
        'el PDF si se descargó, `<documento>-no-tiene.txt` si el cliente no lo tiene, o `<documento>-error.txt` con el stack trace si falló.',
      content: CONTENIDO_ZIP,
    }),
    ApiInternalServerErrorResponse({
      description:
        'Falló al menos un cliente (por ejemplo, credenciales incorrectas o un cambio en el portal). Descarga igualmente ' +
        '`PDFs Contables.zip`: los clientes que fallaron aparecen como `<CUIT>.txt` con el motivo (`CUIT o clave fiscal incorrectos` ' +
        'o el stack trace) en lugar de su carpeta, y el resto de los clientes viene con su carpeta normal.',
      content: CONTENIDO_ZIP,
    }),
    ApiBadRequestResponse({
      description: 'La lista `clientes` falta o está vacía, o algún campo obligatorio falta, está vacío, contiene solo espacios o no es un texto.',
    }),
  );
}

export function ApiArca() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener los PDFs contables de ARCA',
      description:
        `Descarga los PDFs del mes anterior desde ARCA, para cada cliente de la lista, de a uno. ${DURACION}\n\n` +
        '**Origen de cada PDF:**\n\n' +
        '- Comprobantes emitidos: ARCA\n' +
        '- Comprobantes recibidos: ARCA\n' +
        '- Retenciones: ARCA\n' +
        '- Acuse de recibo: ARCA\n' +
        '- Monotributo: ARCA\n' +
        '- Ingresos brutos: ARCA\n' +
        '- Declaración jurada: ARCA\n',
    }),
    respuestasComunes('acuse de recibo de ARCA', 'declaración jurada de ARCA'),
  );
}

export function ApiArcaAgip() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener los PDFs contables de ARCA y AGIP',
      description:
        'Descarga los PDFs del mes anterior para cada cliente de la lista, de a uno. Ingresa a ARCA con el CUIT y la clave fiscal, ' +
        `y a AGIP con el CUIT y la clave ciudad. ${DURACION}\n\n` +
        '**Origen de cada PDF:**\n\n' +
        '- Comprobantes emitidos: ARCA\n' +
        '- Comprobantes recibidos: ARCA\n' +
        '- Retenciones: ARCA\n' +
        '- Acuse de recibo: ARCA\n' +
        '- Monotributo: ARCA\n' +
        '- Ingresos brutos: ARCA\n' +
        '- Declaración jurada: AGIP\n',
    }),
    respuestasComunes('acuse de recibo de ARCA', 'declaración jurada de AGIP'),
  );
}

export function ApiArcaArba() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener los PDFs contables de ARCA y ARBA',
      description:
        'Descarga los PDFs del mes anterior para cada cliente de la lista, de a uno. Ingresa a ARCA con el CUIT y la clave fiscal, ' +
        `y a ARBA con el CUIT y la clave CIT. ${DURACION}\n\n` +
        '**Origen de cada PDF:**\n\n' +
        '- Comprobantes emitidos: ARCA\n' +
        '- Comprobantes recibidos: ARCA\n' +
        '- Retenciones: ARCA\n' +
        '- Acuse de recibo: ARBA\n' +
        '- Monotributo: ARCA\n' +
        '- Ingresos brutos: ARCA\n' +
        '- Declaración jurada: ARBA\n',
    }),
    respuestasComunes('acuse de recibo de ARBA', 'declaración jurada de ARBA'),
  );
}
