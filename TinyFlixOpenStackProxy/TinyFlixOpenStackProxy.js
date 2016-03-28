var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var exec = require('child_process').exec;
var restClient = require('node-rest-client').Client;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  next();
});

var port         = 54321;
var userName     = process.env.OS_USERNAME; 
var userPswd     = process.env.OS_PASSWORD;
var tenantName   = process.env.OS_TENANT_NAME;
var KeyStoneURL  = 'http://127.0.0.1:5000/v2.0/tokens'
var NeutronURL   = 'http://127.0.0.1:9696/v2.0/networks'
var NovaURL      = 'http://127.0.0.1:8774/v2/'

app.use('/media',express.static(__dirname + '/media'));

var router = express.Router();

router.use(function(req, res, next) {
	console.log('Request Served......');
	next();
});

router.get('/', function(req, res) {
	res.json({ message: 'uname:'+userName+' pswd:'+userPswd+' tname:'+tenantName });	
});

function executeCommand(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

var getOSToken = function(callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		callback( data.access.token.id );
	});
}

var getOSTenantId = function(callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		callback( data.access.token.tenant.id );
	});
}

var getFlavors = function(callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		token    = data.access.token.id;
		tenantId = data.access.token.tenant.id; 
		var args = {headers:{"Content-Type": "application/json", "Accept": "application/json","X-Auth-Token": token}};
		client.get(NovaURL+tenantId+'/'+'flavors', args, function(data,response) {
			callback(data);
		});
	});
}

var getImages = function(callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		token    = data.access.token.id;
		tenantId = data.access.token.tenant.id; 
		var args = {headers:{"Content-Type": "application/json", "Accept": "application/json","X-Auth-Token": token}};
		client.get(NovaURL+tenantId+'/'+'images', args, function(data,response) {
			callback(data);
		});
	});
}

var getKeypairs = function(callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		token    = data.access.token.id;
		tenantId = data.access.token.tenant.id; 
		var args = {headers:{"Content-Type": "application/json", "Accept": "application/json","X-Auth-Token": token}};
		client.get(NovaURL+tenantId+'/'+'os-keypairs', args, function(data,response) {
			callback(data);
		});
	});
}

var getNetworks = function(callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		token    = data.access.token.id;
		var args = {headers:{"Content-Type": "application/json", "Accept": "application/json","X-Auth-Token": token}};
		client.get(NeutronURL,args, function(data,response) {
			callback(JSON.parse(data));
		});
	});
}

var createServer = function(callback)
{
	getOSToken(function(data) {
		var token = data;
		getOSTenantId(function(tid) {
			var tenantid = tid;
			getNetworks(function(data) {
				var netID = data.networks[0].id;
				getImages(function(data) {
					var imageID = data.images[0].id;
					var imageName = data.images[0].name;
					getFlavors(function(data) {
						var flavorID = undefined;
						for (var i in data.flavors) {
							if(data.flavors[i].name == "m1.tiny") {
								flavorID = data.flavors[i].id;
							}
						}
						var dtnow = new Date().getTime();
						var postData = '{"server": {"name": "'+imageName+dtnow+'", "imageRef": "'+imageID+'", "networks" : [{"uuid": "'+netID+'"}], "flavorRef": "'+flavorID+'", "max_count": 1, "min_count": 1}}';
						/*callback(postData);*/
						var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json", "Accept": "application/json","X-Auth-Token": token}};
						client = new restClient();
						client.post(NovaURL+tenantId+'/'+'servers',args, function(data,response) {
							callback(data);
						});
					});
				});
			});
		});
	});
}

var getServers = function(callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		token    = data.access.token.id;
		tenantId = data.access.token.tenant.id; 
		var args = {headers:{"Content-Type": "application/json", "Accept": "application/json","X-Auth-Token": token}};
		client.get(NovaURL+tenantId+'/'+'servers', args, function(data,response) {
			callback(data);
		});
	});
}

var getServerDetail = function(server_id, callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		token    = data.access.token.id;
		tenantId = data.access.token.tenant.id; 
		var args = {headers:{"Content-Type": "application/json", "Accept": "application/json","X-Auth-Token": token}}
		client.get(NovaURL+tenantId+'/'+'servers', args, function(data,response) {
			for (var i in data.servers) {
				if(data.servers[i].id == server_id) {
					client.get(NovaURL+tenantId+'/'+'servers'+'/'+server_id, args, function(resdata,response) {
						callback(resdata);
					});
				}
			}
		});
	});
}

var deleteServer = function(server_id, callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		token    = data.access.token.id;
		tenantId = data.access.token.tenant.id; 
		var args = {headers:{"Content-Type": "application/json", "Accept": "application/json","X-Auth-Token": token}}
		client.get(NovaURL+tenantId+'/'+'servers', args, function(data,response) {
			for (var i in data.servers)
			{
				if(data.servers[i].id == server_id)
				{
					console.log('deleting server'+server_id);
					client.delete(NovaURL+tenantId+'/'+'servers'+'/'+server_id, args, function(data,response) {
						callback(data);
					});
				}
			}
		});
	});
}

var deleteAllServers = function(callback)
{
	var postData = '{"auth":{ "tenantName":"'+tenantName+'", "passwordCredentials": {"username":"'+userName+'","password":"'+userPswd+'"}}}';
	var args = { data: JSON.parse(postData), headers:{"Content-Type": "application/json"} };
	client = new restClient();
	client.post(KeyStoneURL, args, function(data,response) {
		token    = data.access.token.id;
		tenantId = data.access.token.tenant.id; 
		var args = {headers:{"Content-Type": "application/json", "Accept": "application/json","X-Auth-Token": token}}
		client.get(NovaURL+tenantId+'/'+'servers', args, function(data,response) {
			var list = [];
			for (var i in data.servers)
			{
				var server_id = data.servers[i].id;
				console.log('deleting server'+server_id);
				client.delete(NovaURL+tenantId+'/'+'servers'+'/'+server_id, args, function(data,response) {
					list[i] = data.servers[i].name;
				});
			}
			callback(list);
		});
	});
}


router.route('/gettoken')

	.get(function(req, res) {
		getOSToken(function(data) {
			res.json({ message: data });
		});
	});

router.route('/gettenantid')

	.get(function(req, res) {
		getOSTenantId(function(data) {
			res.json({ message: data });
		});
	});

router.route('/getflavors')

	.get(function(req, res) {
		getFlavors(function(data) {
			res.json({ message: data });
		});
	});

router.route('/getimages')

	.get(function(req, res) {
		getImages(function(data) {
			res.json({ message: data });
		});
	});

router.route('/getnetworks')

	.get(function(req, res) {
		getNetworks(function(data) {
			res.json({ message: data });
		});
	});

router.route('/getkeypairs')

	.get(function(req, res) {
		getKeypairs(function(data) {
			res.json({ message: data });
		});
	});

router.route('/getservers')

	.get(function(req, res) {
		getServers(function(data) {
			res.json({ message: data });
		});
	});

router.route('/getservers/:server_id')

	.get(function(req, res) {
		getServerDetail(req.params.server_id, function(data) {
			res.json({ message: data });
		});
	});

router.route('/deleteservers')

	.get(function(req, res) {
		deleteAllServers(function(data) {
			res.json({ message: 'Successfully deleted' });
		});
	});

router.route('/deleteservers/:server_id')

	.get(function(req, res) {
		deleteServer(req.params.server_id, function(data) {
			res.json({ message: 'Successfully deleted' });
		});
	});

router.route('/createserver')

	.get(function(req, res) {
		createServer(function(data) {
			res.json({ message: data });
		});
	});

app.use('/api', router);

app.listen(port);
console.log('Listening on port ' + port);

