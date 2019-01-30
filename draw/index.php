<head>
<title>Love Notes</title>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8/jquery.min.js"></script>
<script src="js/drawing.js"></script>
<link rel="stylesheet" href="style/style.css">
</head>
<body onload="loaded()">
    <div align="center">
    <h1>Love Notes</h1>
    <h2>Happy Birthday, Breezy!</h2>
    So, my gift to you is this webapp thing. It is an online notesharing
    app for the two of us. We can draw in the box below, and when we click
    submit, it will add the drawing to the virtual quilt of all of our
    love notes to/from each other. You can use your phone, computer, whatever.
    <br/><br/>
    I got it started for us.
    <h2>Drawing</h2>
    You can adjust the size of your utensil, erase, undo, and change color.
    <br/>
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
    Here are all of our shared love notes since those dirty hackers stole my fist batch:
    <br/>
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
            $datestr = $doc["date"]->toDateTime()->format("M j, Y");
            //.toDateTime().format("M j, Y");
            echo "<img src=\"" . $doc["image"] . "\" title=\"" . $datestr .  "\">";
        }
    ?>
    <br/>
    </div>
    <code align='center'>
&nbsp;_&nbsp;&nbsp;_<br>
/J\/&nbsp;\<br>
\&nbsp;+&nbsp;&nbsp;/<br>
&nbsp;\&nbsp;B/<br>
&nbsp;&nbsp;\/<br>
      </code>
</body>
