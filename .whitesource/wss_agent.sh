curl -LJO https://github.com/whitesource/fs-agent-distribution/raw/master/standAlone/whitesource-fs-agent.jar

java -Xms1G -Xmx4G -jar whitesource-fs-agent.jar "$@"
