import { Injectable } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import { Page } from "playwright/types/test";
import { CredencialesIncorrectasError } from "../errores/credenciales-incorrectas-error.js";

@Injectable()
export class IniciarSesionArca {
    constructor(private readonly logger: Logger) {}
    public async iniciarSesionArca(pagina: Page, cuit: string, claveFiscal: string): Promise<string> {

        await this.irAPaginaARCA(pagina);

        const nombre = await this.iniciarSesion(pagina, cuit, claveFiscal);

        await this.irAPaginaMisServicios(pagina);

        return nombre;
    }

    private async irAPaginaARCA(pagina: Page): Promise<void> {
      try {
        await pagina.goto('https://www.arca.gob.ar/');
    
        await pagina.getByRole('link', { name: 'Iniciar sesión' }).waitFor({ state: 'visible' });
    
        this.logger.log('Página de ARCA abierta');
      } catch (error) {
        this.logger.error({ err: error, msg: 'No se pudo abrir ARCA' });
        throw new Error('No se pudo abrir ARCA', { cause: error });
      }
    }

    private async iniciarSesion(pagina: Page, cuit: string, claveFiscal: string): Promise<string> {
      try {
        await pagina.goto('https://auth.afip.gob.ar/contribuyente_/login.xhtml');
    
        await pagina.locator('[id="F1:username"]').fill(cuit);
    
        await pagina.locator('[id="F1:btnSiguiente"]').click();
    
        await pagina.locator('[id="F1:password"]').fill(claveFiscal);
    
        await pagina.locator('[id="F1:btnIngresar"]').click();
    
        const nombre = await this.confirmarInicioDeSesion(pagina, cuit);
    
        if (nombre) return nombre;
    
        throw new Error('No se pudo confirmar el login');
      } catch (error) {
        await this.verificarErrorDeInicioDeSesion(pagina);

        this.logger.error({ err: error, msg: 'No se pudo iniciar sesión en ARCA' });
        throw new Error('No se pudo iniciar sesión en ARCA', { cause: error });
      }
    }
    
    private async confirmarInicioDeSesion(pagina: Page, cuit: string): Promise<string | null> {
      try {
        const localizadorNombre = pagina.locator('#usernav strong.text-primary');
        const localizadorCuit = pagina.locator('#usernav .numeroCuit');
    
        await localizadorNombre.waitFor({ state: 'visible' });
    
        const nombre = (await localizadorNombre.innerText()).trim();
        const cuitDePagina = (await localizadorCuit.innerText()).trim().replace(/-/g, '').replace(/[\[\]]/g, '');
    
        if (cuitDePagina !== cuit) {
          throw new Error(`El CUIT logueado (${cuitDePagina}) no coincide con el usuario (${cuit})`);
        }
    
        this.logger.log('Login exitoso' );
        return nombre;
      } catch (error) {
        this.logger.error({ err: error, msg: 'No se pudo confirmar el login' });
        return null;
      }
    
    }
    
    private async verificarErrorDeInicioDeSesion(pagina: Page): Promise<void> {
      const mensajeError = pagina.locator('#F1\\:msg');

      if (!(await mensajeError.isVisible().catch(() => false))) return;

      const texto = (await mensajeError.innerText()).trim();

      if (texto === 'Clave o usuario incorrecto') {
        this.logger.error({ msg: 'CUIT o clave fiscal incorrectos' });
        throw new CredencialesIncorrectasError();
      }

      this.logger.error({ texto, msg: 'Error de login desconocido' });
      throw new Error('Error de login desconocido: ' + texto);
    }

    private async irAPaginaMisServicios( pagina: Page): Promise<void> {
      try {
        await pagina.locator('a[href="/portal/app/mis-servicios"]').click();
    
        await pagina.getByRole('heading', { level: 3, name: 'Mis servicios', exact: true }).waitFor({ state: 'visible' });
    
        await pagina.waitForLoadState('networkidle');
    
        this.logger.log({ msg: 'Mis servicios abierto' });
      } catch (error) {
        this.logger.error({ err: error, msg: 'No se pudo abrir Mis servicios' });
        throw new Error('No se pudo abrir Mis servicios', { cause: error });
      }
    }
}