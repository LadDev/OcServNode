#!/bin/bash

#https://www.linuxbabe.com/ubuntu/openconnect-vpn-server-ocserv-ubuntu-20-04-lets-encrypt
current_dir=$PWD

sudo apt update && apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y ocserv certbot
sudo apt install build-essential checkinstall zlib1g-dev curl git unzip software-properties-common supervisor apt-utils iputils-ping traceroute dnsutils python3 pip git nano net-tools iproute2 iptables -y

service ocserv stop

#sudo systemctl enable ocserv

# Вывод информации об успешной установке и настройке
echo "OpenConnect VPN-сервер (Ocserv) успешно установлен и настроен."
echo "Вы можете настроить дополнительные параметры в файле /etc/ocserv/ocserv.conf."
echo "Перезапустите Ocserv с помощью команды 'sudo systemctl restart ocserv' после внесения изменений."


echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/60-custom.conf
echo "net.core.default_qdisc=fq" | sudo tee -a /etc/sysctl.d/60-custom.conf
echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.d/60-custom.conf
sudo sysctl -p /etc/sysctl.d/60-custom.conf

curl -sL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

sudo tee /etc/supervisor/conf.d/ocserv_node.conf > /dev/null << EOF
[supervisord]
nodaemon=true
user=root


[program:ocserv_node]
command=npm run start:pm2
directory=$current_dir/api
autostart=true
autorestart=false
stdout_logfile=/var/log/ocserv_node.log
stderr_logfile=/var/log/ocserv_node_error.log
EOF

RUN npm install -g pm2

cd "$current_dir/api" && npm install


