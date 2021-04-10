file-cleaner
=======


file-cleaner
--------

Install a recent stable [rust](https://rustup.rs/), clone this repo,
and run `cargo build`.

Running
-------

Simply run the built executable in any directory where you suspect you 
have duplicate files. It will then spit out lines of the form
`rm $FILE_TWO # same as $FILE_ONE` for every pair of files
it deems too similar.

Methodology
-----------

It compares the number of matching trigrams between pairs of files,
and if the percentage of matches exceeds a threshold the pair
is flagged.

