#!/bin/bash

for i in $( gem list --local --no-version | grep cocoapods );
do
    yes | sudo gem uninstall $i;
done
