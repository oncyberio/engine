// @ts-check

import { Component3D } from "engine/abstract/component3D";
import { VideoFactory } from "engine/components/media/video";
import VideoWrapper from "engine/components/media/video/wrapper";
import { VideoEditor } from "./editor";
import { USER_INTERACTED } from "engine/constants";
import { VideoComponentData } from "./videodata";
import { Audio, Box3 } from "three";
import audioListener from "engine/globals/audiolistener";
import { Param } from "engine/space/params";

export type { VideoComponentData } from "./videodata";

/**
 * @public
 *
 * This component is used to display a video in the game.
 *
 * See {@link VideoComponentData} for the data schema used to create a video component
 */
export class VideoComponent extends Component3D<VideoComponentData> {
    //
    #videoFactory: VideoFactory = null;

    private _video: VideoWrapper = null;

    private _interacted = false;

    private _disposers = [] as (() => void)[];

    /**
     * @internal
     */
    constructor(opts) {
        super(opts);

        this.#videoFactory = opts.videoFactory;
    }

    protected async init() {
        //
        await this._initVideo();
    }

    private get _audioSettings$() {
        //
        return this.space.options.signals.audioSettings$;
    }

    private _prevData = {
        url: null,
        preview: null,
    };

    private async _initVideo() {
        //
        this._disposeVideo();

        this._prevData.url = this.data.url;

        this._prevData.preview = this.data.preview;

        this._video = await this.#videoFactory.get(this, this.data);

        const audioSettings$ = this._audioSettings$;

        if (audioSettings$) {
            //
            this._disposers.push(
                //
                audioSettings$.onNext(() => {
                    //
                    this._updateMuted();

                    this._updateVolume();
                })
            );
        }

        USER_INTERACTED.then(() => {
            //
            this._interacted = true;

            this._updateMuted();
        });

        this.add(this._video);

        this._update3D();
    }

    private get _settingsMuted() {
        //
        if (this._audioSettings$) {
            return this._audioSettings$.value.muted;
        }

        return false;
    }

    private get _settingsVolume() {
        //
        if (this._audioSettings$) {
            return this._audioSettings$.value.volume;
        }

        return 1;
    }

    private _disposeVideo() {
        //
        if (this._video == null) return;

        this._video?.dispose();

        this.remove(this._video);

        this._video = null;
    }

    private _updateVideo() {
        //
        if (
            this.data.url !== this._prevData.url ||
            this.data.preview !== this._prevData.preview
        ) {
            return this._initVideo();
        }
    }

    private get _videoEl() {
        //
        return this._video?.videoData?.video;
    }

    private _updateMuted() {
        //
        if (!this._interacted || this._videoEl == null) return;

        this._videoEl.muted = this.data.muted || this._settingsMuted;
    }

    private _updateVolume() {
        //
        if (this._videoEl == null) return;

        this._videoEl.volume = this.data.volume * this._settingsVolume;
    }

    /**
     * @internal
     */
    onDataChange(opts) {
        //
        const res = this._updateVideo();

        this._update3D();

        if (
            opts.prev?.displayMode != this.data.displayMode ||
            opts.prev?.curvedAngle != this.data.curvedAngle
        ) {
            this._video.updateDisplayMode(this.data);
        }

        return res;
    }

    private _update3D() {
        //
        if (this._videoEl == null || this._video == null) return;

        if (this.data.autoPlay && !this.isPlaying) {
            this._video.play();
        } else if (!this.data.autoPlay && this.isPlaying) {
            this._video.pause();
        }

        this._video.opacity = this.data.opacity;

        this._updateVolume();

        this._updateMuted();
    }

    private _collisionMesh = null;

    /**
     * @internal
     */
    getCollisionMesh() {
        if (this._collisionMesh == null && this._video != null) {
            this._collisionMesh = this._video.buildCollisionMesh();

            this.add(this._collisionMesh);
        }

        return this._collisionMesh;
    }

    protected _getBBoxImp(target: Box3) {
        //
        return target.setFromObject(this.getCollisionMesh());
    }

    protected dispose() {
        //
        this._disposeVideo();
    }

    /*****************************************************************
     *                      Public API
     *****************************************************************/

    /**
     * Volume of the audio, from 0 to 1. Defaults to 1
     */
    @Param() volume = 1;

    /**
     * Whether the video should start playing automatically. Defaults to false
     */
    @Param() autoPlay = false;

    /**
     * Set the opacity of the video. Defaults to 1
     */
    @Param() opacity = 1;

    /**
     * Determine the display mode of the video. Defaults to "flat"
     */
    @Param() displayMode: "flat" | "curved" = "flat";

    /**
     * The angle of the curved video. Defaults to 180
     */
    @Param() curvedAngle = 180;

    /**
     * Whether the video should be muted. Defaults to false
     */
    @Param() muted = false;

    /**
     * Play the video
     */
    play() {
        return this._video.play();
    }

    /**
     * Pause the video
     */
    pause() {
        return this._video.pause();
    }

    /**
     * Returns true if the video is playing
     */
    get isPlaying() {
        return this._video?._isPlaying;
    }
}
