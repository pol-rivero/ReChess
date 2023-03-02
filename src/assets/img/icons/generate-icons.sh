#!/usr/bin/env bash

# Scans for .svg files in the script directory and outputs icons.scss

# Get the directory of the script
DIR="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
OUT_FILE="$DIR/icons.scss"

APPEND_DIR="@/assets/img/icons/"

echo "/* This file is generated by generate-icons.sh */" > $DIR/icons.scss
echo "/*       Do not edit this file directly        */" >> $DIR/icons.scss

# Get a list of all .svg files in the directory
for file in "$DIR"/*.svg
do
    # Get the file name without the extension
    filename=$(basename -- "$file")
    extension="${filename##*.}"
    filename="${filename%.*}"
    
    file_url="$APPEND_DIR$filename.$extension"
    
    echo "" >> $DIR/icons.scss
    echo "/* $filename.$extension */" >> $DIR/icons.scss
    echo ".icon-$filename {" >> $DIR/icons.scss
    echo "    -webkit-mask-image: url(\"$file_url\");" >> $DIR/icons.scss
    echo "    mask-image: url(\"$file_url\");" >> $DIR/icons.scss
    echo "    -webkit-mask-repeat: no-repeat;" >> $DIR/icons.scss
    echo "    mask-repeat: no-repeat;" >> $DIR/icons.scss
    echo "    width: 100%;" >> $DIR/icons.scss
    echo "    height: 100%;" >> $DIR/icons.scss
    echo "    -webkit-mask-position: center;" >> $DIR/icons.scss
    echo "    mask-position: center;" >> $DIR/icons.scss
    echo "}" >> $DIR/icons.scss
    echo "" >> $DIR/icons.scss
done
    
echo "/* End of generated file */" >> $DIR/icons.scss