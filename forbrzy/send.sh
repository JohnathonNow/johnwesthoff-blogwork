rcp='2158400194@vzwpics.com'
url=`python2 go.py`
file=`basename "$url"`
curl "$url" > $file
mail -t "$rcp" -A "$file" -s "Hello!"
rm "$file"
