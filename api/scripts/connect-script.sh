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


node user_connect.js "$@"
if [ $? -eq 1 ]; then
    exit 1
else
    exit 0
fi
