import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ClienteArcaDto } from './cliente-arca.dto.js';

export class ArcaDto {
  @ApiProperty({
    description: 'Clientes a procesar, uno por uno. Todos van en el mismo ZIP.',
    type: [ClienteArcaDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClienteArcaDto)
  @ArrayNotEmpty({ message: 'clientes debe tener al menos un cliente' })
  @IsArray({ message: 'clientes debe ser una lista' })
  clientes!: ClienteArcaDto[];
}
