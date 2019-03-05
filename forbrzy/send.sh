rcp=$1
url=`python2 go.py`
file=`basename "$url"`
curl "$url" > $file
mail -t "$rcp" -A "$file" -s "Hello!" < /dev/null
rm "$file"
