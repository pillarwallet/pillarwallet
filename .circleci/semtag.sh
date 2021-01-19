#!/bin/bash
set -euo pipefail

curl -o semtag https://raw.githubusercontent.com/pnikosis/semtag/v0.0.9/semtag
chmod +x semtag
SEMVER_TAG='pillarwallet/develop'

case "$SEMVER_TAG" in
	patch)
		#bash semtag final -s $SEMVER_TAG
        echo "All good - patch"
		;;
	minor)
		#bash semtag final -s $SEMVER_TAG
        echo "All good - minor"
		;;
	major)
		#bash semtag final -s $SEMVER_TAG
        echo "All good - major"
		;;
	*)
		exit 1
		;;
	esac