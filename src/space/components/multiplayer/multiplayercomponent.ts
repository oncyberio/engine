// @ts-check

import { Component3D } from "engine/abstract/component3D";
import { Folder, $Param as P } from "engine/space/params";
import { IS_EDIT_MODE, IS_SERVER_MODE } from "engine/constants";

/**
 * @public
 *
 * This component is used to enable & configure multiplayer in the space.
 */
export class MultiplayerComponent extends Component3D<any> {
    //
    private _GameClient: any;

    private _playerSync: any;

    protected async init() {
        //
        if (IS_SERVER_MODE || IS_EDIT_MODE || !this.enable) return;

        await this._connect();
    }

    private async _connect() {
        //
        globalThis.$mp = this;

        // #TODO: Maybe we should move game client into engine package
        const scriptFactory = this.opts.space.resources.scriptFactory;
        this._GameClient = (scriptFactory as any).imports[
            "@oo/scripting"
        ].GameClient;
        const Player = (scriptFactory as any).imports["@oo/scripting"].Player;

        try {
            this._GameClient.join({
                host: this.url,
            });

            await this._GameClient.room.ready;

            this._playerSync = this._GameClient.room.getPlayerStateSync();

            if (Player.isHost && this.autoStart) {
                this._GameClient.room.requestStart(0);
            }
        } catch (err) {
            console.error("Multiplayer/connect", err);
        }
    }

    protected dispose() {
        //
        if (this._GameClient) {
            this._GameClient.room.leave();
            this._GameClient = null;
        }
    }

    /**
     * Public api
     */

    @Folder("General")
    enable = P.Boolean(true);

    url = P.String("", {
        name: "URL (Keep empty to use our default server)",
    });

    autoStart = P.Boolean(true, {
        name: "Auto start Game on Load",
    });

    @Folder("Room settings")
    maxPlayers = P.Number(500, {
        min: 2,
        max: 500,
    });

    patchRate = P.Number(20, {
        min: 1,
        max: 60,
    });

    reconnectTimeout = P.Number(0, {
        min: 0,
        max: 60,
    });

    authoritativePosition = P.Boolean(false, {
        name: "Authoritative Position",
    });

    serverEngine = P.Boolean(false, {
        name: "Server Simulation",
    });

    @Folder("Secrets")
    secrets = P.Map(P.Secret(), { skipLabel: true });
}
