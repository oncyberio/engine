export interface ServerApi {
    //
    disconnectPlayer(playerId: string): void;

    onJoin(cb: (player: any) => void): void;

    onLeave(cb: (player: any) => void): void;

    send(type: string | number, message: any, playerId: string): void;

    broadcast(type: string | number, message: any, exclude?: string[]): void;

    onMessage(
        type: string,
        cb: (message: any, playerId: string) => void
    ): () => void;
}

export declare let GameServer: ServerApi;
