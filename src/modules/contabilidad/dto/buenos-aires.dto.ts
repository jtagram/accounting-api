import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BuenosAiresDto {
  @ApiProperty({
    description: 'Usuario de ARCA: el CUIT del cliente, sin guiones.',
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
}
