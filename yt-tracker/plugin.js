setInterval(function () {
    var url = document.getElementsByTagName('video')[0].baseURI.split('&')[0];
    if (!document.getElementsByTagName('video')[0].paused) {
        browser.storage.local.get([url]).then(
            function (x) {
                x = parseInt(x[url], 10);
                if (Number.isNaN(x) || !x) {
                    x = 0;
                }
                x += 1;
                browser.storage.local.set({ [url]: x }).then();
            });
    }
}, 1000);
