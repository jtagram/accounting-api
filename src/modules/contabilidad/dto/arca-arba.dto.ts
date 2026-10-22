import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ClienteArbaDto } from './cliente-arba.dto.js';

export class ArcaArbaDto {
  @ApiProperty({
    description: 'Clientes a procesar, uno por uno. Todos van en el mismo ZIP.',
    type: [ClienteArbaDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClienteArbaDto)
  @ArrayNotEmpty({ message: 'clientes debe tener al menos un cliente' })
  @IsArray({ message: 'clientes debe ser una lista' })
  clientes!: ClienteArbaDto[];
}
