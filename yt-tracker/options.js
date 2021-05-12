$('#stuff').html("hi!");
browser.storage.local.get().then(
    function (x) {
        var s = "";
        for (const [k, v] of Object.entries(x)) {
            var hours = Math.floor(v.time / 3600);
            var minutes = Math.floor((v.time - (hours * 3600)) / 60);
            var seconds = v.time - (hours * 3600) - (minutes * 60);

            if (hours < 10) { hours = "0" + hours; }
            if (minutes < 10) { minutes = "0" + minutes; }
            if (seconds < 10) { seconds = "0" + seconds; }
            var time = hours + ":" + minutes + ":" + seconds;
            s += "<a href='" + k + "'>" + v.title + "</a> -  " + time + "<br>";
        }
        $('#stuff').html(s);
    },
    function (e) {
        console.log('sad');
    });
