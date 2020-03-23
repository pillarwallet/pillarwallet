#!/bin/bash

PR_NUMBER=$(git log -1 --pretty=%B | grep '#' | cut -d' ' -f4 | cut -d'#' -f2)
export RELEASE_TITLE=$(curl https://api.github.com/repos/pillarwallet/pillarwallet/pulls/$PR_NUMBER | grep title | cut -d'"' -f4)
export RELEASE_DESCRIPTION=$(curl https://api.github.com/repos/pillarwallet/pillarwallet/pulls/$PR_NUMBER | grep body | cut -d'"' -f4 | sed 's/\\r//g' | sed 's/\\n/<br>/g')
