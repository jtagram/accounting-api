import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ClienteAgipDto } from './cliente-agip.dto.js';

export class ArcaAgipDto {
  @ApiProperty({
    description: 'Clientes a procesar, uno por uno. Todos van en el mismo ZIP.',
    type: [ClienteAgipDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClienteAgipDto)
  @ArrayNotEmpty({ message: 'clientes debe tener al menos un cliente' })
  @IsArray({ message: 'clientes debe ser una lista' })
  clientes!: ClienteAgipDto[];
}
