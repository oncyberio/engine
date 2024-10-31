import { Game } from "./game";
import type { GameSignals } from "./signals";

export type AppState = "VOID" | "IDLE" | "INTRO" | "GAME" | "LOBBY";

export type RpcReply = (data: any) => void;

export type RpcHandler = (data: any, reply: RpcReply) => void;
export interface Server {
  addRpcHandler: (rpcId: string, handler: RpcHandler) => void;
}

export interface AppStateOpts {
  VOID: {};

  IDLE: {};

  INTRO: {};

  GAME: {
    game: Game;
    externalApi: any;
    server?: Server;
    disableScripts?: boolean;
    signals?: GameSignals;
    loadOpts?: {
      looseMode?: boolean;
    };
  };

  LOBBY: {};
}

export type SetStateFn = <T extends AppState>(
  state: T,
  opts: AppStateOpts[T]
) => Promise<unknown>;
