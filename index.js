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
            case "twitter":
                this.fetchTwitter();
                setInterval(() => this.fetchSpotify(), 1000*60);
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
            const response = await window.casthub.fetch({
                integration: 'spotify',
                method: 'GET',
                url: 'me/player',
            });

            if (response.item) {
                let data = {};

                data.title = response.item.name;
                data.artist = response.item.artists.map(artist => artist.name)[0];
                data.album = null;

                // Find the Album Image.
                if (response.item.album && response.item.album.images.length) {
                    const total = response.item.album.images.length;
                    let item = null;

                    for (let i = 0; i < total; i++) {
                        const img = response.item.album.images[i];

                        // Find the smallest image that's above 100px wide.
                        if ( item === null || ( img.width >= 100 && img.width < item.width )) {
                            item = img;
                        }
                    }

                    data.album = item.url;
                }

                this.sendFileData(filename, data);
            }
        } catch (e) {
            this.sendFileData(filename, {});
            console.log(e);
        }

    }

    async fetchTwitter() {

        const filename = 'twitter.json';

        try {
            let data = {};

            const response = await window.casthub.fetch({
                integration: 'twitter',
                method: 'GET',
                url: 'followers/list',
            });
            

            let recentFollowers = response.users.slice(0,5);
            data.followers = recentFollowers.map(follower => {
                return follower.screen_name;
            });

            this.sendFileData(filename, data);

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
