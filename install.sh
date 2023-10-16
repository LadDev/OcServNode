#!/bin/bash

#https://www.linuxbabe.com/ubuntu/openconnect-vpn-server-ocserv-ubuntu-20-04-lets-encrypt
current_dir=$PWD

sudo apt update && apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y ocserv certbot
sudo apt install build-essential checkinstall zlib1g-dev curl git unzip software-properties-common supervisor apt-utils iputils-ping traceroute dnsutils python3 pip git nano net-tools iproute2 iptables jq -y

service ocserv stop

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

[program:iptables]
command=iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE; iptables -A FORWARD -s 10.0.0.0/24 -j ACCEPT; iptables -A FORWARD -d 10.0.0.0/24 -j ACCEPT
autostart=true
autorestart=false
stdout_logfile=/var/log/ocserv_node.log
stderr_logfile=/var/log/ocserv_node_error.log
EOF

sudo tee $current_dir/api/.env > /dev/null << EOF

EOF
npm install --global speedtest-net

speedtest-net --accept-license --accept-gdpr

npm install -g pm2

cd "$current_dir/api" && npm install

cd "$current_dir/api" && pm2 start pm2.config.js

cd "$current_dir/api" && sudo chmod +x scripts/connect-script.sh
cd "$current_dir/api" && sudo chmod +x scripts/disconnect-script.sh

sudo mkdir -p /var/ocserv
sudo mkdir -p /var/ocserv/clients
sudo mkdir -p /var/ocserv/groups

iptables -t nat -A POSTROUTING -s 10.0.0.0/24 -o eth0 -j MASQUERADE; iptables -A FORWARD -s 10.0.0.0/24 -j ACCEPT; iptables -A FORWARD -d 10.0.0.0/24 -j ACCEPT

sudo apt-get install iptables-persistent -y
sudo service netfilter-persistent save
sudo service netfilter-persistent start
