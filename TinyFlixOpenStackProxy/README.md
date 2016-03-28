README for "TinyFlixOpenStackProxy"

- this is a proxy http server to serve openstack rest apis to a web client (with CORS enabled).
- Server always listens on port 54321.
- should be run on the machine running Openstack 
- Requires node.js installation.

INSTALLING NODE.JS on Oracle Linux 6:
Run the following on the Openstack Host:
(these steps assume that the host is a oracle 6 VM)
(1) install epel repo:

	wget http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm

	rpm -ivh epel-release-6-8.noarch.rpm

(2) get oracle default REPO
	cd /etc/yum.repos.d/

	wget http://public-yum.oracle.com/public-yum-ol6.repo (adding default repo)

(3) install dependet packages (if not already there on the OpenStack:

	yum install -y redhat-rpm-config
	yum install -y openssl-devel
	yum install -y zlib-devel
	yum install -y gcc-c++

(4) install nodejs packages:
	yum install -y nodejs npm --enablerepo=epel

INSTALL dependencies for TinyFlixOpenStackProxy:
run the following command where the TinyFlixOpenStackProxy.js code exists.
(also where packages.json exists)

	npm install


Running the proxy server:

	node TinyFlixOpenStackProxy.js


Following are currently supported APIs of the TinyFlixOpenStackProxy:

http://127.0.0.1/api/gettoken
http://127.0.0.1/api/gettenantid
http://127.0.0.1/api/getflavors
http://127.0.0.1/api/getimages
http://127.0.0.1/api/getnetworks
http://127.0.0.1/api/getkeypairs
http://127.0.0.1/api/getservers
http://127.0.0.1/api/getservers/<server_id>
http://127.0.0.1/api/deleteservers
http://127.0.0.1/api/deleteservers/<server_id>
http://127.0.0.1/api/createserver

ASSUMPTIONS:

** this server assumes to have just one tenantid in the openstack
** this server assumes that a keystore_admin profile exists and has been run before starting this app
** this server will not create more than 2 VMs inside openstack

