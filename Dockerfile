FROM frappe/frappe-worker:latest

# Install the lending app
WORKDIR /home/frappe/frappe-bench
RUN bench get-app lending https://github.com/frappe/lending || true

# If app already exists, update it
WORKDIR /home/frappe/frappe-bench/apps/lending
RUN git pull || true

WORKDIR /home/frappe/frappe-bench

