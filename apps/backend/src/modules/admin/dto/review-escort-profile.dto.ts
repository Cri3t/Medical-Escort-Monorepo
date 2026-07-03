import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  MAX_ESCORT_TAG_LENGTH,
  MAX_ESCORT_TAGS,
} from '../../escort-profile/escort-tags';

export enum ReviewEscortProfileAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewEscortProfileDto {
  @ApiProperty({
    description: '审核动作',
    enum: ReviewEscortProfileAction,
    example: ReviewEscortProfileAction.APPROVE,
  })
  @IsEnum(ReviewEscortProfileAction, {
    message: '审核动作只能是 APPROVE 或 REJECT',
  })
  action!: ReviewEscortProfileAction;

  @ApiPropertyOptional({
    description: '拒绝原因。action=REJECT 时必填。',
    example: '身份证信息不清晰，请重新提交。',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((dto: ReviewEscortProfileDto) => dto.action === ReviewEscortProfileAction.REJECT)
  @IsString({ message: '拒绝原因必须是字符串' })
  @MinLength(1, { message: '拒绝原因不能为空' })
  reason?: string;

  @ApiPropertyOptional({
    description: '最终确认的擅长服务标签。action=APPROVE 时必填，运行时结构为 string[]',
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
  @ValidateIf((dto: ReviewEscortProfileDto) => dto.action === ReviewEscortProfileAction.APPROVE)
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
  tags?: string[];
}
