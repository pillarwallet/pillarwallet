#!/bin/bash
set -euo pipefail

curl -o semtag https://raw.githubusercontent.com/pnikosis/semtag/v0.0.9/semtag
chmod +x semtag
SEMVER_TAG=$(git log -1  --pretty='%s' | awk 'NF>1{print $NF}' | cut -d'#' -f2 | tr '[:upper:]' '[:lower:]')

case "$SEMVER_TAG" in
	patch | minor | major)
		bash semtag final -s $SEMVER_TAG -f
		;;
	*)
		exit 1
		;;
esac