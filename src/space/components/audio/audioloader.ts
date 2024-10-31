import { USER_INTERACTED } from "engine/constants";



export class AudioLoader {

    _cache: Record<string,Promise<Blob>> = {}

    _interacted = false;

    _urls : Record<string, string> = {};


    private fetchAudio(url: string) {

        if (this._cache[url] == null) {

            this._cache[url] = fetch(url).then((response) => {

                if (response.ok) {
                    return response.blob();
                }

                throw new Error("Failed to load audio at " + url);
            })
        }

        return this._cache[url];
    }

    async loadAudio(url: string) {

        const blob = await this.fetchAudio(url);

        let blobUrl = this._urls[url];

        if (blobUrl == null) {

            blobUrl = URL.createObjectURL(blob);

            this._urls[url] = blobUrl;
        }

        const audio = new Audio();

        audio.muted = true;

        USER_INTERACTED.then(() => {
            this._interacted = true;
            audio.muted = false;
        })

        audio.src = blobUrl;

        return audio;
    }

    dispose() {

        for (let url in this._urls) {

            URL.revokeObjectURL(this._urls[url]);
        }

        for (let url in this._cache) {

            this._cache[url] = null
        }
    }
}