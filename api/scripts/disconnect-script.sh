#!/bin/bash

## Путь к файлу для сохранения данных
#LOGFILE="/root/OcServNode/api/connect_log.txt"
#
## Дата и время вызова скрипта
#echo "Script invoked at $(date)" >> $LOGFILE
#
## Печать всех переменных окружения в файл
#printenv >> $LOGFILE
#
## Добавить разделитель для удобства чтения
#echo "-----------------------------------" >> $LOGFILE

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

/bin/node "$DIR/user_disconnect.js" USERNAME=$USERNAME INVOCATION_ID=$INVOCATION_ID GROUPNAME=$GROUPNAME DEVICE=$DEVICE IP_REAL=$IP_REAL IP_REMOTE=$IP_REMOTE IP_REAL_LOCAL=$IP_REAL_LOCAL ID=$ID VHOST=$VHOST STATS_BYTES_OUT=$STATS_BYTES_OUT STATS_BYTES_IN=$STATS_BYTES_IN HOSTNAME=$HOSTNAME
if [ $? -eq 1 ]; then
    exit 1
else
    exit 0
fi
