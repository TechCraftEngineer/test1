import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Проверка состояния сервиса' })
  @ApiOkResponse({ schema: { example: { status: 'ok', service: 'telegram' } } })
  getHealth(): { status: string; service: string } {
    return { status: 'ok', service: 'telegram' };
  }
}
