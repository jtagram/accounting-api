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
        'Descarga `PDFs Contables.zip`. Adentro hay una carpeta por cada cliente que salió bien, con el nombre del cliente, ' +
        `que contiene un archivo por documento (comprobantes emitidos y recibidos, retenciones, acuse de recibo, monotributo, convenio multilateral y ${declaracionJurada}): ` +
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

export function ApiBuenosAires() {
  return applyDecorators(
    ApiOperation({
      summary: 'Clientes que trabajan solo en Buenos Aires',
      description: `Descarga los PDFs del mes anterior desde ARCA, para cada cliente de la lista, de a uno. La declaración jurada se obtiene de ARCA. ${DURACION}`,
    }),
    respuestasComunes('declaración jurada de ARCA'),
  );
}

export function ApiBuenosAiresCaba() {
  return applyDecorators(
    ApiOperation({
      summary: 'Clientes que trabajan en Buenos Aires y CABA',
      description:
        'Descarga los PDFs del mes anterior desde ARCA, para cada cliente de la lista, de a uno. La declaración jurada se obtiene de AGIP, ' +
        `ingresando con el usuario de ARCA (el CUIT) y la clave ciudad. ${DURACION}`,
    }),
    respuestasComunes('declaración jurada de AGIP'),
  );
}
