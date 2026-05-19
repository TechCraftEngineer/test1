import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ description: 'Текст уведомления' })
  @IsString()
  text!: string;

  @ApiPropertyOptional({ description: 'Chat ID (по умолчанию из TELEGRAM_CHAT_ID)' })
  @IsOptional()
  @IsString()
  chatId?: string;
}
