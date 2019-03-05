rcp=$1
url=`python2 go.py`
file=`basename "$url"`
curl "$url" > $file
mpack "$file" "$rcp" -s "Enjoy a rare pupper!"
rm "$file"
