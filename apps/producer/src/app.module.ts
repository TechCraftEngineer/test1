import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '@repo/health';
import configuration from './common/config/configuration';
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '../../.env',
    }),
    EventsModule,
    HealthModule.forService('producer'),
  ],
})
export class AppModule {}
