<?php
    require 'vendor/autoload.php';
    $collection = (new MongoDB\Client)->pb->pastebin;
    $method = $_SERVER['REQUEST_METHOD'];
    if ('POST' === $method) {
        $doc = $collection->insertOne([
            'raw' => $_POST['raw'],
        ]);
        echo $doc->getInsertedId();
    } else {
        $found = $collection->findOne(array('_id' => new MongoDB\BSON\ObjectId($_GET['id'])));
        echo $found['raw'];
    }
?>
