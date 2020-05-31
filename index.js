module.exports = class extends window.casthub.module {
    /**
     * Initialize the new Module.
     */
    constructor() {
        super();

        this.$header = window.casthub.create('header');
        this.$header.icon = 'spotify';
        this.$header.color = '#1db954';
        this.$header.innerText = 'Now Playing';
        this.addEl(this.$header);

    }

    /**
     * Run any asynchronous code when the Module is mounted to DOM.
     *
     * @return {Promise}
     */
    async mounted() {
        await super.mounted();

        await this.refresh();

        setInterval(() => this.refresh(), 3000);
    }

    async refresh() {

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

                await this.filesystem.set('nowPlaying', data);
                // Write to file system here
            }
        } catch (e) {
            // Write to file system blank object
            await this.filesystem.set('nowPlaying', {});
            console.log("Can't find current song from Spotify", e);
        }

    }

};
