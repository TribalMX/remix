var request = require('request')
  , qs = require('querystring')
  , mongoose = require('mongoose')
  , videogami = require('../config/videogami')
  , User = mongoose.model('User') 
  , Remix = mongoose.model('Remix')
  , Clip = mongoose.model('Clip');

exports.getAllRemixes = function(req, res) {

	var data= req.query;
	data.username = videogami.user;
	data.token = videogami.api_key;

	request.get({
		url: videogami.host + "/remixes",
		qs: data,
		json: true,
	}, function (error, response, body) {
	   res.send(body); 
	});
};

exports.getRemixes = function(req, res) {
	//get from db and query by id, or username
	var data = {}
	  , options = req.query;
	data.username = videogami.user;
	data.token = videogami.api_key;
	options.user = req.user;

	Remix.findRemixes(options, function(err, remixes){
		 if (err) {
			console.log(err);
			return res.send(500);
		}
		//query by id from vdgami server
		var totalNumb = 0;
		for(var i = 0; i < remixes.length; i++) {
			for(var j = 0; j < remixes[i].clips.length; j++) {
				totalNumb++;
			}
		}
		if(totalNumb == 0) res.send([]);
		var numGifs = 0; 
		//Get gif url for each clips of eaxh remix 
		for (var i = 0; i < remixes.length; i++) {
			(function(i) {
				for(var j = 0; j < remixes[i].clips.length; j++) {
					(function(j){
						//Request to videogami server
						request.get({
							url: videogami.host + "/video/" + remixes[i].clips[j].videogami_vid,
							qs: data,
							json: true,
						}, function (error, response, body) {
							numGifs++;
							if(body.video && body.video.gifs) {
								remixes[i].gifs[j] = body.video.gifs.fast;
								remixes[i].clips[j].gif = body.video.gifs.fast;
							} else {
								remixes[i].gifs[j] = "Not Found";
                remixes[i].clips[j].gif ="Not Found";
							}
							//When every gifs are loaded
							if(numGifs == totalNumb){
								res.send(remixes);
							}
						});
					})(j);
				}
			})(i);
		}
	});
};
exports.getClips = function(req, res) {
	var data = {}
	  , options = req.query;
	data.username = videogami.user;
	data.token = videogami.api_key;
	options.user = req.user;
	Clip.findClips(options, function(err, clips){
		// console.log(clips);
		var length  = 0;
		if (err) {
			console.log(err);
			return res.send(500);
		}
		if(clips.length == 0) res.send([]);
		//query by id from vdgami server   //Later, get all by this user and then query from here maybe
		for (var i = 0; i < clips.length; i++) {
			(function(i) {
				//Request to videogami server
				request.get({
					url: videogami.host + "/video/" + clips[i].videogami_vid,
					qs: data,
					json: true,
				}, function (error, response, body) {
					length++;
					if(body.video && body.video.gifs) {
						clips[i].gif = body.video.gifs.fast;
					} else {
						clips[i].gif = "Not Found";
					}
					if(length == clips.length){
						res.send(clips);
					}
				});
			})(i);
		}
	});
};

exports.postRemix = function(req, res) {
	var data= {} //form data for reqeust to videogami server
	  , clips = req.body.clips
	  , clip_ids = []
	  , clip_gifs = [];

	data.title = req.body.title;
	data.username = videogami.user;
	data.token = videogami.api_key;
	data.videos = [];
	for(var i = 0; i < clips.length; i++){
		data.videos.push(clips[i].videogami_vid);
		clip_ids.push(clips[i]._id);
		clip_gifs.push(clips[i].gif);
	}
	//Request to videogami server
	request.post({
		uri:videogami.host + "/remix",
		form: data,
		json: true,
	}, function (error, response, body) {
		if(body.remix){
			var obj = {
				title: req.body.title,
				user: req.user,
				clips: clip_ids,
				videogami_rid: body.remix._id,
			};
			var remix = new Remix(obj);
			remix.save(function(err, result){
				remix.gifs = clip_gifs;
				if (err) {
					console.log("Error saving remix", err);
					return res.send(500);
				} 
				res.send(remix);
			});
		} else {
			//Handle error
		}
	});
};

exports.postClip = function(req, res) {
	var clip = new Clip(req.body);  
	clip.user = req.user;
	if(!req.body.created_by) {
		clip.created_by = req.user;
	} 
	clip.save(function(err, result){
		if (err) {
			console.log("Error saving clip", err);
			return res.send(500);
		}
		clip.gif = req.body.gif;
		res.send(clip);
	});
};



exports.upload = function(req, res) {
	var path = "/city/" + req.path.substring('/uploadApi/'.length)
	  , body = req.body
	  , query = req.query;
	body.username = videogami.user;
	body.token = videogami.api_key;
	query.username = videogami.user;
	query.token = videogami.api_key;

	var reqObj = {
		method: req.method,
		form: req.body,
		qs: req.query,
		url: videogami.host + path,
		json: true
	};
	//Request to videogami server
	request(reqObj, function (error, response, body) {
		res.send(body);
	});
};
