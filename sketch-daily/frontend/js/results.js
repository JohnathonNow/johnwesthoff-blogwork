function onload_results() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    let draw = document.getElementById("drawing");
    window.addEventListener("resize", function(e) {
        draw.style.height = draw.clientWidth + "px";        
    });
    draw.style.height = draw.clientWidth + "px";        
}
