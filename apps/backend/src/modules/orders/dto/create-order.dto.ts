import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MinLength(1)
  escortId!: string;

  @IsString()
  @MinLength(1)
  hospitalName!: string;

  @Type(() => Date)
  @IsDate()
  serviceAt!: Date;

  @IsOptional()
  @IsString()
  remark?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;
}
