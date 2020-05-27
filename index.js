module.exports = class extends window.casthub.module {
    /**
     * Initialize the new Module.
     */
    constructor() {
        super();

        this.ws = null;
        this.connected = false;

    }

    onConnected() {
        const { integration } = this.identity;

        switch(integration) {
            case "spotify":
                this.fetchSpotify();
                setInterval(() => this.fetchSpotify(), 3000);
                break;
            default:
                console.log(`${integration} is not supported`);
                break;
        }

    }

    sendFileData(filename, data) {
        let fileObject = {
            "filename": filename,
            "data": data
        }
        this.ws.send(JSON.stringify(fileObject));
    }

    async fetchSpotify() {

        const filename = 'spotify.json';

        try {
            const data = await window.casthub.fetch({
                integration: 'spotify',
                method: 'GET',
                url: 'me/player',
            });

            if (data.item) {
                let info = {};

                info.title = data.item.name;
                info.artist = data.item.artists.map(artist => artist.name)[0];
                info.album = null;

                // Find the Album Image.
                if (data.item.album && data.item.album.images.length) {
                    const total = data.item.album.images.length;
                    let item = null;

                    for (let i = 0; i < total; i++) {
                        const img = data.item.album.images[i];

                        // Find the smallest image that's above 100px wide.
                        if ( item === null || ( img.width >= 100 && img.width < item.width )) {
                            item = img;
                        }
                    }

                    info.album = item.url;
                }

                this.sendFileData(filename, info);
            }
        } catch (e) {
            this.sendFileData(filename, {});
            console.log(e);
        }

    }

    /**
     * Run any asynchronous code when the Module is mounted to DOM.
     *
     * @return {Promise}
     */
    async mounted() {

        this.connected = await new Promise((resolve) => {
            const WebSocketClient = window.casthub.libs.ws;
            this.ws = new WebSocketClient('ws://localhost:32101', [], {
                backoff: "fibonacci"
            });

            this.ws.onopen = (event) => {
                this.onConnected();
                resolve(true);
            }

            this.ws.onerror = (event) => {
                console.log("Not connected!");
                resolve(false);
            }
        });
        await super.mounted();
    }

};
