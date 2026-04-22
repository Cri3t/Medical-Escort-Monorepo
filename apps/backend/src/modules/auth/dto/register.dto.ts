import { UserRole } from '@medical-escort/database';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '用户手机号，中国大陆 11 位手机号',
    example: '13900000001',
  })
  phone!: string;

  @ApiProperty({
    description: '用户密码，长度 6-32 位',
    example: 'Test123456',
  })
  password!: string;

  @ApiProperty({
    description: '用户昵称',
    example: '张三',
    required: false,
  })
  nickname?: string;

  @ApiProperty({
    description: '用户角色',
    enum: UserRole,
    example: UserRole.USER,
    required: false,
  })
  role?: UserRole;
}
