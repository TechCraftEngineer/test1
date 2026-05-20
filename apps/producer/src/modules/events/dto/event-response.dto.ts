import { ApiProperty } from '@nestjs/swagger';
import type { EventMessage } from '@repo/shared';

export class EventResponseDto {
  @ApiProperty({ example: 'published' })
  status!: string;

  @ApiProperty()
  event!: EventMessage;
}
