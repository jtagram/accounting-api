import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ClienteDto } from './cliente.dto.js';

export class BuenosAiresDto {
  @ApiProperty({
    description: 'Clientes a procesar, uno por uno. Todos van en el mismo ZIP.',
    type: [ClienteDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClienteDto)
  @ArrayNotEmpty({ message: 'clientes debe tener al menos un cliente' })
  @IsArray({ message: 'clientes debe ser una lista' })
  clientes!: ClienteDto[];
}
