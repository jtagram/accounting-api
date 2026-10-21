import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ClienteCabaDto } from './cliente-caba.dto.js';

export class BuenosAiresCabaDto {
  @ApiProperty({
    description: 'Clientes a procesar, uno por uno. Todos van en el mismo ZIP.',
    type: [ClienteCabaDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClienteCabaDto)
  @ArrayNotEmpty({ message: 'clientes debe tener al menos un cliente' })
  @IsArray({ message: 'clientes debe ser una lista' })
  clientes!: ClienteCabaDto[];
}
