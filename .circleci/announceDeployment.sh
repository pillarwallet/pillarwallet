#!/bin/bash
set -euo pipefail

applicationName=$1
targetEnvironment=$2
appBuildNumber=$3
packageLink=$4

payload=$(
cat <<EOM
{
    "attachments": [
        {
            "fallback": "$applicationName deployed to $targetEnvironment.",
            "color": "#33CC66",
            "pretext": "$applicationName deployed to $targetEnvironment.",
            "title": "$CIRCLE_PROJECT_REPONAME",
            "title_link": "$packageLink",
            "text": "build number: $appBuildNumber",
            "ts": $(date '+%s')
        }
    ]
}
EOM
)

curl -X POST --data-urlencode payload="$payload" "$SLACK_WEBHOOK_URL"
