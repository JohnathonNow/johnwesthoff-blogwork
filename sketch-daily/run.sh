while true ; do  
    sudo cargo run -- -p 443 --key /etc/letsencrypt/live/ca.johnwesthoff.com/privkey.pem --cert /etc/letsencrypt/live/ca.johnwesthoff.com/cert.pem --words ./resources/2025-full.json 
done
