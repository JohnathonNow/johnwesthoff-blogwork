#!/bin/bash
./main.py > out.html
wkhtmltopdf --title "Lemmy.world Hot Feed"  out.html out.pdf
