temp_file=`mktemp`
rcp='2158400194@vtext.com'
curl `python2 go.py` > $temp_file
mail "$rcp" -A "$temp_file"
rm "$temp_file"
