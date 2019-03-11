#!/bin/bash
cd /home/john/src/johnwesthoff-blogwork/forbrzy
rcp=$1
echo "Sending to $rcp"
url=`python2 go.py`
echo "Sending $url"
file=`basename "$url"`
echo "Saving to $file"
curl "$url" > $file
mpack "$file" "$rcp" -s "Enjoy a rare pupper!"
mail -s "Here's the link" -t "$rcp" <<EOF
$url
EOF
rm "$file"
