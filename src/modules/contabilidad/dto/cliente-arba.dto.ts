import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ClienteArbaDto {
  @ApiProperty({
    description: 'CUIT del cliente, sin guiones. Es el usuario de ARCA y también el de ARBA.',
    example: '20123456789',
  })
  @Matches(/\S/, { message: 'cuit no puede contener solo espacios' })
  @IsString({ message: 'cuit debe ser un texto' })
  @IsNotEmpty({ message: 'cuit es obligatorio' })
  cuit!: string;

  @ApiProperty({
    description: 'Clave fiscal de ARCA del cliente.',
    example: 'clave-fiscal',
    format: 'password',
  })
  @Matches(/\S/, { message: 'claveFiscal no puede contener solo espacios' })
  @IsString({ message: 'claveFiscal debe ser un texto' })
  @IsNotEmpty({ message: 'claveFiscal es obligatorio' })
  claveFiscal!: string;

  @ApiProperty({
    description: 'Clave CIT de ARBA del cliente.',
    example: 'clave-cit',
    format: 'password',
  })
  @Matches(/\S/, { message: 'claveCit no puede contener solo espacios' })
  @IsString({ message: 'claveCit debe ser un texto' })
  @IsNotEmpty({ message: 'claveCit es obligatorio' })
  claveCit!: string;
}
