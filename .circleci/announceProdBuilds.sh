#!/bin/bash
set -euo pipefail

applicationName=$1
targetEnvironment=$2
appBuildNumber=$3
pr_description=$4

payload=$(
cat <<EOM
{
    "attachments": [
        {
            "fallback": "<!here> - $applicationName deployed to $targetEnvironment.",
            "color": "#33CC66",
            "pretext": "<!here> - $applicationName deployed to $targetEnvironment.",
            "title": "build number: $appBuildNumber",
            "title_link": "https://circleci.com/workflow-run/$CIRCLE_WORKFLOW_WORKSPACE_ID",
            "text": "What's new: \n \n $pr_description",
            "ts": $(date '+%s')
        }
    ]
}
EOM
)

curl -X POST --data-urlencode payload="$payload" "$SLACK_WEBHOOK_SUPPORT_URL"
