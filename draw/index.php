<head>
<title>Love Notes</title>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8/jquery.min.js"></script>
<script src="js/drawing.js"></script>
<link rel="stylesheet" href="style/style.css">
</head>
<body onload="loaded()">
    <div align="center">
    <h1>Love Notes</h1>
    <h2>Drawing</h2>
    <canvas id="canvas"></canvas>
    <br>
    <input type="color" id="colorpicker">
    <input type="range" id="size" value="5" min="1" max="50">
    <button onclick="erase();">Eraser</button>
    <button onclick="pencil();">Pencil</button>
    <button onclick="undo();">Undo</button>
    <br>
    <button onclick="send();">Submit</button>
    <div id="imagediv"></div>
    <h2>Gallery</h2>
    <?php
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
        require 'vendor/autoload.php';
        $collection = (new MongoDB\Client)->love->notes;
        $filter  = [];
        $options = ['sort' => ['date' => 1]];
        $cursor = $collection->find($filter, $options);
        foreach ($cursor as $doc)
        {
            echo "<img src=\"" . $doc["image"] . "\">";
        }
    ?>
    </div>
</body>
