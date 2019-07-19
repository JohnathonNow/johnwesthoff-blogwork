#!/bin/bash
cd /home/john/src/johnwesthoff-blogwork/forbrzy
rcp=$1
echo "Sending to $rcp"
out=`python2 go.py`
url=`echo $out | cut -f 1 -d' '`
perma=`echo $out | cut -f 2 -d' '`
echo "Sending $url"
echo "Sending $perma"
file=`basename "$url"`
echo "Saving to $file"
curl "$url" > $file
mpack "$file" "$rcp" -s "Enjoy a rare pupper!"
mail -s "Here's the link" -t "$rcp" <<EOF
$perma
EOF
rm "$file"
