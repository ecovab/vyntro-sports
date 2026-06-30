import { OnGatewayInit, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { subscribe } from "@vyntro/cache";

const MAIN_EVENT_CHANGED_CHANNEL = "main_event.changed";
const MATCH_UPDATED_CHANNEL = "match.updated";

/**
 * Bridges Redis pub/sub (published by trending-scorer / ingestion-sports)
 * to connected WS clients. The gateway never computes or originates data —
 * it only relays facts already decided and persisted elsewhere.
 */
@WebSocketGateway({ namespace: "/ws", cors: { origin: "*" } })
export class LiveGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private unsubscribers: Array<() => void> = [];

  afterInit(): void {
    this.unsubscribers.push(
      subscribe(MAIN_EVENT_CHANGED_CHANNEL, (payload) => {
        this.server.emit("main_event.changed", payload);
      }),
      subscribe(MATCH_UPDATED_CHANNEL, (payload) => {
        this.server.emit("match.updated", payload);
      }),
    );
  }

  handleDisconnect(): void {
    // no per-connection state to clean up — broadcasts are global
  }
}
