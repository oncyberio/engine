import { fetchUrl } from "../utils/urlutils";

var controller, signal, url;

self.addEventListener(
  "message",

  async function (e) {
    if (e.data.abort == true && controller != null) {
      controller.abort();

      return;
    }

    url = e.data.url;

    const SUPPORT_BITMAP_LOADING = e.data.bitmap;

    let bmoptions = {
      imageOrientation: e.data.imageOrientation,
    };

    controller = new AbortController();

    signal = controller.signal;

    fetchUrl(url, { signal })
      .then(async (response) => {
        if (!response.ok) {
          self.postMessage({ error: true });

          return;
        }

        const mimeType = response.headers.get("Content-Type")?.split(";")[0];

        const isSvg = mimeType.startsWith("image/svg");

        var blob = await response.blob();

        if (!isSvg && SUPPORT_BITMAP_LOADING) {
          var img = await createImageBitmap(blob, bmoptions);

          controller = null;

          self.postMessage(
            {
              image: img,

              url: url,
            },
            [img]
          );
        } else {
          controller = null;

          self.postMessage({
            url: url,

            blob: blob,
          });
        }
      })

      .catch((error) => {
        console.error(error);

        if (signal?.aborted == false) {
          self.postMessage({ error: true });
        } else {
          console.log("signal aborted");
        }
      });
  },

  false
);
