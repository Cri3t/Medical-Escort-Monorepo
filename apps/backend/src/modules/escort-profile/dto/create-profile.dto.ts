import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({
    description: '身份证号，18 位中国大陆居民身份证号码',
    example: '110101199001011234',
  })
  @IsString()
  @Length(18, 18)
  @Matches(/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/)
  idCardNo!: string;
}
