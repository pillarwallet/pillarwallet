#!/bin/bash
set -euo pipefail

applicationName=$1
targetEnvironment=$2

payload=$(
cat <<EOM
{
    "attachments": [
        {
            "fallback": "$applicationName has succesfully deployed to $targetEnvironment.",
            "color": "#33CC66",
            "pretext": "$applicationName has succesfully deployed to $targetEnvironment.",
            "title": "Repository: CIRCLE_REPOSITORY_URL, $CIRCLE_PROJECT_REPONAME #$CIRCLE_BUILD_NUM",
            "title_link": "$CIRCLE_BUILD_URL",
            "ts": $(date '+%s')
        }
    ]
}
EOM
)

curl -X POST --data-urlencode payload="$payload" "$SLACK_WEBHOOK_URL"
