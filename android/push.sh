export buildNumber=1
export GOOGLE_JSON_DATA=$(echo "$GOOGLE_JSON_BASE64_ENCODED" | base64 --decode)
bundle exec fastlane supply init --json_key_data="$GOOGLE_JSON_DATA"
bundle exec fastlane deploy_internal --verbose
