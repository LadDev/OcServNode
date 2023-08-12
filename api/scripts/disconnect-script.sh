#!/bin/bash

# Путь к файлу для сохранения данных
LOGFILE="/root/OcServNode/api/disconnect_log.txt"

# Дата и время вызова скрипта
echo "Script invoked at $(date)" >> $LOGFILE

# Печать всех переменных окружения в файл
printenv >> $LOGFILE

# Добавить разделитель для удобства чтения
echo "-----------------------------------" >> $LOGFILE

exit 0
