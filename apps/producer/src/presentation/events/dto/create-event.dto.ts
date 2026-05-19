import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEventDto {
  @ApiPropertyOptional({
    description:
      'UUID события (для идемпотентности). Генерируется автоматически, если не указан.',
    example: '550e8400-e29b-41d4-a716-446655440000',
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
