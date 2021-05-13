function timestamp(time) {
    var hours = Math.floor(time / 3600);
    var minutes = Math.floor((time - (hours * 3600)) / 60);
    var seconds = time - (hours * 3600) - (minutes * 60);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return hours + ":" + minutes + ":" + seconds;
}
browser.storage.local.get().then(
    function (x) {
        var s = "";
        var total = 0;
        var entries = Object.entries(x);
        entries.sort(([a1, a2], [b1, b2]) => (a2.time < b2.time) ? 1 : -1)
        for (const [k, v] of entries) {
            total += v.time
            s += "<a href='" + k + "'>" + v.title + "</a> -  " + timestamp(v.time) + "<br>";
        }
        s = "<b>Total:</b> " + timestamp(total) + "</br>" + s;
        $('#stuff').html(s);
    },
    function (e) {
        console.log('sad');
    }
);
