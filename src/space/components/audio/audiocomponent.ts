export type { AudioComponentData } from "./audiodata";
import { Component3D } from "engine/abstract/component3D";
import { AudioLoader } from "./audioloader";
import { AudioComponentData } from "./audiodata";
import { USER_INTERACTED } from "engine/constants";
import { Formats, Param, Folder, Trigger } from "engine/space/params";

/**
 * @public
 *
 * Audio component, used to play audio in the game
 *
 * See {@link AudioComponentData} for the data schema used to create an audio component
 */
export class AudioComponent extends Component3D<AudioComponentData> {
  //
  private _audio: HTMLAudioElement;

  private _loader: AudioLoader = null;

  private _isPlaying: boolean = false;

  private _disposers = [] as (() => void)[];

  protected async init() {
    //

    this._audio = await this._loader.loadAudio(this.data.url);

    this._audio.addEventListener("ended", (event) => {
      //
      this._isPlaying = false;
    });

    this._changeCallbacks.volume(this.data.volume);

    this._changeCallbacks.loop(this.data.loop);

    this._changeCallbacks.playbackRate(this.data.playbackRate);

    if (this.data.autoPlay) {
      this.play();
    }

    const audioSettings$ = this._audioSettings$;

    if (audioSettings$) {
      //
      this._disposers.push(
        audioSettings$.onNext((val) => {
          //
          this._updateAudioSettings();
        })
      );
    }
  }

  private get _audioSettings$() {
    //
    return this.space.options.signals.audioSettings$;
  }

  private _updateAudioSettings = () => {
    //
    const audioSettings$ = this._audioSettings$;

    this._audio.muted = audioSettings$.value.muted;

    this._changeCallbacks.volume(this.data.volume);
  };

  protected _changeCallbacks = {
    volume: (value) => {
      const settingsValue = this._audioSettings$.value;

      let settingsVolume = 1;

      if (settingsValue) {
        //
        settingsVolume =
          (this.data.ambient ? settingsValue.volumeBG : settingsValue.volume) ??
          1;
      }

      this._audio.volume = value * settingsVolume;
    },
    loop: (value) => {
      this._audio.loop = value;
    },
    playbackRate: (value) => {
      this._audio.playbackRate = value;
    },
    autoPlay: (value) => {
      if (value) {
        this.play();
      } else {
        this.pause();
      }
    },
  };

  protected dispose() {
    //
    this.stop();

    this._disposers.forEach((disposer) => {
      //
      disposer();
    });
  }

  /*****************************************************************
   *                      Public API
   *****************************************************************/

  /**
   * play the audio
   */
  play() {
    this._isPlaying = true;

    USER_INTERACTED.then(() => {
      //
      if (!this.isPlaying) return;

      this._audio.play();
    });
  }

  /**
   * pause the audio
   */
  pause() {
    //
    this._isPlaying = false;

    this._audio.pause();
  }

  /**
   * stop the audio, this will reset the audio to the beginning
   */
  stop() {
    this._isPlaying = false;

    this._audio.currentTime = 0;
    this._audio.pause();
  }

  /**
   * Returns true if the audio is playing
   */
  get isPlaying() {
    return this._isPlaying;
  }

  @Folder("Controls")

  /**
   * Whether the audio should start playing automatically. Defaults to false
   */
  @Param({ name: "Auto Play" })
  autoPlay = false;

  /**
   * Volume of the audio, from 0 to 1. Defaults to 1
   */
  @Param({
    format: Formats.pct,
    min: 0,
    max: 100,
    step: 1,
  })
  volume = 1;

  /**
   * weather the audio is used to play a background music. Defaults to false
   */
  @Param({ name: "Background Music" }) ambient = false;

  /**
   * Whether the audio should loop. Defaults to false
   */
  @Param() loop = false;

  /**
   * audio playback rate. Defaults to 1
   */
  @Param({
    min: 0.5,
    max: 2,
    step: 0.1,
  })
  playbackRate = 1;

  @Trigger({ name: "Test Audio", visible: (it) => !it.isPlaying })
  protected _playTrigger() {
    this.play();
  }

  @Trigger({ name: "Pause", visible: (it) => it.isPlaying })
  protected _pauseTrigger() {
    this.pause();
  }
}
