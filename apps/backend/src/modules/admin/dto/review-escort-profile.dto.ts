import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, MinLength, ValidateIf } from 'class-validator';

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
}
