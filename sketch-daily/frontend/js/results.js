function onload_results() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    let draw = document.getElementById("drawing");
    fetch("/info/" + id).then((response) => {
        console.log(response);
        return response.json();
    }).then((data) => {
        console.log(data);
        document.getElementById("word").textContent = gWord = data.Info.prompt;
        document.getElementById("score").textContent = gWord = data.Info.score;
        draw.src = data.Info.path.replace("frontend/", "/");
    });
    window.addEventListener("resize", function(e) {
        draw.style.height = draw.clientWidth + "px";        
    });
    draw.style.height = draw.clientWidth + "px";        
}
