#!/bin/bash
set -euo pipefail

applicationName=$1
targetEnvironment=$2
publishedPlatform=$3
publishedURL=$4

payload=$(
cat <<EOM
{
    "attachments": [
        {
            "fallback": "$applicationName *$targetEnvironment* $publishedPlatform:$CIRCLE_BUILD_NUM artifact URL is available at:",
            "color": "#33CC66",
            "pretext": "$applicationName *$targetEnvironment* $publishedPlatform:$CIRCLE_BUILD_NUM artifact URL is available at:",
            "title": "$applicationName-$targetEnvironment-$publishedPlatform-$CIRCLE_BUILD_NUM",
            "title_link": "$publishedURL",
            "text": "^ Copy Link Address from above ^",
            "ts": $(date '+%s')
        }
    ]
}
EOM
)

curl -X POST --data-urlencode payload="$payload" "$S3_URL_SLACK_WEBHOOK"
