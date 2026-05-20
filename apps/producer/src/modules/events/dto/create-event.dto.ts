import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEventDto {
  @ApiPropertyOptional({
    description:
      'UUID v7 события (для идемпотентности). Генерируется автоматически, если не указан.',
    example: '0190f5e0-7e7b-7b5e-8b5e-0e7b5e8b5e0e',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'order.created' })
  @IsString()
  type!: string;

  @ApiProperty({ example: { orderId: 42, amount: 99.5 } })
  @IsObject()
  payload!: Record<string, unknown>;
}
