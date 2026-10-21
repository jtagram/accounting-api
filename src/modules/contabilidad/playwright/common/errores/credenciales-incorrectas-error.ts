export class CredencialesIncorrectasError extends Error {
  constructor() {
    super('CUIT o clave fiscal incorrectos');
    this.name = 'CredencialesIncorrectasError';
  }
}
