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

function respuestasComunes(declaracionJurada: string) {
  return applyDecorators(
    ApiCreatedResponse({
      description:
        'Descarga `<Cliente>.zip`. Adentro hay una carpeta con el nombre del cliente que contiene los PDFs ' +
        `que el cliente tiene (comprobantes emitidos y recibidos, retenciones, acuse de recibo, monotributo, convenio multilateral y ${declaracionJurada}) ` +
        'y un `resumen.txt` que indica cuáles se descargaron y cuáles el cliente no tiene, con el motivo.',
      content: CONTENIDO_ZIP,
    }),
    ApiInternalServerErrorResponse({
      description:
        'Falló la ejecución (por ejemplo, credenciales incorrectas o un cambio en el portal). Descarga igualmente un ' +
        '`<Cliente>.zip` con una carpeta del cliente que contiene únicamente `error.txt` con el stack trace, sin ningún PDF. ' +
        'Si el error ocurre antes del login, la carpeta y el ZIP se llaman como el usuario (CUIT).',
      content: CONTENIDO_ZIP,
    }),
    ApiBadRequestResponse({
      description: 'Falta algún campo obligatorio, está vacío, contiene solo espacios o no es un texto.',
    }),
  );
}

export function ApiBuenosAires() {
  return applyDecorators(
    ApiOperation({
      summary: 'Clientes que trabajan solo en Buenos Aires',
      description: `Descarga los PDFs del mes anterior desde ARCA. La declaración jurada se obtiene de ARCA. ${DURACION}`,
    }),
    respuestasComunes('declaración jurada de ARCA'),
  );
}

export function ApiBuenosAiresCaba() {
  return applyDecorators(
    ApiOperation({
      summary: 'Clientes que trabajan en Buenos Aires y CABA',
      description:
        'Descarga los PDFs del mes anterior desde ARCA. La declaración jurada se obtiene de AGIP, ' +
        `ingresando con el usuario de ARCA (el CUIT) y la clave de AGIP. ${DURACION}`,
    }),
    respuestasComunes('declaración jurada de AGIP'),
  );
}
