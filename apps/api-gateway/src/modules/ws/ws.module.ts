import { Module } from "@nestjs/common";
import { LiveGateway } from "./ws.gateway";

@Module({
  providers: [LiveGateway],
})
export class WsModule {}
