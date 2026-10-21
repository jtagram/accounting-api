import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BuenosAiresCabaDto {
  @ApiProperty({
    description: 'Usuario de ARCA: el CUIT del cliente, sin guiones. También es el usuario con el que se ingresa a AGIP.',
    example: '20123456789',
  })
  @Matches(/\S/, { message: 'ARCA_USERNAME no puede contener solo espacios' })
  @IsString({ message: 'ARCA_USERNAME debe ser un texto' })
  @IsNotEmpty({ message: 'ARCA_USERNAME es obligatorio' })
  ARCA_USERNAME!: string;

  @ApiProperty({
    description: 'Clave fiscal de ARCA del cliente.',
    example: 'clave-fiscal',
    format: 'password',
  })
  @Matches(/\S/, { message: 'ARCA_PASSWORD no puede contener solo espacios' })
  @IsString({ message: 'ARCA_PASSWORD debe ser un texto' })
  @IsNotEmpty({ message: 'ARCA_PASSWORD es obligatorio' })
  ARCA_PASSWORD!: string;

  @ApiProperty({
    description: 'Clave de AGIP (Clave Ciudad) del cliente.',
    example: 'clave-ciudad',
    format: 'password',
  })
  @Matches(/\S/, { message: 'AGIP_CLAVE no puede contener solo espacios' })
  @IsString({ message: 'AGIP_CLAVE debe ser un texto' })
  @IsNotEmpty({ message: 'AGIP_CLAVE es obligatorio' })
  AGIP_CLAVE!: string;
}
