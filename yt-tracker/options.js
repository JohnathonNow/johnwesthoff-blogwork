$('#stuff').html("hi!");
browser.storage.local.get().then(
    function (x) {
        var s = "";
        for (const [k, v] of Object.entries(x)) {
            s += "<a href='" + k + "'>" + k + "</a> -  " + v + "<br>";
        }
        $('#stuff').html(s);
    },
    function(e) {
        console.log('sad');
    });
