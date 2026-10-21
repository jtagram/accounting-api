import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BuenosAiresCabaDto {
  @Matches(/\S/, { message: 'ARCA_USERNAME no puede contener solo espacios' })
  @IsString({ message: 'ARCA_USERNAME debe ser un texto' })
  @IsNotEmpty({ message: 'ARCA_USERNAME es obligatorio' })
  ARCA_USERNAME!: string;

  @Matches(/\S/, { message: 'ARCA_PASSWORD no puede contener solo espacios' })
  @IsString({ message: 'ARCA_PASSWORD debe ser un texto' })
  @IsNotEmpty({ message: 'ARCA_PASSWORD es obligatorio' })
  ARCA_PASSWORD!: string;

  @Matches(/\S/, { message: 'AGIP_CLAVE no puede contener solo espacios' })
  @IsString({ message: 'AGIP_CLAVE debe ser un texto' })
  @IsNotEmpty({ message: 'AGIP_CLAVE es obligatorio' })
  AGIP_CLAVE!: string;
}
