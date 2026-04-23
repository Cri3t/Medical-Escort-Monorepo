import { UserRole } from '@medical-escort/database';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: '用户手机号，中国大陆 11 位手机号',
    example: '13900000001',
  })
  @Transform(({ value }) => String(value ?? '').trim())
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号' })
  phone!: string;

  @ApiProperty({
    description: '用户密码，长度 6-32 位',
    example: 'Test123456',
  })
  @Transform(({ value }) => String(value ?? ''))
  @Length(6, 32, { message: '密码长度必须为 6-32 位' })
  password!: string;

  @ApiProperty({
    description: '用户昵称',
    example: '陪诊用户',
    required: false,
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({
    description: '用户角色',
    enum: UserRole,
    example: UserRole.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: '用户角色不合法' })
  role?: UserRole;
}
