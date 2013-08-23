var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

/**
 * Remix Schema
 */

var RemixSchema = new Schema({
	title: String,
	user: {type : Schema.ObjectId, ref :'User'},
	clips: [{type: Schema.ObjectId, ref: 'Clip'}],
	created_at: {type : Date, default : Date.now},
	featured: {type: Boolean, default : false},
	videogami_rid: {},
	gifs: [],
});

RemixSchema.statics = {
	findRemixes: function(options, cb) {
		var qr = {};
		if(options.date_lt){
			qr =  {created_at: {$lt: new Date(options.date_lt)}};
		}
		if(!options.limit) {
			options.limit = 10;
		}
		var query = this.find(qr)
			.sort({'created_at': -1})
			.limit(options.limit)
			.populate('user', 'name username')
			.populate('clips', 'videogami_vid gif created_by created_at approved');	
		if(!options.pub) {query.where('user').equals(options.user._id);}
		if(typeof options.featured !== "undefined") {query.where('featured', options.featured);}
		query.exec(cb);
	},
	findById: function(id, cb) {
		this.findOne({'_id': id})
			.populate('user', 'name username')
			.populate('clips', 'videogami_vid gif created_by created_at approved')
			.exec(cb);
	}
};
mongoose.model('Remix', RemixSchema);