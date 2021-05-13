setInterval(function () {
    var url = document.getElementsByTagName('video')[0].baseURI.split('&')[0];
    if (!document.getElementsByTagName('video')[0].paused) {
        browser.storage.local.get([url]).then(
            function (x) {
                var channel = $('#upload-info #channel-name #text a');
                var data = x[url] || {time: 0};
                data.time += 1;
                data.title = document.title.slice(0, -(" - YouTube".length));
                data.channelName = channel.html();
                data.channelUrl = channel.attr('href');
                browser.storage.local.set({ [url]: data }).then();
            });
    }
}, 1000);