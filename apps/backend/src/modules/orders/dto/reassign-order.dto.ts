import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ReassignOrderDto {
  @ApiProperty({
    description: 'New escort user ID assigned to the rejected order.',
    example: 'clx0000000000000000000000',
  })
  @IsString()
  @MinLength(1)
  escortId!: string;
}
