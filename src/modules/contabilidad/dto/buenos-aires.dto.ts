import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BuenosAiresDto {
  @Matches(/\S/, { message: 'ARCA_USERNAME no puede contener solo espacios' })
  @IsString({ message: 'ARCA_USERNAME debe ser un texto' })
  @IsNotEmpty({ message: 'ARCA_USERNAME es obligatorio' })
  ARCA_USERNAME!: string;

  @Matches(/\S/, { message: 'ARCA_PASSWORD no puede contener solo espacios' })
  @IsString({ message: 'ARCA_PASSWORD debe ser un texto' })
  @IsNotEmpty({ message: 'ARCA_PASSWORD es obligatorio' })
  ARCA_PASSWORD!: string;
}
