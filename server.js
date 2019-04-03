// Import all the needed libraries
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const htem = require('./htem.js');
const crypto = require('crypto');
const salt = '213mkfdsanj432';

// Setup the connection to the mySQL database
const knex = require('knex')({
	client: 'mysql',
	connection: {
	    user: 'root',
	    password: '',
		database : 'materials'
	}
});

// Setup the server's views and static dir
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

// Handle any socket connections
io.on('connection', function(socket){
	
});

//Handle when the user gets a the material page
app.get('/material/[0-9]+', (req, res) => {
	var sampleId = parseInt(/[0-9]+/.exec(req.path));
	getSampleData(sampleId, (sampleData) =>{
		res.render('material', sampleData);
	});
});

// Gets the data of the material with the given id returned in the callback as an object
function getSampleData(sampleId, callback){
	knex.select().table('samples')
	.innerJoin('libraries', 'samples.library_id', 'libraries.library_id')
	.where({'samples.sample_id': sampleId})
	.then((sample) => {
		
		if(sample==null || sample.length==0)
			return;
		var sample = sample[0];
		
		knex.select().table('compounds').where({sample_id: sampleId}).then((compounds) => {
			knex.select().table('elements').where({sample_id: sampleId}).then((elements) => {
				knex.select().table('fpm').where({sample_id: sampleId}).then((fpm) => {
					knex.select().table('deposition_compounds').where({library_id: sample.library_id}).then((deposition_compounds) => {
						knex.select().table('gasses').where({library_id: sample.library_id}).then((gasses) => {
							callback({sample: sample, compounds: compounds, elements: elements, fpm: fpm, deposition_compounds: deposition_compounds, gasses: gasses});
						});
					});
				});
			});
		});
});
}

// Handle when the user tries to search
app.post('/search', (req, res) => {
	
	// Find the samples with the given properties
	knex.select().table('samples')
		.innerJoin('libraries', 'samples.library_id', 'libraries.library_id')
		.where((builder) =>{
			searchFor(req.body.sample, builder);
		})
		.then((samples) => {
			
			// Get all the search queries for the sub properties given
			var searchQueries = [];
			if(req.body.compounds){
				searchQueries.push((sample_ids)=>{
					return knex.select().table('compounds').whereIn('sample_id', sample_ids).andWhere((builder) =>{
						searchFor(req.body.compounds, builder);
					});
				});
			}
			if(req.body.elements){
				searchQueries.push((sample_ids)=>{
					return knex.select().table('elements').whereIn('sample_id', sample_ids).andWhere((builder) =>{
						searchFor(req.body.elements, builder);
					});
				});
			}
			if(req.body.fpm){
				searchQueries.push((sample_ids)=>{
					return knex.select().table('fpm').whereIn('sample_id', sample_ids).andWhere((builder) =>{
						searchFor(req.body.fpm, builder);
					});
				});
			}
			if(req.body.deposition_compounds){
				searchQueries.push((sample_ids)=>{
					return knex.select().table('deposition_compounds').whereIn('sample_id', sample_ids).andWhere((builder) =>{
						searchFor(req.body.deposition_compounds, builder);
					});
				});
			}
			if(req.body.gasses){
				searchQueries.push((sample_ids)=>{
					return knex.select().table('gasses').whereIn('sample_id', sample_ids).andWhere((builder) =>{
						searchFor(req.body.gasses, builder);
					});
				});
			}
			
			// Get all the samples that fullfill those sub properties
			var sample_ids = [];
			for(var i=0;i<samples.length;i++)
				sample_ids[i] = samples[i].sample_id;
			if(searchQueries.length>0)
				(() =>{
					var i = 0;
					var nextQuery = (samples) => {
						var sample_ids = [];
						for(var i=0;i<samples.length;i++)
							sample_ids[i] = samples[i].sample_id;
						if(i++<searchQueries.length)
							searchQueries[i](sample_ids).then(nextQuery);
						else
							res.render('searchResult', {sample_ids: sample_ids});
					}
					searchQueries[i](sample_ids).then(nextQuery);
				})();
			else
				res.render('searchResult', {sample_ids: sample_ids});
		});
});

// Search for properties in database
function searchFor(toSearch, query){
	for (var property in toSearch){
		if (toSearch.hasOwnProperty(property)){
			if(toSearch[property].min){
				if(toSearch[property].max)
					query.whereBetween(property, [toSearch[property].min, toSearch[property].max]);
				else
					query.where(property, '>=', toSearch[property].min);
			}
			else if(toSearch[property].max)
				query.where(property, '<=', toSearch[property].max);
			else if(Array.isArray(toSearch[property]))
				query.whereIn(property, toSearch[property]);
			else
				query.where(property, toSearch[property]);
			
		}
	}
}


// Handle when the user gets the main page
app.get('/', (req, res) => {
	knex.select().table('samples').then((samples) => {
		res.redirect("/materialSearch.html");
	});
});

// Handle login request
app.post('/signin', (req, res) => {
	knex('users').select().where({email:req.body.email}).then(([user]) => {
		if(req.body.password == user.password)
			res.send({userId: user.user_id});
		else
			res.send({userId: -1});
	});
});

// Handle create user request
app.post('/signup', (req, res) => {
	var newUser = {name: req.body.name, 
					email: req.body.email, 
					password: req.body.password};
	console.log(req.body);
	knex('users').insert(newUser).then((user)=>{
		console.log(user);
		res.send({userId: user.user_id});
	}).catch(function(error) {
		res.send({userId: -1});
	});
});

// Start the server
server.listen(3000, () => console.log('Example app listening on port 3000!'));
/*
htem.test(knex, (error) => {
	if(error)
		console.log(error);
	else
		console.log("FINISHED");
}, (part, full, text) =>{
	io.emit('update progress', {
		part: part,
		full: full,
		text: text
	});
}, (part, full, text) =>{
	io.emit('update subprogress', {
		part: part,
		full: full,
		text: text
	});
});*/