import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { MAX_ESCORT_TAG_LENGTH, MAX_ESCORT_TAGS } from '../escort-tags';

export class CreateProfileDto {
  @ApiProperty({
    description: '身份证号，18 位中国大陆居民身份证号码',
    example: '110101199001011234',
  })
  @IsString()
  @Length(18, 18)
  @Matches(/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/)
  idCardNo!: string;

  @ApiProperty({
    description: '擅长服务标签，至少 1 个，运行时结构为 string[]',
    example: ['陪诊沟通', '取药协助'],
    type: [String],
    minItems: 1,
    maxItems: MAX_ESCORT_TAGS,
  })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) => (typeof item === 'string' ? item.trim() : item))
      : value,
  )
  @IsArray({ message: '擅长服务标签必须是数组' })
  @ArrayMinSize(1, { message: '请至少填写一个擅长服务标签' })
  @ArrayMaxSize(MAX_ESCORT_TAGS, {
    message: `擅长服务标签最多 ${MAX_ESCORT_TAGS} 个`,
  })
  @IsString({ each: true, message: '擅长服务标签必须是字符串' })
  @IsNotEmpty({ each: true, message: '擅长服务标签不能为空' })
  @MaxLength(MAX_ESCORT_TAG_LENGTH, {
    each: true,
    message: `每个擅长服务标签最多 ${MAX_ESCORT_TAG_LENGTH} 个字符`,
  })
  tags!: string[];
}
